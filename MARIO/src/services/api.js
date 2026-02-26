const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Run the agent and return the full JSON response.
 * @param {Object} params
 * @param {string} params.manufacturer - Manufacturer name
 * @param {string} params.productName - Product name
 * @param {string} params.mode - 'standard' or 'advanced'
 * @param {string} [params.userId] - Optional user ID
 * @param {string} [params.sessionId] - Optional session ID to continue
 * @returns {Promise<Object>} JSON response from the backend
 */
export async function agentRun({
  manufacturer,
  productName,
  mode = 'standard',
  userId = 'default-user',
  sessionId = null,
}) {
  const body = {
    message: `[${mode.toUpperCase()}] ${manufacturer} | ${productName}`,
    user_id: userId,
  };
  if (sessionId) body.session_id = sessionId;

  const res = await fetch(`${API_BASE}/agent/run/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Run the agent with streaming and deliver events as they arrive.
 *
 * Event shapes delivered to onEvent:
 *   { type: 'tool_call',   name: string, args: object }   – tool about to be called
 *   { type: 'tool_result', name: string }                  – tool call finished
 *   { type: 'thought',     content: string }               – intermediate model text
 *   { type: 'chunk',       content: string }               – final response text
 *   { type: 'done',        session_id: string }            – stream complete
 *
 * @param {Object}   params
 * @param {string}   params.manufacturer
 * @param {string}   params.productName
 * @param {string}   [params.mode]
 * @param {string}   [params.userId]
 * @param {string}   [params.sessionId]
 * @param {Function} params.onEvent  – called for each parsed SSE event object
 */
export async function agentStream({
  manufacturer,
  productName,
  mode = 'standard',
  userId = 'default-user',
  sessionId = null,
  onEvent,
}) {
  const body = {
    message: `[${mode.toUpperCase()}] ${manufacturer} | ${productName}`,
    user_id: userId,
  };
  if (sessionId) body.session_id = sessionId;

  const res = await fetch(`${API_BASE}/agent/stream/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // hold back last incomplete line

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          onEvent(event);
        } catch { /* skip malformed lines */ }
      }
    }
  }
}

/**
 * Health check endpoint.
 * @returns {Promise<{status: string, agent: string}>}
 */
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/agent/health/`);
  return res.json();
}
