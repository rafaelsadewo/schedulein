'use client';

import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-brutal-fg text-brutal-bg border-brutal-fg',
    error: 'bg-brutal-red text-brutal-bg border-brutal-red',
    info: 'bg-brutal-bg text-brutal-fg border-brutal-fg',
    warning: 'bg-brutal-bg text-brutal-red border-brutal-red',
  };

  const icon = {
    success: '✓',
    error: '×',
    info: '◆',
    warning: '▲',
  };

  return (
    <div
      className={`fixed top-4 right-4 border-2 ${bgColor[type]} px-6 py-4 font-mono text-xs font-bold tracking-wide z-50`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg leading-none">{icon[type]}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={0}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
