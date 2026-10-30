"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.4)" }}
      onMouseDown={onCancel}>
      <div className="w-full max-w-[340px] rounded-[20px] overflow-hidden" style={{ background: "var(--card)", animation: "confirmIn 0.2s ease" }}
        onMouseDown={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <h3 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>{title}</h3>
          <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{message}</p>
        </div>
        <div className="flex" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onCancel}
            className="flex-1 h-12 text-[15px] font-bold cursor-pointer transition-colors"
            style={{ color: "var(--text-secondary)", borderRight: "1px solid var(--border)" }}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 h-12 text-[15px] font-bold cursor-pointer transition-colors"
            style={{ color: destructive ? "var(--coral)" : "var(--emerald)" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes confirmIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
