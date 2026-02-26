const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Standard search — returns JSON data from the backend.
 * @param {Object} params
 * @param {string} params.manufacturer - Manufacturer name
 * @param {string} params.productName - Product name
 * @param {boolean} params.showAccuracy - Whether to enable accuracy comparison
 * @param {string} [params.userId] - Optional user ID
 * @param {string} [params.sessionId] - Optional session ID to continue
 * @returns {Promise<Object>} JSON response from the backend
 */
export async function standardSearch({ manufacturer, productName, showAccuracy = false, userId = 'default-user', sessionId = null }) {
  const body = {
    message: `${manufacturer} | ${productName}`,
    user_id: userId,
    show_accuracy: showAccuracy,
  };
  if (sessionId) body.session_id = sessionId;

  const res = await fetch(`${API_BASE}/agent/standard/`, {
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
 * Advanced search — returns a PDF file from the backend.
 * @param {Object} params
 * @param {string} params.manufacturer - Manufacturer name
 * @param {string} params.productName - Product name
 * @param {boolean} params.showAccuracy - Whether to enable accuracy comparison
 * @param {string} [params.userId] - Optional user ID
 * @param {string} [params.sessionId] - Optional session ID to continue
 * @returns {Promise<{pdfUrl: string, cleanup: function}>} Object URL for the PDF blob and a cleanup function
 */
export async function advancedSearch({ manufacturer, productName, showAccuracy = false, userId = 'default-user', sessionId = null }) {
  const body = {
    message: `${manufacturer} | ${productName}`,
    user_id: userId,
    show_accuracy: showAccuracy,
  };
  if (sessionId) body.session_id = sessionId;

  const res = await fetch(`${API_BASE}/agent/advanced/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const pdfUrl = URL.createObjectURL(blob);

  return {
    pdfUrl,
    cleanup: () => URL.revokeObjectURL(pdfUrl),
  };
}

/**
 * Health check endpoint.
 * @returns {Promise<{status: string, agent: string}>}
 */
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/agent/health/`);
  return res.json();
}
