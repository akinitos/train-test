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
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing verification sequence...');

  // Dynamic loading message workflow
  React.useEffect(() => {
    if (isLoading) {
      const messages = [
        'Identifying pump nameplate and variant...',
        'Searching official product catalogs and technical PDFs...',
        'Locating exact variant specifications...',
        'Extracting critical data (Max Flow, Head, Power, Efficiency)...',
        'Cross-referencing material compatibility...',
        'Documenting verified data for reporting...'
      ];
      let idx = 0;
      setLoadingMessage(messages[0]);
      const interval = setInterval(() => {
        idx++;
        if (idx < messages.length) {
          setLoadingMessage(messages[idx]);
        }
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);
  //Error and Input Steps handling
const handleNext = async () => {
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
      
      // --- NEW AGENT FETCH LOGIC ---
      setIsLoading(true); // Start loading state
      
      try {
        const response = await fetch('http://localhost:8000/api/agent/run/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: `Find specs for ${manufacturer} ${productName}` 
          }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // The backend sends a JSON string inside the 'response' key. 
        // We need to parse it into an actual Javascript object.
        const parsedData = JSON.parse(data.response.replace(/```json\n?|\n?```/g, '').trim()); 
        
        setFetchedData(parsedData); // Save the data
        setStep(3); // ONLY move to step 3 if successful!

      } catch (err) {
        console.error("Agent Error:", err);
        setError('Failed to connect to the agent. Check backend terminal.');
      } finally {
        setIsLoading(false); // Stop loading state
      }
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
    </div>
  );
}
