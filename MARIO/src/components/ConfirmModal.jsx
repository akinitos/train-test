import React from 'react';
import { FiTrash2, FiX } from 'react-icons/fi';
import '../styles/ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <FiX size={20} />
        </button>

        <h3 className="modal-title">Clear Results?</h3>
        <p className="modal-text">
          Are you sure you want to clear the current results?
        </p>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={onConfirm}>
            <FiTrash2 size={16} />
            <span>Clear Results</span>
          </button>
          <button className="modal-btn modal-btn-tertiary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
