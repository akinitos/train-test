import React from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const OutputComponent = ({
  manufacturer,
  productName,
  response,
  pdfUrl,
  mode,
  showAccuracy,
  onRefresh,
}) => {
  // ── Standard mode: parse JSON response ──
  let parsed = null;
  if (mode === 'standard' && response) {
    try {
      parsed = typeof response === 'string' ? JSON.parse(response) : response;
    } catch {
      // response is plain text
    }
  }

  const isStructured = parsed && typeof parsed === 'object' && !Array.isArray(parsed);

  // Download the backend-generated PDF
  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `MARIO_${manufacturer}_${productName}.pdf`;
    a.click();
  };

  return (
    <div className="output-area">
      {/* Header bar */}
      <div className="output-header">
        <h2 className="output-title">Results</h2>
        <div className="output-actions">
          {mode === 'advanced' && pdfUrl && (
            <button className="action-btn" onClick={handleDownloadPdf} title="Download PDF">
              <FiDownload size={18} />
              <span>Download PDF</span>
            </button>
          )}
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
          {mode === 'standard' ? (
            /* Standard mode: render JSON data */
            <>
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

              {/* Accuracy section (standard mode only, when enabled) */}
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
            </>
          ) : (
            /* Advanced mode: render embedded PDF from backend */
            pdfUrl ? (
              <div className="pdf-viewer-container">
                <iframe
                  className="pdf-viewer"
                  src={pdfUrl}
                  title="Advanced search results (PDF)"
                />
              </div>
            ) : (
              <div className="output-prose">No PDF data received.</div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputComponent;