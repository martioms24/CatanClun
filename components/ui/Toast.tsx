"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = "info",
  onClose,
  duration = 4000,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const styles = {
    success:
      "bg-medieval-green text-parchment border-medieval-green/80",
    error:
      "bg-medieval-burgundy text-parchment border-medieval-burgundy/80",
    info: "bg-medieval-brown text-parchment border-medieval-brown/80",
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-medieval border-2 px-4 py-3 shadow-medieval-lg",
        "font-garamond text-base max-w-sm",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        styles[type]
      )}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Simple toast context/hook for global usage
import { createContext, useContext, useCallback } from "react";

type ToastItem = ToastProps & { id: string };
const ToastContext = createContext<{
  showToast: (t: Omit<ToastProps, "onClose">) => void;
}>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((t: Omit<ToastProps, "onClose">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
