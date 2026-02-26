import React from 'react';
import { FiRefreshCw, FiZoomIn } from 'react-icons/fi';

// ── Helpers ─────────────────────────────────────────────────────────────────

// Keys that are already shown in the query summary — skip in the detail table.
const SUMMARY_KEYS = new Set(['manufacturer', 'productName']);

// Human-readable labels + optional unit hints for known agent keys.
const KEY_LABELS = {
  FlowNom56:  'Nominal Flow',
  HeadNom56:  'Nominal Head',
  Phase:      'Phase',
};
const KEY_UNITS = {
  FlowNom56:  'm³/h',
  HeadNom56:  'm',
  Phase:      'ø',
};

function formatKey(key) {
  return KEY_LABELS[key] ?? key;
}

function formatUnit(key) {
  return KEY_UNITS[key] ?? null;
}

function formatValue(value) {
  if (value === null || value === undefined || value === 'null') return null; // signal "not found"
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

// ── Reusable detail table ────────────────────────────────────────────────────

function DetailTable({ data }) {
  const entries = Object.entries(data).filter(([k]) => !SUMMARY_KEYS.has(k));
  if (entries.length === 0) return null;
  return (
    <div className="output-details">
      {entries.map(([key, value]) => {
        const display = formatValue(value);
        const unit    = formatUnit(key);
        const isNull  = display === null;
        return (
          <div className={`output-detail-row${isNull ? ' output-detail-row-null' : ''}`} key={key}>
            <span className="detail-key">
              {formatKey(key)}
              {unit && <span className="detail-unit">{unit}</span>}
            </span>
            <span className={`detail-value${isNull ? ' detail-value-null' : ''}`}>
              {isNull ? '—' : display}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const OutputComponent = ({
  manufacturer,
  productName,
  response,
  advancedResults,
  advancedLoading,
  advancedError,
  onAdvancedInsight,
  onRefresh,
}) => {
  // Try to parse JSON response
  let parsed = null;
  if (response) {
    try {
      parsed = typeof response === 'string' ? JSON.parse(response) : response;
    } catch {
      // response is plain text
    }
  }

  let advancedParsed = null;
  if (advancedResults) {
    try {
      advancedParsed = typeof advancedResults === 'string' ? JSON.parse(advancedResults) : advancedResults;
    } catch {
      // plain text
    }
  }

  const isStructured = parsed && typeof parsed === 'object' && !Array.isArray(parsed);
  const isAdvancedStructured = advancedParsed && typeof advancedParsed === 'object' && !Array.isArray(advancedParsed);

  const hasAdvanced = advancedResults !== null && advancedResults !== undefined;

  return (
    <div className="output-area">
      {/* Header bar */}
      <div className="output-header">
        <h2 className="output-title">Results</h2>
        <div className="output-actions">
          <button className="action-btn action-btn-danger" onClick={onRefresh} title="Clear results">
            <FiRefreshCw size={18} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="output-body">
        {/* Query summary */}
        <div className="output-summary">
          <div className="summary-item">
            <span className="summary-label">Manufacturer</span>
            <span className="summary-value">{manufacturer}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Product Name</span>
            <span className="summary-value">{productName}</span>
          </div>
        </div>

        {/* Standard results content */}
        <div className="output-content">
          {isStructured ? (
            <DetailTable data={parsed} />
          ) : (
            <div className="output-prose">
              {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
            </div>
          )}
        </div>

        {/* Advanced insight trigger */}
        {!hasAdvanced && (
          <div className="advanced-insight-bar">
            <button
              className={`advanced-insight-btn${advancedLoading ? ' advanced-insight-btn-loading' : ''}`}
              onClick={onAdvancedInsight}
              disabled={advancedLoading}
            >
              {advancedLoading ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Fetching advanced insight…</span>
                </>
              ) : (
                <>
                  <FiZoomIn size={16} />
                  <span>Advanced Insight</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Advanced results section */}
        {hasAdvanced && (
          <div className="advanced-section">
            <div className="advanced-section-header">
              <FiZoomIn size={15} />
              <span>Advanced Insight</span>
              <button
                className="advanced-rerun-btn"
                onClick={onAdvancedInsight}
                disabled={advancedLoading}
                title="Re-run advanced insight"
              >
                <FiRefreshCw size={13} />
              </button>
            </div>
            <div className="advanced-section-body">
              {isAdvancedStructured ? (
                <DetailTable data={advancedParsed} />
              ) : (
                <div className="output-prose">
                  {typeof advancedResults === 'string' ? advancedResults : JSON.stringify(advancedResults, null, 2)}
                </div>
              )}
            </div>
          </div>
        )}

        {advancedError && (
          <p className="advanced-error">{advancedError}</p>
        )}
      </div>
    </div>
  );
};

export default OutputComponent;