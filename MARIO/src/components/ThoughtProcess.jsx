import React, { useRef, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import '../styles/ThoughtProcess.css';

// ── URL Badge ──────────────────────────────────────────────────────────────

function UrlBadge({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="tp-url-badge"
      title={url}
    >
      {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
    </a>
  );
}

// ── Render a single thought event ──────────────────────────────────────────

function renderThoughtEvent(event) {
  if (event.type === 'tool_call' && event.name === 'search_pump_specs') {
    return 'Initiating deep web search for 10 technical sources…';
  }

  if (event.type === 'tool_result' && event.name === 'search_pump_specs') {
    let urls = [];
    if (typeof event.result === 'string') {
      try {
        const parsed = JSON.parse(event.result);
        if (Array.isArray(parsed)) {
          urls = parsed.map((x) => x.url || x);
        } else if (parsed?.urls && Array.isArray(parsed.urls)) {
          urls = parsed.urls;
        } else if (parsed?.results && Array.isArray(parsed.results)) {
          urls = parsed.results.map((x) => x.url || x);
        }
      } catch {
        urls = event.result.match(/https?:\/\/[^\s"']+/g) || [];
      }
    }
    if (!urls.length) return 'Found sources, but none could be extracted.';
    return (
      <div className="tp-sources-block">
        <div className="tp-sources-title">
          Found {urls.length} potential sources. Initiating AI triage…
        </div>
        <div className="tp-sources-list">
          {urls.map((url, i) => (
            <UrlBadge url={url} key={url + i} />
          ))}
        </div>
      </div>
    );
  }

  if (event.type === 'tool_call' && event.name === 'read_webpage') {
    const url = event.args?.url ?? '';
    return (
      <span>
        [Scraping Data] Reading technical document from:{' '}
        <span className="tp-url-inline">{url}</span>
      </span>
    );
  }

  if (event.type === 'tool_result' && event.name === 'read_webpage') {
    return 'Page content retrieved';
  }

  if (event.type === 'tool_call') {
    return `Calling tool: ${event.name}`;
  }

  if (event.type === 'tool_result') {
    return `${event.name} complete`;
  }

  if (event.type === 'thought') {
    return event.content.length > 160
      ? event.content.slice(0, 157) + '…'
      : event.content;
  }

  return null;
}

// ── ThoughtProcess Component ───────────────────────────────────────────────

const ThoughtProcess = ({ events = [], isActive = true, visible = true }) => {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className={`thought-process ${visible ? 'thought-process-visible' : 'thought-process-hidden'}`}>
      <div className="tp-panel">
        <div className="tp-header">
          <span className="tp-pulse" />
          Agent is working…
        </div>
        <div className="tp-log" ref={logRef}>
          {events.map((event, idx) => {
            const text = renderThoughtEvent(event);
            if (!text) return null;
            const isLast = idx === events.length - 1;
            const showSpinner = isLast && isActive;
            return (
              <div className="tp-item" key={idx}>
                <span className="tp-icon">
                  {showSpinner ? (
                    <span className="tp-item-spinner" />
                  ) : (
                    <FiCheck size={12} className="tp-item-check" />
                  )}
                </span>
                <span className="tp-text">{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThoughtProcess;
