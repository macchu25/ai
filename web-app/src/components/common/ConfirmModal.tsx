"use client"

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmType?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ isOpen, title, message, confirmText = 'Xác nhận xóa', confirmType = 'danger', onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className={`warning-icon ${confirmType}`}>
            <AlertTriangle size={24} />
          </div>
          <button className="close-btn" onClick={onCancel}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>Hủy bỏ</button>
          <button className={`btn-confirm ${confirmType}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px) saturate(180%);
          width: 100%;
          max-width: 400px;
          border-radius: 32px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 40px 80px rgba(0,0,0,0.15);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .warning-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .warning-icon.danger { background: #fef2f2; color: #ef4444; }
        .warning-icon.primary { background: #eff6ff; color: #3b82f6; }

        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;
        }
        .close-btn:hover { color: #1e293b; }

        .modal-body h3 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .modal-body p {
          color: #64748b;
          line-height: 1.6;
          font-size: 1rem;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn-cancel {
          flex: 1;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }

        .btn-confirm {
          flex: 1.5;
          padding: 14px;
          border-radius: 16px;
          border: none;
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-confirm.danger { background: #ef4444; box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2); }
        .btn-confirm.danger:hover { background: #dc2626; transform: translateY(-2px); }
        
        .btn-confirm.primary { background: #3b82f6; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }
        .btn-confirm.primary:hover { background: #2563eb; transform: translateY(-2px); }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
