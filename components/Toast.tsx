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
    success: 'bg-brutal-accent text-brutal-fg-light border-brutal-accent',
    error: 'bg-brutal-red text-brutal-bg-light border-brutal-red',
    info: 'bg-brutal-fg-light text-brutal-bg-light border-brutal-fg-light',
    warning: 'bg-yellow-400 text-brutal-fg-light border-yellow-400',
  };

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '!',
  };

  return (
    <div
      className={`fixed top-4 right-4 border-2 ${bgColor[type]} px-6 py-4 font-mono text-sm font-bold tracking-tight z-50 animate-pulse`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon[type]}</span>
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
