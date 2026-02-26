"""
Agent API views.

Provides:
- POST /api/agent/run/      → full JSON response
- GET  /api/agent/stream/   → SSE streaming response
- GET  /api/agent/health/   → health-check
"""

import asyncio
import json

from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from .agents import root_agent

# ---------------------------------------------------------------------------
# Shared runner & session service (single-process dev setup)
# ---------------------------------------------------------------------------

session_service = InMemorySessionService()
runner = Runner(agent=root_agent, app_name="mario", session_service=session_service)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_create_session(user_id: str, session_id: str | None = None):
    """Return an existing session or create a new one (async ADK API)."""
    if session_id:
        session = await session_service.get_session(
            app_name="mario", user_id=user_id, session_id=session_id
        )
        if session:
            return session

    return await session_service.create_session(
        app_name="mario", user_id=user_id
    )


def _build_user_content(message: str):
    """Build a Content object for a user message."""
    from google.genai.types import Content, Part

    return Content(role="user", parts=[Part(text=message)])


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

@csrf_exempt
@require_POST
def agent_run(request):
    """
    Run the agent synchronously and return the full response.

    Request body (JSON):
        { "message": "...", "user_id": "...", "session_id": "..." }
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    message = body.get("message", "").strip()
    if not message:
        return JsonResponse({"error": "message is required"}, status=400)

    user_id = body.get("user_id", "default-user")
    session_id = body.get("session_id")
    user_content = _build_user_content(message)

    # Run agent — session creation + runner are both async
    response_parts: list[str] = []
    final_session_id: str = ""

    async def _run():
        nonlocal final_session_id
        session = await _get_or_create_session(user_id, session_id)
        final_session_id = session.id
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session.id,
            new_message=user_content,
        ):
            if event.is_final_response() and event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        response_parts.append(part.text)

    asyncio.run(_run())

    return JsonResponse({
        "response": "\n".join(response_parts),
        "session_id": final_session_id,
    })


@csrf_exempt
@require_POST
def agent_stream(request):
    """
    Run the agent and stream results as Server-Sent Events (SSE).

    Request body (JSON):
        { "message": "...", "user_id": "...", "session_id": "..." }

    Response: text/event-stream with events:
        data: {"type": "chunk", "content": "..."}
        data: {"type": "done", "session_id": "..."}
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    message = body.get("message", "").strip()
    if not message:
        return JsonResponse({"error": "message is required"}, status=400)

    user_id = body.get("user_id", "default-user")
    session_id = body.get("session_id")
    user_content = _build_user_content(message)

    def event_stream():
        async def _run():
            session = await _get_or_create_session(user_id, session_id)
            async for event in runner.run_async(
                user_id=user_id,
                session_id=session.id,
                new_message=user_content,
            ):
                if event.is_final_response():
                    # Final text — emit as chunk
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            if getattr(part, "text", None):
                                yield f"data: {json.dumps({'type': 'chunk', 'content': part.text})}\n\n"
                else:
                    # Intermediate events: tool calls, tool responses, model thoughts
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            fn_call = getattr(part, "function_call", None)
                            fn_resp = getattr(part, "function_response", None)
                            text = getattr(part, "text", None)

                            if fn_call and getattr(fn_call, "name", None):
                                args = {}
                                try:
                                    args = dict(fn_call.args) if fn_call.args else {}
                                except Exception:
                                    pass
                                yield f"data: {json.dumps({'type': 'tool_call', 'name': fn_call.name, 'args': args})}\n\n"
                            elif fn_resp and getattr(fn_resp, "name", None):
                                yield f"data: {json.dumps({'type': 'tool_result', 'name': fn_resp.name})}\n\n"
                            elif text:
                                yield f"data: {json.dumps({'type': 'thought', 'content': text})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'session_id': session.id})}\n\n"

        # Bridge async generator → sync generator; yield bytes for Django
        loop = asyncio.new_event_loop()
        try:
            agen = _run()
            while True:
                try:
                    chunk = loop.run_until_complete(agen.__anext__())
                    yield chunk.encode()
                except StopAsyncIteration:
                    break
        finally:
            loop.close()

    response = StreamingHttpResponse(
        event_stream(),
        content_type="text/event-stream",
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


@require_GET
def health(request):
    """Simple health-check endpoint."""
    return JsonResponse({"status": "ok", "agent": root_agent.name})
