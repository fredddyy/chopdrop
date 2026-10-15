"use client";

import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="menu-button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen(!open)}
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          <a href="#how">How it works</a>
          <a href="#audiences">Who it&apos;s for</a>
          <a href="#about">About us</a>
          <hr />
          <a href="/menu" className="action action-primary">
            Use the App <span aria-hidden="true">→</span>
          </a>
          <a href="#cta" className="action action-outline mobile-wa">
            Order on WhatsApp <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </>
  );
}
