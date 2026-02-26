import React, { useState, useRef, useEffect } from 'react';
import InputComponent from '../components/inputComponent';
import OutputComponent from '../components/outputComponent';
import ConfirmModal from '../components/ConfirmModal';
import { agentStream } from '../services/api';
import Logo from '../assets/logo.svg';
import '../styles/landing.css';

// ── Thought-event renderer ──────────────────────────────────────────────────

function renderThoughtEvent(event) {
  if (event.type === 'tool_call') {
    if (event.name === 'search_pump_specs') {
      const query = event.args?.query ?? '';
      return { icon: '🔍', text: `Searching: ${query}` };
    }
    if (event.name === 'read_webpage') {
      const url = event.args?.url ?? '';
      return { icon: '🌐', text: `Reading: ${url}` };
    }
    return { icon: '⚙️', text: `Calling tool: ${event.name}` };
  }
  if (event.type === 'tool_result') {
    if (event.name === 'search_pump_specs') return { icon: '✓', text: 'Search results retrieved' };
    if (event.name === 'read_webpage') return { icon: '✓', text: 'Page content retrieved' };
    return { icon: '✓', text: `${event.name} complete` };
  }
  if (event.type === 'thought') {
    const truncated = event.content.length > 160
      ? event.content.slice(0, 157) + '…'
      : event.content;
    return { icon: '💭', text: truncated };
  }
  return null;
}

// ── Landing ─────────────────────────────────────────────────────────────────

export default function Landing() {
  // Inputs
  const [manufacturer, setManufacturer] = useState('');
  const [productName, setProductName] = useState('');

  // Settings
  const [mode, setMode] = useState('standard');

  // Results
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Streaming thought events (visible while loading)
  const [streamEvents, setStreamEvents] = useState([]);
  const thoughtsRef = useRef(null);

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const hasResults = results !== null;
  const hasThoughts = loading && streamEvents.length > 0;

  // Auto-scroll thought log to bottom as new events arrive
  useEffect(() => {
    if (thoughtsRef.current) {
      thoughtsRef.current.scrollTop = thoughtsRef.current.scrollHeight;
    }
  }, [streamEvents]);

  // ── Handlers ──

  const handleSearch = async ({ manufacturer: mfr, productName: pn }) => {
    setError('');
    setResults(null);
    setStreamEvents([]);
    setLoading(true);

    const finalChunks = [];

    try {
      await agentStream({
        manufacturer: mfr,
        productName: pn,
        mode,
        sessionId,
        onEvent: (event) => {
          if (event.type === 'chunk') {
            finalChunks.push(event.content);
          } else if (event.type === 'done') {
            setResults(finalChunks.join('') || '(no response)');
            if (event.session_id) setSessionId(event.session_id);
          } else if (['tool_call', 'tool_result', 'thought'].includes(event.type)) {
            setStreamEvents((prev) => [...prev, event]);
          }
        },
      });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setStreamEvents([]);
    }
  };

  const handleRefresh = () => {
    setShowConfirmModal(true);
  };

  const handleClearResults = () => {
    setResults(null);
    setSessionId(null);
    setError('');
    setStreamEvents([]);
    setShowConfirmModal(false);
  };

  return (
    <div className={`landing ${hasResults ? 'landing-has-results' : ''}`}>
      {/* Main content */}
      <div className={`landing-main ${hasResults ? 'landing-main-compact' : 'landing-main-centered'}`}>
        {/* Logo */}
        <div className={`logo-container ${hasResults ? 'logo-compact' : ''}`}>
          <img src={Logo} alt="MARIO Logo" className="logo" />
        </div>

        {/* Inline controls: mode toggle */}
        <div className={`inline-controls ${hasResults ? 'inline-controls-compact' : ''}`}>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'standard' ? 'mode-btn-active' : ''}`}
              onClick={() => setMode('standard')}
              disabled={loading}
            >
              Standard
            </button>
            <button
              className={`mode-btn ${mode === 'advanced' ? 'mode-btn-active' : ''}`}
              onClick={() => setMode('advanced')}
              disabled={loading}
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Search bar */}
        <InputComponent
          manufacturer={manufacturer}
          productName={productName}
          onManufacturerChange={setManufacturer}
          onProductNameChange={setProductName}
          onSubmit={handleSearch}
          loading={loading}
          compact={hasResults}
          error={error}
        />

        {/* Live thought process panel — shown only while loading */}
        {hasThoughts && (
          <div className="thinking-panel">
            <div className="thinking-header">
              <span className="thinking-pulse" />
              Agent is working…
            </div>
            <div className="thinking-log" ref={thoughtsRef}>
              {streamEvents.map((event, idx) => {
                const rendered = renderThoughtEvent(event);
                if (!rendered) return null;
                return (
                  <div className="thought-item" key={idx}>
                    <span className="thought-icon">{rendered.icon}</span>
                    <span className="thought-text">{rendered.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Output area — full-page takeover */}
      {hasResults && (
        <OutputComponent
          manufacturer={manufacturer}
          productName={productName}
          response={results}
          mode={mode}
          onRefresh={handleRefresh}
        />
      )}

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleClearResults}
      />
    </div>
  );
}
