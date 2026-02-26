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

  // Settings — mode is no longer user-selectable up front;
  // standard is always the primary search.

  // Results
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Advanced insight (secondary, on-demand)
  const [advancedResults, setAdvancedResults] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedError, setAdvancedError] = useState('');

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
    setAdvancedResults(null);
    setAdvancedError('');
    setStreamEvents([]);
    setLoading(true);

    const finalChunks = [];

    try {
      await agentStream({
        manufacturer: mfr,
        productName: pn,
        mode: 'standard',
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

  const handleAdvancedInsight = async () => {
    setAdvancedResults(null);
    setAdvancedError('');
    setAdvancedLoading(true);
    setStreamEvents([]);

    const chunks = [];

    try {
      await agentStream({
        manufacturer,
        productName,
        mode: 'advanced',
        sessionId,
        onEvent: (event) => {
          if (event.type === 'chunk') {
            chunks.push(event.content);
          } else if (event.type === 'done') {
            setAdvancedResults(chunks.join('') || '(no response)');
            if (event.session_id) setSessionId(event.session_id);
          } else if (['tool_call', 'tool_result', 'thought'].includes(event.type)) {
            setStreamEvents((prev) => [...prev, event]);
          }
        },
      });
    } catch (err) {
      setAdvancedError(err.message || 'Something went wrong.');
    } finally {
      setAdvancedLoading(false);
      setStreamEvents([]);
    }
  };

  const handleRefresh = () => {
    setShowConfirmModal(true);
  };

  const handleClearResults = () => {
    setResults(null);
    setAdvancedResults(null);
    setAdvancedError('');
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
                const text = renderThoughtEvent(event);
                if (!text) return null;
                const isLast = idx === streamEvents.length - 1;
                const isActive = isLast && loading;
                return (
                  <div className="thought-item" key={idx}>
                    <span className="thought-icon">
                      {isActive
                        ? <span className="thought-spinner" />
                        : <FiCheck size={12} className="thought-check" />}
                    </span>
                    <span className="thought-text">{text}</span>
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
          advancedResults={advancedResults}
          advancedLoading={advancedLoading}
          advancedError={advancedError}
          onAdvancedInsight={handleAdvancedInsight}
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
