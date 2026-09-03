"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CircularLoader } from './BlindpotLoader';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  timestamp: number;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions): string => {
      const id = options?.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const duration = options?.duration !== undefined ? options.duration : type === 'loading' ? 0 : 5000;

      const newItem: ToastItem = {
        id,
        type,
        message,
        title: options?.title,
        duration,
        timestamp: Date.now(),
      };

      setToasts((prev) => {
        const existingIndex = prev.findIndex((t) => t.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newItem;
          return updated;
        }
        return [...prev, newItem];
      });

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback((message: string, options?: ToastOptions) => toast(message, 'success', options), [toast]);
  const error = useCallback((message: string, options?: ToastOptions) => toast(message, 'error', options), [toast]);
  const info = useCallback((message: string, options?: ToastOptions) => toast(message, 'info', options), [toast]);
  const loading = useCallback((message: string, options?: ToastOptions) => toast(message, 'loading', options), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, loading, dismiss }}>
      {children}
      {/* Floating Toast Notification Container */}
      <div 
        role="region"
        aria-label="Notifications"
        className="fixed top-20 right-4 sm:right-6 md:right-8 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto border-2 bg-surface p-4 hard-shadow-primary transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex flex-col gap-1.5 ${
              t.type === 'success'
                ? 'border-secondary'
                : t.type === 'error'
                ? 'border-error'
                : 'border-primary'
            }`}
          >
            {/* Header / Sublabel */}
            <div className="flex items-center justify-between border-b border-outline pb-1 mb-1">
              <div className="flex items-center gap-1.5">
                {t.type === 'success' && (
                  <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                )}
                {t.type === 'error' && (
                  <span className="material-symbols-outlined text-error text-[16px]">error</span>
                )}
                {t.type === 'info' && (
                  <span className="material-symbols-outlined text-primary text-[16px]">info</span>
                )}
                {t.type === 'loading' && <CircularLoader size="sm" />}

                <span className="font-label-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  {t.title || (t.type === 'loading' ? 'PROCESSING' : t.type.toUpperCase())}
                </span>
              </div>

              <button
                onClick={() => dismiss(t.id)}
                className="text-on-surface-variant hover:text-primary transition-colors text-xs font-mono px-1"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>

            {/* Message Body */}
            <div className="font-mono text-xs text-primary leading-relaxed break-words">
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
