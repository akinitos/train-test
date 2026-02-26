import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiPrinter, FiSearch, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import PrintableReport from './PrintableReport';
import '../styles/TabOutput.css';

// ── Tab definitions ────────────────────────────────────────────────────────

const TABS = [
  { key: 'specification', label: 'Specification' },
  { key: 'replacement', label: 'Replacement Options' },
  { key: 'validation', label: 'Data Validation Matrix' },
  { key: 'sources', label: 'Sources' },
];

// ── Spec fields ────────────────────────────────────────────────────────────

const SPEC_FIELDS = [
  { key: 'nominal_flow_m3h', label: 'Nominal Flow', unit: 'm³/h' },
  { key: 'nominal_head_m', label: 'Nominal Head', unit: 'm' },
  { key: 'motor_power_kw', label: 'Motor Power', unit: 'kW' },
  { key: 'efficiency_percent', label: 'Efficiency', unit: '%' },
  { key: 'material_compatibility', label: 'Material Compatibility' },
  { key: 'phase', label: 'Phase', unit: 'ø' },
  { key: 'temp_pressure_limits', label: 'Temp / Pressure Limits' },
];

function fmtVal(v) {
  if (v === null || v === undefined || v === 'null') return null;
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

// ── Tab: Specification ─────────────────────────────────────────────────────

function SpecificationTab({ specs, manufacturer, productName }) {
  if (!specs || typeof specs !== 'object') return <p className="tab-empty">No specification data available.</p>;
  return (
    <div className="spec-tab">
      <div className="spec-summary">
        <div className="spec-summary-item">
          <span className="spec-summary-label">Manufacturer</span>
          <span className="spec-summary-value">{manufacturer}</span>
        </div>
        <div className="spec-summary-item">
          <span className="spec-summary-label">Model</span>
          <span className="spec-summary-value">{productName}</span>
        </div>
      </div>
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
    </div>
  );
}

// ── Tab: Replacement Options ───────────────────────────────────────────────

function ReplacementTab({ options }) {
  if (!options || options.length === 0)
    return <p className="tab-empty">No replacement options available.</p>;

  return (
    <div className="replacement-tab">
      {options.map((opt, idx) => (
        <div className="replacement-card" key={idx}>
          <div className="replacement-card-header">
            <span className="replacement-manufacturer">{opt.manufacturer}</span>
            <span className="replacement-model">{opt.model}</span>
          </div>
          <div className="replacement-specs">
            <div className="replacement-spec">
              <span className="replacement-spec-label">Flow</span>
              <span className="replacement-spec-value">{opt.nominal_flow_m3h} m³/h</span>
            </div>
            <div className="replacement-spec">
              <span className="replacement-spec-label">Head</span>
              <span className="replacement-spec-value">{opt.nominal_head_m} m</span>
            </div>
            <div className="replacement-spec">
              <span className="replacement-spec-label">Power</span>
              <span className="replacement-spec-value">{opt.motor_power_kw} kW</span>
            </div>
          </div>
          <div className="replacement-compat">
            <span className="replacement-compat-badge">{opt.compatibility}</span>
          </div>
          {opt.notes && <p className="replacement-notes">{opt.notes}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Data Validation Matrix ────────────────────────────────────────────

function ValidationTab({ matrix }) {
  if (!matrix || matrix.length === 0)
    return <p className="tab-empty">No validation data available.</p>;

  return (
    <div className="validation-tab">
      <div className="validation-table-wrapper">
        <table className="validation-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Primary Source</th>
              <th>Validation Source</th>
              <th>Match</th>
              <th>Confidence</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={idx} className={row.match ? '' : 'validation-row-mismatch'}>
                <td className="validation-field">{row.field}</td>
                <td>{row.primary_source_value}</td>
                <td>{row.validation_source_value}</td>
                <td className="validation-match-cell">
                  {row.match ? (
                    <FiCheckCircle size={16} className="validation-match-icon" />
                  ) : (
                    <FiXCircle size={16} className="validation-mismatch-icon" />
                  )}
                </td>
                <td>
                  <span className={`validation-confidence validation-confidence-${row.confidence?.toLowerCase()}`}>
                    {row.confidence}
                  </span>
                </td>
                <td className="validation-notes">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Sources ───────────────────────────────────────────────────────────

function SourcesTab({ sources }) {
  if (!sources || sources.length === 0)
    return <p className="tab-empty">No source data available.</p>;

  return (
    <div className="sources-tab">
      {sources.map((src, idx) => (
        <div className="source-card" key={idx}>
          <div className="source-card-head">
            <span className={`source-type-badge source-type-${src.type?.toLowerCase()}`}>
              {src.type}
            </span>
            <span className={`source-reliability source-reliability-${src.reliability?.toLowerCase()}`}>
              {src.reliability} Reliability
            </span>
          </div>
          <a
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-title"
          >
            {src.title || src.url}
          </a>
          {src.notes && <p className="source-notes">{src.notes}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Main TabOutput Component ───────────────────────────────────────────────

const TabOutput = ({ data, visible = true, onNewSearch }) => {
  const [activeTab, setActiveTab] = useState('specification');
  const reportRef = useRef(null);

  // Parse data
  let parsed = null;
  if (data) {
    try {
      if (typeof data === 'string') {
        let raw = data.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        parsed = JSON.parse(raw);
      } else {
        parsed = data;
      }
    } catch {
      // fallback
    }
  }

  const specs = parsed?.specifications || null;
  const replacements = parsed?.replacement_options || [];
  const validation = parsed?.data_validation_matrix || [];
  const sources = parsed?.sources || [];
  const manufacturer = parsed?.manufacturer || '';
  const productName = parsed?.product_name || '';

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
    const ratio = Math.min(
      (pageWidth - 2 * padding) / canvas.width,
      (pageHeight - 2 * padding) / canvas.height,
      1
    );
    const pdfWidth = canvas.width * ratio;
    const pdfHeight = canvas.height * ratio;
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'specification':
        return <SpecificationTab specs={specs} manufacturer={manufacturer} productName={productName} />;
      case 'replacement':
        return <ReplacementTab options={replacements} />;
      case 'validation':
        return <ValidationTab matrix={validation} />;
      case 'sources':
        return <SourcesTab sources={sources} />;
      default:
        return null;
    }
  };

  return (
    <div className={`tab-output ${visible ? 'tab-output-visible' : 'tab-output-hidden'}`}>
      {/* Hidden printable report */}
      <div
        ref={reportRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}
        aria-hidden="true"
      >
        <PrintableReport reportData={parsed} />
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Bottom actions: Print PDF + New Search */}
      <div className="tab-actions">
        <button className="tab-action-btn tab-action-pdf" onClick={handleDownloadPdf}>
          <FiPrinter size={18} />
          <span>Print PDF</span>
        </button>
        <button className="tab-action-btn tab-action-new" onClick={onNewSearch}>
          <FiSearch size={18} />
          <span>New Search</span>
        </button>
      </div>
    </div>
  );
};

export default TabOutput;
