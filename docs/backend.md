# Backend — Django + Google ADK

## Stack
- **Django 6.0** — web framework
- **Django REST Framework** — API views
- **Google ADK 1.25** — multi-agent AI framework (Gemini)
- **django-cors-headers** — CORS for local dev

## Structure
```
backend/
├── manage.py
├── requirements.txt
├── .env                        # secrets (never commit)
├── config/                     # Django project settings
│   ├── settings.py
│   ├── urls.py                 # root router → /api/
│   ├── asgi.py
│   └── wsgi.py
└── agent/                      # Django app
    ├── views.py                # API + SSE views
    ├── urls.py                 # endpoint routing
    └── agents/
        ├── __init__.py
        └── main_agent.py       # ADK root_agent definition
```

## Environment Variables (`.env`)
| Key | Description |
|-----|-------------|
| `DJANGO_SECRET_KEY` | Django secret key |
| `GOOGLE_API_KEY` | Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey) |

## API Endpoints (`/api/`)

> All endpoints except `/health/` expect a JSON body.  
> `session_id` is optional — omit it on the first message and pass the returned value on subsequent turns to maintain conversation history.

### `POST /api/agent/run/`
Runs the agent and returns the full response.

**Request body:**
```json
{ "message": "Hello", "user_id": "u1", "session_id": "optional" }
```
**Response:**
```json
{ "response": "...", "session_id": "abc123" }
```

---

### `POST /api/agent/stream/`
Runs the agent and streams output as **Server-Sent Events (SSE)**.

**Request body:** same as `/run/`

**Stream events:**
```
data: {"type": "chunk", "content": "..."}
data: {"type": "done", "session_id": "abc123"}
```

---

### `GET /api/agent/health/`
```json
{ "status": "ok", "agent": "main_agent" }
```

## Adding Agents / Tools

Edit [`agent/agents/main_agent.py`](../backend/agent/agents/main_agent.py):

```python
from google.adk.agents import Agent, LlmAgent

# Add a tool
def my_tool(input: str) -> str:
    return "result"

# Add a sub-agent
sub = LlmAgent(name="sub", model="gemini-2.5-flash", instruction="...")

root_agent = Agent(
    name="main_agent",
    model="gemini-2.5-flash",
    instruction="...",
    tools=[my_tool],
    sub_agents=[sub],
)
```

## Running

```bash
cd backend
python manage.py runserver        # starts on http://localhost:8000
```

MARIO's Vite dev server (`:5173`) proxies `/api/*` to `:8000` automatically.

## Implementation Notes

- **ADK session API is async** — `session_service.create_session()` and `get_session()` must be `await`ed; both are called inside `async def _run()` within each view.
- **`event.content.parts` null guard** — ADK events may have `content = None` or `content.parts = None`; both are checked before iterating.
- **SSE generator yields `bytes`** — `StreamingHttpResponse` in Django 6 requires `bytes`; each SSE chunk is `.encode()`d before yielding.
