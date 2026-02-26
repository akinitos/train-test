import React from 'react';
import { FiX, FiSettings } from 'react-icons/fi';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, onClose, mode, onModeChange, showAccuracy, onShowAccuracyChange }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      {/* Panel */}
      <aside className={`sidebar-panel ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">
            <FiSettings size={18} />
            <span>Settings</span>
          </h3>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close settings">
            <FiX size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          {/* Mode Toggle */}
          <div className="sidebar-section">
            <label className="sidebar-label">Search Mode</label>
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === 'standard' ? 'mode-btn-active' : ''}`}
                onClick={() => onModeChange('standard')}
              >
                Standard
              </button>
              <button
                className={`mode-btn ${mode === 'advanced' ? 'mode-btn-active' : ''}`}
                onClick={() => onModeChange('advanced')}
              >
                Advanced
              </button>
            </div>
            <p className="sidebar-hint">
              {mode === 'standard'
                ? 'User-friendly summarized output.'
                : 'Comprehensive search with detailed data.'}
            </p>
          </div>

          {/* Show Accuracy Toggle */}
          <div className="sidebar-section">
            <div className="toggle-row">
              <label className="sidebar-label" htmlFor="accuracy-toggle">
                Show Accuracy
              </label>
              <label className="toggle-switch">
                <input
                  id="accuracy-toggle"
                  type="checkbox"
                  checked={showAccuracy}
                  onChange={(e) => onShowAccuracyChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <p className="sidebar-hint">
              Enable to compare actual results with the agent's output.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
