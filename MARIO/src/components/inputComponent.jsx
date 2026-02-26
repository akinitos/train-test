import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const InputComponent = ({
  manufacturer,
  productName,
  onManufacturerChange,
  onProductNameChange,
  onSubmit,
  loading = false,
  compact = false,
  error = '',
}) => {
  const [fieldErrors, setFieldErrors] = useState({ manufacturer: '', productName: '' });

  const validate = () => {
    const errs = { manufacturer: '', productName: '' };
    if (!manufacturer.trim()) errs.manufacturer = 'Manufacturer is required.';
    if (!productName.trim()) errs.productName = 'Product name is required.';
    setFieldErrors(errs);
    return !errs.manufacturer && !errs.productName;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!loading && validate()) {
      onSubmit({ manufacturer: manufacturer.trim(), productName: productName.trim() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className={`search-bar-wrapper ${compact ? 'search-bar-compact' : ''}`}>
      <form className="search-bar" onSubmit={handleSubmit} noValidate>
        <div className="search-field">
          <input
            type="text"
            className={`search-input ${fieldErrors.manufacturer ? 'input-error' : ''}`}
            placeholder="Manufacturer"
            value={manufacturer}
            onChange={(e) => {
              onManufacturerChange(e.target.value);
              clearFieldError('manufacturer');
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          {fieldErrors.manufacturer && (
            <span className="error-text">{fieldErrors.manufacturer}</span>
          )}
        </div>

        <div className="search-field">
          <input
            type="text"
            className={`search-input ${fieldErrors.productName ? 'input-error' : ''}`}
            placeholder="Product Name"
            value={productName}
            onChange={(e) => {
              onProductNameChange(e.target.value);
              clearFieldError('productName');
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          {fieldErrors.productName && (
            <span className="error-text">{fieldErrors.productName}</span>
          )}
        </div>

        <button
          type="submit"
          className={`search-submit-btn ${loading ? 'search-loading' : ''}`}
          disabled={loading}
          aria-label="Search"
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <FiSearch size={20} />
          )}
        </button>
      </form>

      {error && <p className="search-error">{error}</p>}
    </div>
  );
};

export default InputComponent;