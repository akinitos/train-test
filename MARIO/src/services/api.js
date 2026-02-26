const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Run the agent and return the full JSON response.
 * @param {Object} params
 * @param {string} params.manufacturer - Manufacturer name
 * @param {string} params.productName - Product name
 * @param {string} params.mode - 'standard' or 'advanced'
 * @param {boolean} params.showAccuracy - Whether to include accuracy data
 * @param {string} [params.userId] - Optional user ID
 * @param {string} [params.sessionId] - Optional session ID to continue
 * @returns {Promise<Object>} JSON response from the backend
 */
export async function agentRun({
  manufacturer,
  productName,
  mode = 'standard',
  showAccuracy = false,
  userId = 'default-user',
  sessionId = null,
}) {
  const body = {
    message: `[${mode.toUpperCase()}] ${manufacturer} | ${productName}${showAccuracy ? ' | show_accuracy' : ''}`,
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
 * Health check endpoint.
 * @returns {Promise<{status: string, agent: string}>}
 */
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/agent/health/`);
  return res.json();
}
