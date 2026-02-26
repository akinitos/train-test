import React, { useState } from 'react';
import InputPanel from '../components/InputPanel';
import ThoughtProcess from '../components/ThoughtProcess';
import TabOutput from '../components/TabOutput';
import { agentStream } from '../services/api';
import { mockIndustrialPumpReport, mockThoughtEvents } from '../mockData.js';
import Logo from '../assets/logo.svg';
import '../styles/Dashboard.css';

// Development toggle: set to false for production
const USE_MOCK_DATA = true;

// Phases: input → thinking → results
const PHASE_INPUT = 'input';
const PHASE_THINKING = 'thinking';
const PHASE_RESULTS = 'results';

export default function Dashboard() {
  const [phase, setPhase] = useState(PHASE_INPUT);
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState('');
  const [streamEvents, setStreamEvents] = useState([]);

  // Track animation states
  const [inputVisible, setInputVisible] = useState(true);
  const [thinkingVisible, setThinkingVisible] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);

  // ── Handle search submit ──

  const handleSearch = async ({ manufacturer, productName }) => {
    setError('');
    setResults(null);
    setStreamEvents([]);

    // Phase 1 → 2: Animate out input, then show thinking
    setInputVisible(false);

    // Wait for input fade-out animation
    await delay(400);
    setPhase(PHASE_THINKING);
    setThinkingVisible(true);

    if (USE_MOCK_DATA) {
      // Simulate streaming thought events one by one
      for (let i = 0; i < mockThoughtEvents.length; i++) {
        await delay(800 + Math.random() * 700);
        setStreamEvents((prev) => [...prev, mockThoughtEvents[i]]);
      }

      // Simulate final processing delay
      await delay(1500);

      // Phase 2 → 3: Animate out thinking, show results
      setThinkingVisible(false);
      await delay(400);

      setResults(mockIndustrialPumpReport);
      setPhase(PHASE_RESULTS);
      setResultsVisible(true);
    } else {
      // Real backend streaming
      const finalChunks = [];
      try {
        await agentStream({
          manufacturer,
          productName,
          mode: 'standard',
          sessionId,
          onEvent: (event) => {
            if (event.type === 'chunk') {
              finalChunks.push(event.content);
            } else if (event.type === 'done') {
              const responseText = finalChunks.join('') || '(no response)';
              // Transition: thinking → results
              setThinkingVisible(false);
              setTimeout(() => {
                setResults(responseText);
                if (event.session_id) setSessionId(event.session_id);
                setPhase(PHASE_RESULTS);
                setResultsVisible(true);
              }, 400);
            } else if (['tool_call', 'tool_result', 'thought'].includes(event.type)) {
              setStreamEvents((prev) => [...prev, event]);
            }
          },
        });
      } catch (err) {
        setError(err.message || 'Something went wrong.');
        // Go back to input on error
        setThinkingVisible(false);
        await delay(400);
        setPhase(PHASE_INPUT);
        setInputVisible(true);
      }
    }
  };

  // ── New search: reset everything ──

  const handleNewSearch = () => {
    setResultsVisible(false);
    setTimeout(() => {
      setPhase(PHASE_INPUT);
      setResults(null);
      setStreamEvents([]);
      setSessionId(null);
      setError('');
      setInputVisible(true);
    }, 400);
  };

  return (
    <div className="dashboard">
      {/* Logo — always shown, shrinks in thinking/results */}
      <div className={`dashboard-logo ${phase !== PHASE_INPUT ? 'dashboard-logo-compact' : ''}`}>
        <img src={Logo} alt="MARIO Logo" className="dashboard-logo-img" />
      </div>

      {/* Phase: Input */}
      {phase === PHASE_INPUT && (
        <InputPanel
          onSubmit={handleSearch}
          loading={false}
          visible={inputVisible}
        />
      )}

      {/* Error message */}
      {error && <p className="dashboard-error">{error}</p>}

      {/* Phase: Thinking */}
      {phase === PHASE_THINKING && (
        <ThoughtProcess
          events={streamEvents}
          isActive={thinkingVisible}
          visible={thinkingVisible}
        />
      )}

      {/* Phase: Results */}
      {phase === PHASE_RESULTS && (
        <TabOutput
          data={results}
          visible={resultsVisible}
          onNewSearch={handleNewSearch}
        />
      )}
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
