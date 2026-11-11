"use client";

import { useState, useCallback, createContext, useContext } from "react";

interface DialogState {
  type: "alert" | "confirm";
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showAlert: (title: string, message?: string) => void;
  showConfirm: (opts: { title: string; message?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void }) => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog(): DialogContextType {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be inside DialogProvider");
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const showAlert = useCallback((title: string, message?: string) => {
    setDialog({ type: "alert", title, message });
  }, []);

  const showConfirm = useCallback((opts: { title: string; message?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void }) => {
    setDialog({
      type: "confirm",
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel || "Confirm",
      destructive: opts.destructive,
      onConfirm: () => { setDialog(null); opts.onConfirm(); },
      onCancel: () => setDialog(null),
    });
  }, []);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Dialog overlay */}
      {dialog && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" onClick={() => setDialog(null)}>
          <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="absolute inset-0 flex items-center justify-center px-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-[320px] rounded-[16px] overflow-hidden sheet-enter" style={{ background: "var(--card)" }}>
              {/* Content */}
              <div className="px-5 pt-6 pb-4 text-center">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: dialog.destructive ? "var(--coral-soft)" : "var(--sand)" }}>
                  {dialog.destructive ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  ) : dialog.type === "confirm" ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  )}
                </div>
                <h3 className="text-[16px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{dialog.title}</h3>
                {dialog.message && (
                  <p className="text-[13px] mt-1.5 leading-[145%]" style={{ color: "var(--text-muted)" }}>{dialog.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4">
                {dialog.type === "alert" ? (
                  <button type="button" onClick={() => setDialog(null)}
                    className="w-full h-[44px] rounded-[12px] flex items-center justify-center text-[14px] font-bold press-feedback"
                    style={{ background: "var(--dark)", color: "white" }}>
                    OK
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={dialog.onCancel}
                      className="flex-1 h-[44px] rounded-[12px] flex items-center justify-center text-[14px] font-bold press-feedback"
                      style={{ background: "var(--sand)", color: "var(--text)" }}>
                      {dialog.cancelLabel || "Cancel"}
                    </button>
                    <button type="button" onClick={dialog.onConfirm}
                      className="flex-1 h-[44px] rounded-[12px] flex items-center justify-center text-[14px] font-bold text-white press-feedback"
                      style={{ background: dialog.destructive ? "var(--coral)" : "var(--dark)" }}>
                      {dialog.confirmLabel || "Confirm"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
