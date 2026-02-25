import React, { useState } from 'react';
import InputComponent from '../components/inputComponent';
import OutputComponent from '../components/outputComponent';
import Logo from '../assets/logo.png';
import NextButtonImg from '../assets/next.png'; 
import EnterButtonImg from '../assets/enter.png'; 
import PrevButtonImg from '../assets/prev.png'; 
import '../styles/landing.css';

export default function Landing() {
  //Setup
  const [step, setStep] = useState(1);
  const [manufacturer, setManufacturer] = useState('');
  const [productName, setProductName] = useState('');
  const [error, setError] = useState('');

  //Error and Input Steps handling
  const handleNext = () => {
    if (step === 1) {
      if (manufacturer.trim() === '') {
        setError('Please enter a manufacturer.');
        return;
      }
      setError('');
      setStep(2);
    }
    
    if (step === 2) {
      if (productName.trim() === '') {
        setError('Please enter a product name.');
        return;
      }
      setError('');
      console.log('Submitted:', { manufacturer, productName });
      setStep(3); 
    }
  };

  const handlePrev = () => {
    setError('');
    if (step === 2) setStep(1);
  };

  const handleManufacturerChange = (val) => {
    setManufacturer(val);
    if (error) setError('');
  };

  const handleProductNameChange = (val) => {
    setProductName(val);
    if (error) setError('');
  };

  //Output
  const outputData = [
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
        {step === 1 && (
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

        {step === 2 && (
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

        {step === 3 && (
          <OutputComponent results={outputData} />
        )}
      </div>
    </div>
  );
}
