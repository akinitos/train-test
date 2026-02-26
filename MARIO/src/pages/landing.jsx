import React, { useState, useCallback } from 'react';
import { FiSettings, FiZap } from 'react-icons/fi';
import InputComponent from '../components/inputComponent';
import OutputComponent from '../components/outputComponent';
import ConfirmModal from '../components/ConfirmModal';
import { standardSearch, advancedSearch } from '../services/api';
import Logo from '../assets/logo.svg';
import '../styles/landing.css';

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
    if (!manufacturer.trim()) setManufacturer('');
    if (!productName.trim()) setProductName('');
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

  const handleRefresh = () => {
    setShowConfirmModal(true);
  };

  const handleClearResults = () => {
    setResults(null);
    clearPdfBlob();
    setError('');
    setManufacturer('');
    setProductName('');
    setShowConfirmModal(false);
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

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mode={mode}
        onModeChange={setMode}
        showAccuracy={showAccuracy}
        onShowAccuracyChange={setShowAccuracy}
      />

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
