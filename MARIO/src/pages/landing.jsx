import React, { useState, useRef, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import InputComponent from '../components/inputComponent';
import OutputComponent from '../components/outputComponent';
import ConfirmModal from '../components/ConfirmModal';
import { agentStream } from '../services/api';
import { mockIndustrialPumpReport } from '../mockData.js';
import Logo from '../assets/logo.svg';
import '../styles/landing.css';
// Development toggle: set to false for production
const USE_MOCK_DATA = false; // Set to false for production

// ── Thought-event renderer ──────────────────────────────────────────────────

// Custom spinner for event rows
function Spinner({ size = 14 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '2px solid #b3b3b3',
        borderTop: '2px solid #0078d4',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  );
}

// Badge for URLs
function UrlBadge({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        background: '#f3f6fa',
        color: '#0078d4',
        border: '1px solid #e0e6ed',
        borderRadius: 12,
        padding: '2px 10px',
        fontSize: 12,
        margin: 2,
        textDecoration: 'none',
        maxWidth: 180,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={url}
    >
      {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
    </a>
  );
}

function renderThoughtEvent(event) {
  // Tool call: search_pump_specs
  if (event.type === 'tool_call' && event.name === 'search_pump_specs') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Spinner size={14} />
        <span>Initiating deep web search for 10 technical sources…</span>
      </span>
    );
  }
  // Tool result: search_pump_specs
  if (event.type === 'tool_result' && event.name === 'search_pump_specs') {
    // Try to extract URLs from result
    let urls = [];
    if (typeof event.result === 'string') {
      try {
        const parsed = JSON.parse(event.result);
        if (Array.isArray(parsed)) {
          urls = parsed.map(x => x.url || x);
        } else if (parsed && Array.isArray(parsed.urls)) {
          urls = parsed.urls;
        } else if (parsed && parsed.results && Array.isArray(parsed.results)) {
          urls = parsed.results.map(x => x.url || x);
        }
      } catch (e) {
        // fallback: try to extract URLs with regex
        urls = (event.result.match(/https?:\/\/[^\s"']+/g) || []);
      }
    }
    if (!urls.length) return 'Found sources, but none could be extracted.';
    return (
      <div style={{ margin: '6px 0 2px 0' }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>
          Found {urls.length} potential sources. Initiating AI triage…
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {urls.map((url, i) => (
            <UrlBadge url={url} key={url + i} />
          ))}
        </div>
      </div>
    );
  }
  // Tool call: read_webpage
  if (event.type === 'tool_call' && event.name === 'read_webpage') {
    const url = event.args?.url ?? '';
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Spinner size={13} />
        <span>[Scraping Data] Reading technical document from: <span style={{ color: '#0078d4' }}>{url}</span></span>
      </span>
    );
  }
  // Tool result: read_webpage
  if (event.type === 'tool_result' && event.name === 'read_webpage') {
    return 'Page content retrieved';
  }
  // Other tool calls/results
  if (event.type === 'tool_call') {
    return `Calling tool: ${event.name}`;
  }
  if (event.type === 'tool_result') {
    return `${event.name} complete`;
  }
  // Thought
  if (event.type === 'thought') {
    return event.content.length > 160
      ? event.content.slice(0, 157) + '…'
      : event.content;
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

    if (!USE_MOCK_DATA) {
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
    } else {
      // Simulate network delay and mock data
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setResults(JSON.stringify(mockIndustrialPumpReport, null, 2));
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
