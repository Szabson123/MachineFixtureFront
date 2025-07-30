// src/components/shared/Toast.tsx
import React, { useEffect } from "react";
import "./Toast.css";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return <div className="toast-success">{message}</div>;
};

export default Toast;
