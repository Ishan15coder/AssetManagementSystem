"use client";

import { useEffect, useState } from "react";
import { ToastEvent } from "@/lib/toast";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: ToastEvent["type"];
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent<ToastEvent>) => {
      const newToast = { id: Date.now(), ...e.detail };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener("assetflow-toast" as any, handleToast);
    return () => window.removeEventListener("assetflow-toast" as any, handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 w-80 p-4 rounded-xl shadow-xl border bg-[var(--surface)] animate-in slide-in-from-right fade-in duration-300 ${
            toast.type === "success"
              ? "border-[var(--success)]"
              : toast.type === "error"
              ? "border-[var(--danger)]"
              : "border-[var(--accent)]"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="text-[var(--success)] shrink-0" size={20} />}
          {toast.type === "error" && <XCircle className="text-[var(--danger)] shrink-0" size={20} />}
          {toast.type === "info" && <Info className="text-[var(--accent)] shrink-0" size={20} />}
          
          <div className="flex-1 text-sm font-medium text-[var(--fg)] pt-0.5">
            {toast.message}
          </div>
          
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-[var(--muted)] hover:text-[var(--fg)] shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
