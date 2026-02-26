import React, { useState } from 'react';
import { FiZap } from 'react-icons/fi';
import InputComponent from '../components/inputComponent';
import OutputComponent from '../components/outputComponent';
import ConfirmModal from '../components/ConfirmModal';
import { agentRun } from '../services/api';
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

  // Settings (shown inline instead of sidebar)
  const [mode, setMode] = useState('standard');
  const [showAccuracy, setShowAccuracy] = useState(false);

  // Results
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const hasResults = results !== null;

  // ── Handlers ──

  const handleSearch = async ({ manufacturer: mfr, productName: pn }) => {
    setError('');
    setResults(null);
    setLoading(true);
    try {
      const data = await agentRun({
        manufacturer: mfr,
        productName: pn,
        mode,
        showAccuracy,
      });
      setResults(data.response ?? data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOutput = () => {
    if (!manufacturer.trim()) setManufacturer('Grundfos');
    if (!productName.trim()) setProductName('CR 95-2');
    setResults(TEST_MOCK.standard);
    setError('');
  };

  const handleRefresh = () => {
    setShowConfirmModal(true);
  };

  const handleClearResults = () => {
    setResults(null);
    setError('');
    setShowConfirmModal(false);
  };

  return (
    <div className={`landing ${hasResults ? 'landing-has-results' : ''}`}>
      {/* Dev: Test output button */}
      {import.meta.env.DEV && (
        <button
          className="test-output-btn"
          onClick={handleTestOutput}
          title="Inject mock test output (dev only)"
        >
          <FiZap size={14} />
          <span>Test Output</span>
        </button>
      )}

      {/* Main content */}
      <div className={`landing-main ${hasResults ? 'landing-main-compact' : 'landing-main-centered'}`}>
        {/* Logo */}
        <div className={`logo-container ${hasResults ? 'logo-compact' : ''}`}>
          <img src={Logo} alt="MARIO Logo" className="logo" />
        </div>

        {/* Inline controls: mode toggle + accuracy */}
        <div className={`inline-controls ${hasResults ? 'inline-controls-compact' : ''}`}>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'standard' ? 'mode-btn-active' : ''}`}
              onClick={() => setMode('standard')}
              disabled={loading}
            >
              Standard
            </button>
            <button
              className={`mode-btn ${mode === 'advanced' ? 'mode-btn-active' : ''}`}
              onClick={() => setMode('advanced')}
              disabled={loading}
            >
              Advanced
            </button>
          </div>

          <label className="accuracy-toggle" title="Compare results with reference data">
            <input
              type="checkbox"
              checked={showAccuracy}
              onChange={(e) => setShowAccuracy(e.target.checked)}
              disabled={loading}
            />
            <span className="accuracy-toggle-slider"></span>
            <span className="accuracy-toggle-label">Show Accuracy</span>
          </label>
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
