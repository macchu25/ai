"use client"

import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  return (
    <div className={`toast-item ${type}`}>
      <div className="toast-icon">
        {type === 'success' && <CheckCircle size={20} />}
        {type === 'error' && <AlertCircle size={20} />}
        {type === 'info' && <Info size={20} />}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
      <div className="toast-progress"></div>

      <style jsx>{`
        .toast-item {
          pointer-events: auto;
          min-width: 320px;
          max-width: 450px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: toastIn 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
        }

        @keyframes toastIn {
          from { transform: translateX(120%) scale(0.8); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }

        .toast-item.success { border-left: 6px solid #10b981; }
        .toast-item.error { border-left: 6px solid #ef4444; }
        .toast-item.info { border-left: 6px solid #3b82f6; }

        .toast-icon { flex-shrink: 0; display: flex; align-items: center; }
        .success .toast-icon { color: #10b981; }
        .error .toast-icon { color: #ef4444; }
        .info .toast-icon { color: #3b82f6; }

        .toast-message {
          color: #0f172a;
          font-weight: 700;
          font-size: 0.9rem;
          line-height: 1.5;
          flex: 1;
        }

        .toast-close {
          background: rgba(0,0,0,0.03);
          border: none;
          color: #64748b;
          cursor: pointer;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .toast-close:hover { background: #f1f5f9; color: #0f172a; }

        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 4px;
          background: rgba(0,0,0,0.04);
          width: 100%;
        }

        .toast-progress::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: currentColor;
          animation: progressRun 5s linear forwards;
        }

        .success .toast-progress::after { color: #10b981; }
        .error .toast-progress::after { color: #ef4444; }
        .info .toast-progress::after { color: #3b82f6; }

        @keyframes progressRun {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
