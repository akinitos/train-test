import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const OutputComponent = ({
  manufacturer,
  productName,
  response,
  mode,
  showAccuracy,
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

  const isStructured = parsed && typeof parsed === 'object' && !Array.isArray(parsed);

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
          <div className="summary-item">
            <span className="summary-label">Mode</span>
            <span className="summary-value summary-mode">{mode}</span>
          </div>
        </div>

        {/* Results content */}
        <div className="output-content">
          {isStructured ? (
            <div className="output-details">
              {Object.entries(parsed).filter(([key]) => key !== 'accuracy').map(([key, value]) => (
                <div className="output-detail-row" key={key}>
                  <span className="detail-key">{key}</span>
                  <span className="detail-value">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="output-prose">
              {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
            </div>
          )}

          {/* Accuracy section (when enabled and data available) */}
          {showAccuracy && isStructured && parsed.accuracy && (
            <div className="output-accuracy">
              <h3 className="accuracy-title">Accuracy Comparison</h3>
              <div className="accuracy-content">
                {typeof parsed.accuracy === 'object'
                  ? Object.entries(parsed.accuracy).map(([key, val]) => (
                      <div className="output-detail-row" key={key}>
                        <span className="detail-key">{key}</span>
                        <span className="detail-value">{String(val)}</span>
                      </div>
                    ))
                  : <p>{String(parsed.accuracy)}</p>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputComponent;