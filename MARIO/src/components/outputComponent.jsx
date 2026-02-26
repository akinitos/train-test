import React from 'react';

const OutputComponent = ({
    label1,
    value1,
    label2,
    value2,
    homeImage,
    onHome,
    results }) => {
  return (
    <div className="input-section-container">
      <h2 className="input-title">OUTPUT:</h2>
      
      <div className="output-list">
        <div className="output-row">
            <h3 className="output-label">{label1}:</h3>
            <div className="output-box">{value1}</div>
        </div>
        <div className="output-row">
            <h3 className="output-label">{label2}:</h3>
            <div className="output-box">{value2}</div>
        </div>  
        {results.map((item, index) => (
          <div className="output-row" key={index}>
            <h3 className="output-label">{item.label}:</h3>
            <div className="output-box">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="input-wrapper">
        <button className="img-btn" onClick={onHome}>
            <img src={homeImage} alt="Home"/>
        </button>
       </div>
    </div>
  );
};

export default OutputComponent;