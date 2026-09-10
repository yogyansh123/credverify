import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'error':
        return <XCircle size={20} color="#ef4444" />;
      default:
        return <Info size={20} color="#6366f1" />;
    }
  };

  const getBorder = () => {
    switch (toast.type) {
      case 'success': return '1px solid rgba(16, 185, 129, 0.4)';
      case 'warning': return '1px solid rgba(245, 158, 11, 0.4)';
      case 'error': return '1px solid rgba(239, 68, 68, 0.4)';
      default: return '1px solid rgba(99, 102, 241, 0.4)';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 10000,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      border: getBorder(),
      padding: '14px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: '#ffffff',
      fontSize: '0.9rem',
      fontWeight: 500,
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {getIcon()}
      <span>{toast.message}</span>
    </div>
  );
};
