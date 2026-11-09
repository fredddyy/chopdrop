"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Setting definitions ── */

interface SettingDef {
  key: string;
  label: string;
  type: "number" | "text" | "toggle";
  defaultValue: string;
  suffix?: string;
}

interface SettingGroup {
  title: string;
  description: string;
  settings: SettingDef[];
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    title: "Pool Settings",
    description: "Configure default pool behavior",
    settings: [
      {
        key: "pool-default-timer",
        label: "Default pool timer (hours)",
        type: "number",
        defaultValue: "6",
        suffix: "hrs",
      },
      {
        key: "pool-default-min-size",
        label: "Default min pool size",
        type: "number",
        defaultValue: "15",
        suffix: "orders",
      },
      {
        key: "pool-auto-expire",
        label: "Auto-expire enabled",
        type: "toggle",
        defaultValue: "true",
      },
    ],
  },
  {
    title: "Delivery Settings",
    description: "Pickup and delivery configuration",
    settings: [
      {
        key: "campus-pickup",
        label: "Campus pickup enabled",
        type: "toggle",
        defaultValue: "true",
      },
      {
        key: "default-delivery-fee",
        label: "Default delivery fee (kobo)",
        type: "number",
        defaultValue: "0",
        suffix: "kobo",
      },
    ],
  },
  {
    title: "Feature Flags",
    description: "Enable or disable app features",
    settings: [
      {
        key: "scratch-cards-enabled",
        label: "Scratch cards enabled",
        type: "toggle",
        defaultValue: "true",
      },
      {
        key: "gangs-enabled",
        label: "Gangs enabled",
        type: "toggle",
        defaultValue: "true",
      },
      {
        key: "rewards-enabled",
        label: "Rewards enabled",
        type: "toggle",
        defaultValue: "true",
      },
    ],
  },
];

/* ── Helpers ── */

const ALL_KEYS = SETTING_GROUPS.flatMap((g) => g.settings.map((s) => s.key));

function getDefault(key: string): string {
  for (const group of SETTING_GROUPS) {
    const s = group.settings.find((s) => s.key === key);
    if (s) return s.defaultValue;
  }
  return "";
}

/* ── Component ── */

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const results: Record<string, string> = {};
    try {
      const responses = await Promise.all(
        ALL_KEYS.map((key) =>
          fetch(`/api/admin/settings?key=${encodeURIComponent(key)}`)
            .then((r) => r.json())
            .then((data) => ({ key, value: data.data })),
        ),
      );
      for (const { key, value } of responses) {
        results[key] = value ?? getDefault(key);
      }
    } catch {
      // Fall back to defaults
      for (const key of ALL_KEYS) {
        results[key] = getDefault(key);
      }
    }
    setValues(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function updateLocal(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function saveSetting(key: string) {
    setSaving(key);
    setSaved(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: values[key] ?? getDefault(key) }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(`Failed to save ${key}`);
      } else {
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {
      setError(`Network error saving ${key}`);
    }
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[28px] font-bold text-[#1C1C1E] tracking-[-0.02em]"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Settings
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          App configuration and feature flags
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* Setting groups */}
      <div className="space-y-6">
        {SETTING_GROUPS.map((group) => (
          <section
            key={group.title}
            className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
          >
            {/* Group header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <h2
                className="text-base font-bold text-[#1C1C1E]"
                style={{
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                }}
              >
                {group.title}
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {group.description}
              </p>
            </div>

            {/* Settings list */}
            <div className="divide-y divide-[#F3F4F6]">
              {group.settings.map((setting) => {
                const val = values[setting.key] ?? setting.defaultValue;
                const isSaving = saving === setting.key;
                const isSaved = saved === setting.key;

                return (
                  <div
                    key={setting.key}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1C1C1E]">
                        {setting.label}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">
                        {setting.key}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {setting.type === "toggle" ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next = val === "true" ? "false" : "true";
                            updateLocal(setting.key, next);
                          }}
                          className={`
                            relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer
                            ${val === "true" ? "bg-[#16A34A]" : "bg-[#D1D5DB]"}
                          `}
                          aria-label={`Toggle ${setting.label}`}
                        >
                          <span
                            className={`
                              absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200
                              ${val === "true" ? "translate-x-5" : "translate-x-0"}
                            `}
                          />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type={setting.type}
                            value={val}
                            onChange={(e) =>
                              updateLocal(setting.key, e.target.value)
                            }
                            className="w-24 h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#1C1C1E] text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D] transition-colors"
                          />
                          {setting.suffix && (
                            <span className="text-[11px] text-[#9CA3AF]">
                              {setting.suffix}
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => saveSetting(setting.key)}
                        disabled={isSaving}
                        className={`
                          h-9 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer
                          ${
                            isSaved
                              ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]"
                              : "bg-[#1C1C1E] text-white hover:bg-[#333]"
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {isSaving
                          ? "Saving..."
                          : isSaved
                            ? "Saved"
                            : "Save"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
