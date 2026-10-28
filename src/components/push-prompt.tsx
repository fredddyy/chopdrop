"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "chopdrop-push-dismissed";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Don't show if: no support, already subscribed, recently dismissed, no VAPID key
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) return;
    if (Notification.permission === "granted") {
      // Already granted — silently subscribe if not yet
      silentSubscribe();
      return;
    }
    if (Notification.permission === "denied") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Show prompt after 5 seconds on the page
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  async function silentSubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return; // already subscribed
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch { /* silent fail */ }
  }

  async function handleAllow() {
    setShow(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await silentSubscribe();
        setSubscribed(true);
      }
    } catch { /* ignore */ }
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  if (!show || subscribed) return null;

  return (
    <div style={{ position: "fixed", bottom: 72, left: 0, right: 0, zIndex: 9998, padding: "0 16px", animation: "pushSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ maxWidth: 428, margin: "0 auto", background: "var(--dark)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.3 }}>Get notified when the menu drops</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>We&apos;ll ping you when it&apos;s time to order</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={handleAllow} style={{ background: "var(--coral)", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Allow
          </button>
          <button onClick={handleDismiss} aria-label="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4, display: "flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes pushSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
