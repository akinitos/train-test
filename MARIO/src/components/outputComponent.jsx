import React from 'react';

const OutputComponent = ({ results }) => {
  return (
    <div className="input-section-container">
      <h2 className="input-title">OUTPUT:</h2>
      
      <div className="output-list">
        {results.map((item, index) => (
          <div className="output-row" key={index}>
            <h3 className="output-label">{item.label}:</h3>
            <div className="output-box">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutputComponent;