"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ── */
interface PoolData {
  id: string;
  name: string | null;
  areaName: string | null;
  status: string;
  minSize: number;
  deadline: string;
  createdAt: string;
  product: { name: string; groupPrice: number };
  creatorName: string;
  memberCount: number;
  spotsLeft: number;
}

interface PoolMember {
  id: string;
  quantity: number;
  paymentStatus: string;
  createdAt: string;
  user: { firstName: string; lastName: string; phone: string };
}

type FilterStatus = "ALL" | "OPEN" | "FILLED" | "EXPIRED" | "COMPLETED" | "CANCELLED";

const FILTERS: FilterStatus[] = ["ALL", "OPEN", "FILLED", "EXPIRED", "COMPLETED", "CANCELLED"];

function koboToNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG");
}

function timeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "OPEN":
      return { bg: "rgba(232,76,61,0.1)", text: "#E84C3D" };
    case "FILLED":
    case "COMPLETED":
      return { bg: "rgba(26,125,75,0.1)", text: "#1A7D4B" };
    case "EXPIRED":
    case "CANCELLED":
      return { bg: "#F3F4F6", text: "#9CA3AF" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280" };
  }
}

function fillPercent(members: number, min: number): number {
  if (min <= 0) return 100;
  return Math.min(100, Math.round((members / min) * 100));
}

/* ── Page ── */
export default function PoolsPage() {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, PoolMember[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pools");
      const json = await res.json();
      if (json.success) setPools(json.data);
    } catch {
      /* network error */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function toggleExpand(poolId: string) {
    if (expandedId === poolId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(poolId);

    // Fetch members if not cached
    if (!members[poolId]) {
      setLoadingMembers(poolId);
      try {
        const res = await fetch(`/api/admin/pools/${poolId}/members`);
        const json = await res.json();
        if (json.success) {
          setMembers((prev) => ({ ...prev, [poolId]: json.data }));
        }
      } catch {
        // If endpoint doesn't exist, try pool detail
        // Fallback: show empty
        setMembers((prev) => ({ ...prev, [poolId]: [] }));
      }
      setLoadingMembers(null);
    }
  }

  const filtered =
    filter === "ALL" ? pools : pools.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-[#1C1C1E]"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
          >
            Pools
          </h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1A7D4B] animate-pulse" />
            <span className="text-[11px] text-[#9CA3AF] font-medium">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count =
            f === "ALL"
              ? pools.length
              : pools.filter((p) => p.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-3.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors border ${
                filter === f
                  ? "bg-[#1C1C1E] text-white border-[#1C1C1E]"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}{" "}
              <span className="tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Pool cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6B7280] text-sm">No pools found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pool) => {
            const pct = fillPercent(pool.memberCount, pool.minSize);
            const sc = statusColor(pool.status);
            const isExpanded = expandedId === pool.id;

            return (
              <div
                key={pool.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
              >
                {/* Card body — clickable */}
                <button
                  type="button"
                  onClick={() => toggleExpand(pool.id)}
                  className="w-full text-left px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-[#1C1C1E] truncate">
                        {pool.product.name}
                      </p>
                      <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">
                        {pool.name || pool.areaName || "Unnamed pool"} · by{" "}
                        {pool.creatorName}
                      </p>
                    </div>

                    <span
                      className="shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {pool.status}
                    </span>
                  </div>

                  {/* Fill bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold text-[#1C1C1E] tabular-nums">
                        {pool.memberCount}/{pool.minSize} members
                      </span>
                      <span className="text-[12px] text-[#6B7280] tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 100
                              ? "#1A7D4B"
                              : pct >= 50
                              ? "#D4A24E"
                              : "#E84C3D",
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom meta */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[11px] text-[#9CA3AF]">
                      {"\u20A6"}{koboToNaira(pool.product.groupPrice)} / item
                    </span>
                    {pool.status === "OPEN" && (
                      <span className="text-[11px] font-semibold text-[#E84C3D]">
                        {timeRemaining(pool.deadline)}
                      </span>
                    )}
                    <span className="text-[11px] text-[#9CA3AF]">
                      Created{" "}
                      {new Date(pool.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </button>

                {/* Expanded: member list */}
                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] px-5 py-3">
                    <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                      Members
                    </p>
                    {loadingMembers === pool.id ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-4 h-4 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (members[pool.id] || []).length === 0 ? (
                      <p className="text-[12px] text-[#9CA3AF] py-2">
                        No member data available
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {(members[pool.id] || []).map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-b-0"
                          >
                            <div className="min-w-0">
                              <span className="text-[13px] font-medium text-[#1C1C1E]">
                                {m.user.firstName} {m.user.lastName}
                              </span>
                              <span className="text-[11px] text-[#9CA3AF] ml-2">
                                {m.user.phone}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-[#6B7280]">
                                x{m.quantity}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  m.paymentStatus === "SUCCESS"
                                    ? "bg-[rgba(26,125,75,0.1)] text-[#1A7D4B]"
                                    : m.paymentStatus === "FAILED"
                                    ? "bg-[#FEF2F2] text-[#DC2626]"
                                    : "bg-[#F3F4F6] text-[#9CA3AF]"
                                }`}
                              >
                                {m.paymentStatus}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF]">
                                {new Date(m.createdAt).toLocaleDateString(
                                  "en-NG",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
