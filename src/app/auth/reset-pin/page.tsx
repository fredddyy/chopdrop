"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";

function ResetPinForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"pin" | "confirm" | "done">("pin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="max-w-[400px] w-full text-center">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(232,96,76,0.1)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
          </div>
          <h1 className="text-[24px] font-extrabold mb-2" style={{ color: "var(--text)" }}>Invalid reset link</h1>
          <p className="text-[15px] mb-6" style={{ color: "var(--text-secondary)" }}>This link is expired or invalid. Request a new one.</p>
          <a href="/auth" className="text-[15px] font-bold" style={{ color: "var(--coral)" }}>Back to login</a>
        </div>
      </main>
    );
  }

  function handlePinInput(arr: string[], setArr: (v: string[]) => void, i: number, v: string, prefix: string) {
    if (!/^\d*$/.test(v)) return;
    const c = [...arr]; c[i] = v.slice(-1); setArr(c);
    if (v && i < 3) document.getElementById(`${prefix}-${i + 1}`)?.focus();
    if (v && i === 3 && prefix === "pin") {
      const full = c.join("");
      if (full.length === 4) setStep("confirm");
    }
    if (v && i === 3 && prefix === "confirm") {
      const full = c.join("");
      if (full.length === 4) handleSubmit(pin.join(""), full);
    }
  }

  function handleKeyDown(arr: string[], i: number, key: string, prefix: string) {
    if (key === "Backspace" && !arr[i] && i > 0) document.getElementById(`${prefix}-${i - 1}`)?.focus();
  }

  async function handleSubmit(newPin: string, confirmed: string) {
    if (newPin !== confirmed) {
      setError("PINs don't match. Try again.");
      setConfirmPin(["", "", "", ""]);
      setStep("confirm");
      setTimeout(() => document.getElementById("confirm-0")?.focus(), 100);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin: newPin }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }
      setStep("done");
      setTimeout(() => { window.location.href = "/auth"; }, 2500);
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  const inputCls = "w-[64px] h-[64px] text-center text-[24px] font-extrabold bg-white border-2 rounded-[16px] focus:outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 transition-all";

  if (step === "done") {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--dark)" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--emerald)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          <h2 className="text-[26px] font-extrabold text-white mb-2">PIN updated!</h2>
          <p className="text-[14px] text-white/40 animate-pulse">Taking you to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-[400px] w-full">
        <div className="flex items-center justify-center mb-10"><Logo size={28} /></div>

        <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-6" style={{ background: "rgba(232,96,76,0.1)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>

        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] mb-2" style={{ color: "var(--text)" }}>
          {step === "pin" ? "Create new PIN" : "Confirm your PIN"}
        </h1>
        <p className="text-[16px] mb-8" style={{ color: "var(--text-secondary)" }}>
          {step === "pin" ? "Choose a 4-digit PIN you'll remember" : "Enter it one more time"}
        </p>

        {error && <div className="p-3 rounded-[14px] mb-4 text-[14px] font-medium" style={{ background: "#FEF2F2", color: "var(--coral)" }}>{error}</div>}

        <div className="flex justify-center gap-3 mb-8">
          {(step === "pin" ? pin : confirmPin).map((d, i) => (
            <input
              key={`${step}-${i}`}
              id={`${step === "pin" ? "pin" : "confirm"}-${i}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => step === "pin"
                ? handlePinInput(pin, setPin, i, e.target.value, "pin")
                : handlePinInput(confirmPin, setConfirmPin, i, e.target.value, "confirm")
              }
              onKeyDown={(e) => step === "pin"
                ? handleKeyDown(pin, i, e.key, "pin")
                : handleKeyDown(confirmPin, i, e.key, "confirm")
              }
              className={inputCls}
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {loading && <p className="text-[14px] text-center" style={{ color: "var(--text-secondary)" }}>Saving...</p>}
      </div>
    </main>
  );
}

export default function ResetPinPage() {
  return (
    <Suspense fallback={<main className="min-h-svh flex items-center justify-center" style={{ background: "var(--bg)" }}><p style={{ color: "var(--text-muted)" }}>Loading...</p></main>}>
      <ResetPinForm />
    </Suspense>
  );
}
