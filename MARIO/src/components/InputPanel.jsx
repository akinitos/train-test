import React, { useState } from 'react';
import '../styles/InputPanel.css';

const InputPanel = ({
  onSubmit,
  loading = false,
  visible = true,
}) => {
  const [manufacturer, setManufacturer] = useState('');
  const [productName, setProductName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ manufacturer: '', productName: '' });

  const validate = () => {
    const errs = { manufacturer: '', productName: '' };
    if (!manufacturer.trim()) errs.manufacturer = 'Please enter a manufacturer.';
    if (!productName.trim()) errs.productName = 'Please enter a model name.';
    setFieldErrors(errs);
    return !errs.manufacturer && !errs.productName;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!loading && validate()) {
      onSubmit({
        manufacturer: manufacturer.trim(),
        productName: productName.trim(),
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className={`input-panel ${visible ? 'input-panel-visible' : 'input-panel-hidden'}`}>
      <div className="input-panel-inner">
        <h2 className="input-panel-title">INPUT:</h2>

        <form className="input-panel-form" onSubmit={handleSubmit} noValidate>
          {/* Manufacturer */}
          <div className="input-panel-field">
            <label className="input-panel-label">1. Manufacturer</label>
            <div className="input-panel-input-wrapper">
              <input
                type="text"
                className={`input-panel-input ${fieldErrors.manufacturer ? 'input-error' : ''}`}
                value={manufacturer}
                onChange={(e) => {
                  setManufacturer(e.target.value);
                  clearFieldError('manufacturer');
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="e.g. Grundfos"
              />
              {fieldErrors.manufacturer && (
                <span className="input-panel-error">{fieldErrors.manufacturer}</span>
              )}
            </div>
          </div>

          {/* Model Name */}
          <div className="input-panel-field">
            <label className="input-panel-label">2. Model Name</label>
            <div className="input-panel-input-wrapper">
              <input
                type="text"
                className={`input-panel-input ${fieldErrors.productName ? 'input-error' : ''}`}
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  clearFieldError('productName');
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="e.g. CR 45-3"
              />
              {fieldErrors.productName && (
                <span className="input-panel-error">{fieldErrors.productName}</span>
              )}
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className={`input-panel-submit ${loading ? 'input-panel-submit-loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="input-panel-spinner" />
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputPanel;
