import React, { useState, useCallback } from 'react';
import { FiSettings, FiZap } from 'react-icons/fi';
import InputComponent from '../components/inputComponent';
import OutputComponent from '../components/outputComponent';
import ConfirmModal from '../components/ConfirmModal';
import Sidebar from '../components/Sidebar';
import { standardSearch, advancedSearch } from '../services/api';
import Logo from '../assets/logo.svg';
import '../styles/landing.css';

const TEST_MOCK = {
  standard: [
    'Based on your query for Grundfos CR 95-2, here is a summary of the product specifications:',
    '',
    'The Grundfos CR 95-2 is a vertical, multistage, centrifugal in-line pump designed for water',
    'supply, pressure boosting, and industrial liquid transfer applications.',
    '',
    'Key specifications:',
    '- Nominal flow (FLOWNOM56): 95 m3/h',
    '- Nominal head (HEADNOM56): 28.4 m',
    '- Phase: 3-phase',
    '- Power: 11 kW',
    '- Max operating pressure: 16 bar',
    '- Speed: 2900 RPM',
    '',
    'The pump is suitable for clean, thin, non-explosive liquids without solid particles or fibres.',
    'It complies with IE3 motor efficiency class and is available with various seal types.',
  ].join('\n'),
};

export default function Landing() {
  // Inputs
  const [manufacturer, setManufacturer] = useState('');
  const [productName, setProductName] = useState('');

  // Settings
  const [mode, setMode] = useState('standard');
  const [showAccuracy, setShowAccuracy] = useState(false);

  // Results
  const [results, setResults] = useState(null);   // JSON for standard mode
  const [pdfUrl, setPdfUrl] = useState(null);      // Blob URL for advanced mode
  const [pdfCleanup, setPdfCleanup] = useState(null); // Cleanup function for blob URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing verification sequence...');

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const hasResults = results !== null || pdfUrl !== null;

  // ── Handlers ──

  const clearPdfBlob = useCallback(() => {
    if (pdfCleanup) pdfCleanup();
    setPdfUrl(null);
    setPdfCleanup(null);
  }, [pdfCleanup]);

  const handleSearch = async ({ manufacturer: mfr, productName: pn }) => {
    setError('');
    clearPdfBlob();
    setResults(null);
    setLoading(true);
    try {
      if (mode === 'standard') {
        const data = await standardSearch({
          manufacturer: mfr,
          productName: pn,
          showAccuracy,
        });
        setResults(data.response ?? data);
      } else {
        const { pdfUrl: url, cleanup } = await advancedSearch({
          manufacturer: mfr,
          productName: pn,
          showAccuracy,
        });
        setPdfUrl(url);
        setPdfCleanup(() => cleanup);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOutput = () => {
    if (!manufacturer.trim()) setManufacturer('Grundfos');
    if (!productName.trim()) setProductName('CR 95-2');
    clearPdfBlob();
    if (mode === 'advanced') {
      // Create a tiny test PDF blob for advanced mode preview
      const blob = new Blob(['%PDF-1.0 test'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfCleanup(() => () => URL.revokeObjectURL(url));
      setResults(null);
    } else {
      setResults(TEST_MOCK.standard);
    }
    setError('');
  };

  const handleManufacturerChange = (val) => {
    setManufacturer(val);
    if (error) setError('');
  };

  return (
    <div className={`landing ${hasResults ? 'landing-has-results' : ''}`}>
      {/* Settings gear */}
      <button
        className="settings-gear-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open settings"
      >
        <FiSettings size={20} />
      </button>

  //Output
  const outputData = fetchedData ? [
      { label: 'Nominal Flow', value: fetchedData.FlowNom56 || 'N/A' },
      { label: 'Nominal Head', value: fetchedData.HeadNom56 || 'N/A' },
      { label: 'Phase', value: fetchedData.Phase || 'N/A' },
      { label: 'Product Name', value: fetchedData.productName || productName },
      { label: 'Manufacturer', value: fetchedData.manufacturer || manufacturer }
    ] : [
      { label: 'FlowNom56', value: '' },
      { label: 'Phase', value: '' },
      { label: 'Port', value: '' },
      { label: 'Product Name', value: '' },
      { label: 'Pump Design', value: '' }
    ];

  return (
    <div className="app-container">
      <div className="logo-container">
        <img src={Logo} alt="MARIO Logo" className="logo" />
      </div>
      <div className="form-container">
        {step === 1 && !isLoading && (
          <InputComponent
            stepNumber={1}
            label="Manufacturer"
            value={manufacturer}
            onChange={handleManufacturerChange}
            onNext={handleNext}
            error={error}
            nextImage={NextButtonImg}
          />
        )}

        {step === 2 && !isLoading && (
          <InputComponent
            stepNumber={2}
            label="Product Name"
            value={productName}
            onChange={handleProductNameChange}
            onNext={handleNext}
            onPrev={handlePrev}
            error={error}
            nextImage={EnterButtonImg}
            prevImage={PrevButtonImg}
          />
        )}

        {isLoading && (
          <div className="input-section-container" style={{ textAlign: 'center', color: 'black' }}>
            <h2 style={{ marginTop: '20px' }}>{loadingMessage}</h2>
            <p>Please wait, this usually takes 10 to 15 seconds.</p>
          </div>
        )}

        {step === 3 && !isLoading && (
          <OutputComponent results={outputData} />
        )}
      </div>

      {/* Output area — full-page takeover */}
      {hasResults && (
        <OutputComponent
          manufacturer={manufacturer}
          productName={productName}
          response={results}
          pdfUrl={pdfUrl}
          mode={mode}
          showAccuracy={showAccuracy}
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
