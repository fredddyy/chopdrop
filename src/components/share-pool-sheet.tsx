"use client";

import { useState } from "react";
import { sharePool, shareToWhatsApp, copyShareLink } from "@/lib/share";

interface SharePoolSheetProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  groupPrice: number;
  retailPrice: number;
  spotsLeft: number;
  poolSize: number;
  productId: string;
  joined: number;
}

export function SharePoolSheet({
  open,
  onClose,
  productName,
  groupPrice,
  retailPrice,
  spotsLeft,
  poolSize,
  productId,
  joined,
}: SharePoolSheetProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/product/${productId}` : "";
  const fillPct = Math.round((joined / poolSize) * 100);

  if (!open) return null;

  const opts = { productName, groupPrice, retailPrice, spotsLeft, poolSize, url };

  async function handleShare() {
    const result = await sharePool(opts);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (result === "shared") onClose();
  }

  async function handleCopy() {
    const ok = await copyShareLink(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90]"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[91] rounded-t-[24px] px-5 pt-5 pb-8 max-w-[428px] mx-auto"
        style={{ background: "var(--card)", animation: "slideUp 200ms ease-out" }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />

        {/* Header */}
        <h3 className="text-[18px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
          Share to fill the pool
        </h3>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
          {spotsLeft === 1 ? "One more person" : `${spotsLeft} more people`} and everyone saves.
        </p>

        {/* Fill progress */}
        <div className="mt-4 p-3 rounded-[12px]" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-between text-[12px] font-bold mb-1.5">
            <span style={{ color: "var(--text)" }}>{joined}/{poolSize} joined</span>
            <span style={{ color: "var(--emerald)" }}>{fillPct}%</span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(fillPct, 100)}%`, background: "var(--emerald)" }} />
          </div>
        </div>

        {/* WhatsApp button (primary) */}
        <button
          type="button"
          onClick={() => shareToWhatsApp(opts)}
          className="mt-4 w-full h-[50px] rounded-full flex items-center justify-center gap-2.5 text-[14px] font-bold text-white press-feedback"
          style={{ background: "#25D366" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </button>

        {/* Share / Copy row */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 h-[44px] rounded-full text-[13px] font-bold press-feedback"
            style={{ background: "var(--coral)", color: "white" }}
          >
            Share link
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 h-[44px] rounded-full text-[13px] font-bold press-feedback"
            style={{ background: "var(--sand)", color: "var(--text)" }}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
