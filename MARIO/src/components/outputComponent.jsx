import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PrintableReport from './PrintableReport';
import { FiRefreshCw, FiZoomIn, FiAlertTriangle, FiCheckCircle, FiTool } from 'react-icons/fi';

// ── Spec grid labels & units ────────────────────────────────────────────────

const SPEC_FIELDS = [
  { key: 'nominal_flow_m3h',      label: 'Nominal Flow',         unit: 'm³/h' },
  { key: 'nominal_head_m',        label: 'Nominal Head',         unit: 'm' },
  { key: 'motor_power_kw',        label: 'Motor Power',          unit: 'kW' },
  { key: 'efficiency_percent',    label: 'Efficiency',           unit: '%' },
  { key: 'material_compatibility', label: 'Material Compatibility' },
  { key: 'phase',                 label: 'Phase',                unit: 'ø' },
  { key: 'temp_pressure_limits',  label: 'Temp / Pressure Limits' },
];

function fmtVal(v) {
  if (v === null || v === undefined || v === 'null') return null;
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

// ── Specification Grid ──────────────────────────────────────────────────────

function SpecGrid({ specs }) {
  if (!specs || typeof specs !== 'object') return null;
  return (
    <div className="spec-grid">
      {SPEC_FIELDS.map(({ key, label, unit }) => {
        const raw = fmtVal(specs[key]);
        const isNull = raw === null;
        return (
          <div className={`spec-card${isNull ? ' spec-card-null' : ''}`} key={key}>
            <span className="spec-label">
              {label}
              {unit && <span className="spec-unit">{unit}</span>}
            </span>
            <span className={`spec-value${isNull ? ' spec-value-null' : ''}`}>
              {isNull ? '—' : raw}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Prescriptive Analysis Section ───────────────────────────────────────────

function PrescriptiveSection({ analysis }) {
  if (!analysis || typeof analysis !== 'object') return null;

  const { recommended_applications = [], common_faults_to_watch = [], troubleshooting_tips = [] } = analysis;

  return (
    <div className="prescriptive-section">
      {/* Recommended Applications */}
      {recommended_applications.length > 0 && (
        <div className="insight-card insight-card-success">
          <div className="insight-card-header">
            <FiCheckCircle size={16} />
            <span>Recommended Applications</span>
          </div>
          <ul className="insight-list">
            {recommended_applications.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Faults */}
      {common_faults_to_watch.length > 0 && (
        <div className="insight-card insight-card-warning">
          <div className="insight-card-header">
            <FiAlertTriangle size={16} />
            <span>Common Faults to Watch</span>
          </div>
          <ul className="insight-list">
            {common_faults_to_watch.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Troubleshooting Tips */}
      {troubleshooting_tips.length > 0 && (
        <div className="insight-card insight-card-info">
          <div className="insight-card-header">
            <FiTool size={16} />
            <span>Troubleshooting Tips</span>
          </div>
          <ul className="insight-list">
            {troubleshooting_tips.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Decision Process Section ────────────────────────────────────────────────

function DecisionProcessSection({ decision }) {
  if (!decision || typeof decision !== 'object') return null;

  const {
    selected_url = '',
    validation_urls = [],
    final_selection_reasoning = '',
    searched_urls = [],
    rejected_urls_reasoning = '',
  } = decision;

  return (
    <details className="decision-details">
      <summary className="decision-summary">
        Data Validation &amp; Decision Process
      </summary>

      <div className="decision-body">
        {/* Selected URL */}
        {selected_url && (
          <div className="decision-block">
            <span className="decision-block-label decision-label-primary">Selected Source</span>
            <a className="decision-url decision-url-primary" href={selected_url} target="_blank" rel="noreferrer">
              {selected_url}
            </a>
          </div>
        )}

        {/* Validation URLs */}
        {validation_urls.length > 0 && (
          <div className="decision-block">
            <span className="decision-block-label">Validation Sources</span>
            {validation_urls.map((url, i) => (
              <a className="decision-url" href={url} target="_blank" rel="noreferrer" key={i}>
                {url}
              </a>
            ))}
          </div>
        )}

        {/* Selection Reasoning */}
        {final_selection_reasoning && (
          <div className="decision-block">
            <span className="decision-block-label">Selection Reasoning</span>
            <p className="decision-reasoning">{final_selection_reasoning}</p>
          </div>
        )}

        {/* Rejected URLs log */}
        {rejected_urls_reasoning && (
          <div className="decision-block">
            <span className="decision-block-label decision-label-muted">Rejected URLs Reasoning</span>
            <pre className="decision-log">{rejected_urls_reasoning}</pre>
          </div>
        )}

        {/* All searched URLs for reference */}
        {searched_urls.length > 0 && (
          <div className="decision-block">
            <span className="decision-block-label decision-label-muted">All Searched URLs ({searched_urls.length})</span>
            <div className="decision-log">
              {searched_urls.map((url, i) => (
                <div key={i} className="decision-log-line">
                  <span className="decision-log-idx">[{String(i + 1).padStart(2, '0')}]</span> {url}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

// ── Main Output Component ───────────────────────────────────────────────────


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
  const [showInsights, setShowInsights] = useState(false);
  const reportRef = useRef(null);

  // Parse the agent's JSON response
  let parsed = null;
  if (response) {
    try {
      let raw = typeof response === 'string' ? response : JSON.stringify(response);
      // Strip markdown code fences (```json ... ``` or ``` ... ```)
      raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      parsed = JSON.parse(raw);
    } catch {
      // plain text fallback
    }
  }

  const isReport = parsed && typeof parsed === 'object' && !Array.isArray(parsed);
  const specs = isReport ? parsed.specifications : null;
  const prescriptive = isReport ? parsed.prescriptive_analysis : null;
  const decision = isReport ? parsed.decision_process : null;

  // PDF download handler (using PrintableReport template)
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const padding = 10;
    const imgProps = {
      width: canvas.width,
      height: canvas.height,
    };
    const ratio = Math.min(
      (pageWidth - 2 * padding) / imgProps.width,
      (pageHeight - 2 * padding) / imgProps.height,
      1
    );
    const pdfWidth = imgProps.width * ratio;
    const pdfHeight = imgProps.height * ratio;
    pdf.addImage(
      imgData,
      'PNG',
      padding + (pageWidth - 2 * padding - pdfWidth) / 2,
      padding,
      pdfWidth,
      pdfHeight
    );
    pdf.save('Pump_Verification_Report.pdf');
  };

  return (
    <>
      {/* Hidden printable report for PDF generation */}
      <div
        ref={reportRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}
        aria-hidden="true"
      >
        <PrintableReport reportData={parsed} />
      </div>

      <div className="output-area">
      {/* Download PDF Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="action-btn action-btn-pdf" onClick={handleDownloadPdf} title="Download PDF Report">
          <span role="img" aria-label="pdf" style={{ marginRight: 6 }}>📄</span>
          Download PDF Report
        </button>
      </div>

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
            <span className="summary-value">{parsed?.manufacturer ?? manufacturer}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Product Name</span>
            <span className="summary-value">{parsed?.product_name ?? productName}</span>
          </div>
        </div>

        {/* Specification Grid */}
        {specs ? (
          <>
            <h3 className="section-heading">Specifications</h3>
            <SpecGrid specs={specs} />
          </>
        ) : (
          <div className="output-prose">
            {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
          </div>
        )}

        {/* Advanced Insights toggle */}
        {prescriptive && (
          <div className="advanced-insight-bar">
            <button
              className={`advanced-insight-btn${showInsights ? ' advanced-insight-btn-active' : ''}`}
              onClick={() => setShowInsights((prev) => !prev)}
            >
              <FiZoomIn size={16} />
              <span>{showInsights ? 'Hide Advanced Insights' : 'View Advanced Insights'}</span>
            </button>
          </div>
        )}

        {/* Prescriptive Analysis (conditionally rendered) */}
        {showInsights && prescriptive && (
          <div className="insights-reveal">
            <h3 className="section-heading">Prescriptive Analysis</h3>
            <PrescriptiveSection analysis={prescriptive} />
          </div>
        )}

        {/* Decision Process (collapsible) */}
        {decision && <DecisionProcessSection decision={decision} />}

        {advancedError && (
          <p className="advanced-error">{advancedError}</p>
        )}
      </div>

    </div>
    </>
  );
};

export default OutputComponent;