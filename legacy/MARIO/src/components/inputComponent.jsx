import React from 'react';

const InputComponent = ({ 
  stepNumber, 
  label, 
  value, 
  onChange, 
  onNext, 
  onPrev,
  error,
  nextImage, 
  prevImage  
}) => {
  return (
    <div className="input-section-container">
      <h2 className="input-title">INPUT:</h2>
      <h3 className="input-label">{stepNumber}. {label}</h3>
      
      <div className="input-wrapper">
        <div className="input-row">
          <input 
            type="text" 
            className={`box-input ${error ? 'input-error' : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="button-group">
            {onPrev && prevImage && (
              <button className="img-btn" onClick={onPrev}>
                <img src={prevImage} alt="Previous" />
              </button>
            )}
            <button className="img-btn" onClick={onNext}>
              <img src={nextImage} alt={stepNumber === 2 ? "Submit" : "Next"} />
            </button>
          </div>
        </div>
        
        {error && <span className="error-text">{error}</span>}
      </div>
    </div>
  );
};

export default InputComponent;