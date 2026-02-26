import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiPrinter, FiSearch } from 'react-icons/fi';
import PrintableReport from './PrintableReport';
import '../styles/OutputPanel.css';

const SPEC_FIELDS = [
  { key: 'nominal_flow_m3h', label: 'Nominal Flow' },
  { key: 'nominal_head_m', label: 'Nominal Head' },
  { key: 'phase', label: 'Phase' },
];

const OutputPanel = ({ data, visible = true, onNewSearch }) => {
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

  const specs = parsed?.specifications || {};
  const manufacturer = parsed?.manufacturer || '';
  const productName = parsed?.product_name || '';

  const results = [
    { label: 'Manufacturer', value: manufacturer || 'N/A' },
    { label: 'Product Name', value: productName || 'N/A' },
    { label: 'Nominal Flow', value: specs.nominal_flow_m3h != null ? String(specs.nominal_flow_m3h) : 'N/A' },
    { label: 'Nominal Head', value: specs.nominal_head_m != null ? String(specs.nominal_head_m) : 'N/A' },
    { label: 'Phase', value: specs.phase != null ? String(specs.phase) : 'N/A' },
  ];

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
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

  return (
    <div className={`output-panel ${visible ? 'output-panel-visible' : 'output-panel-hidden'}`}>
      {/* Hidden printable report for PDF */}
      <div
        ref={reportRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}
        aria-hidden="true"
      >
        <PrintableReport reportData={parsed} />
      </div>

      <div className="output-panel-inner">
        <h2 className="output-panel-title">OUTPUT:</h2>

        <div className="output-list">
          {results.map((item, index) => (
            <div className="output-row" key={index}>
              <h3 className="output-label">{item.label}:</h3>
              <div className="output-box">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="output-actions">
          <button className="output-action-btn output-action-pdf" onClick={handleDownloadPdf}>
            <FiPrinter size={18} />
            <span>Download PDF</span>
          </button>
          <button className="output-action-btn output-action-new" onClick={onNewSearch}>
            <FiSearch size={18} />
            <span>Search Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;
