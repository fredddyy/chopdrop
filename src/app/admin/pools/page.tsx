"use client";

import { useState, useEffect } from "react";
import { Users2 } from "lucide-react";

function fp(kobo: number): string { return "\u20A6" + Math.round(kobo / 100).toLocaleString(); }

interface Pool {
  id: string; status: string; minSize: number; deadline: string; createdAt: string;
  product: { name: string; imageUrl: string | null; retailPrice: number; groupPrice: number; vendor: { name: string } };
  creator: { firstName: string; phone: string };
  _count: { members: number };
}

export default function AdminPoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "expired">("active");

  useEffect(() => {
    fetch("/api/admin/pools").then(r => r.json()).then(d => { if (d.success) setPools(d.data || []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const active = pools.filter(p => (p.status === "OPEN" || p.status === "FILLED") && new Date(p.deadline).getTime() > now);
  const expired = pools.filter(p => p.status === "EXPIRED" || p.status === "CANCELLED" || p.status === "COMPLETED" || (p.status === "OPEN" && new Date(p.deadline).getTime() <= now));
  const display = tab === "active" ? active : expired;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users2 size={20} style={{ color: "#E84C3D" }} />
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Pools & Groups</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["active", "expired"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="h-[34px] px-4 rounded-[10px] text-[12px] font-bold"
            style={{ background: tab === t ? "#E84C3D" : "#F8F8F6", color: tab === t ? "white" : "#6B7280", border: tab === t ? "none" : "1px solid #E5E7EB" }}>
            {t === "active" ? `Active (${active.length})` : `History (${expired.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-[14px] p-4" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
              <div className="h-5 rounded w-[50%] mb-2" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div className="h-4 rounded w-[70%]" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[14px] font-bold" style={{ color: "#1C1C1E" }}>No {tab} pools</p>
          <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>{tab === "active" ? "Active pools will appear here when users start group orders." : "Completed and expired pools show here."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {display.map(pool => {
            const members = pool._count?.members || 0;
            const fillPct = Math.round((members / pool.minSize) * 100);
            const minsLeft = Math.max(0, Math.round((new Date(pool.deadline).getTime() - now) / 60000));
            const statusColor = pool.status === "OPEN" ? "#3498DB" : pool.status === "FILLED" ? "#22C55E" : pool.status === "EXPIRED" ? "#E84C3D" : "#9CA3AF";
            return (
              <div key={pool.id} className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: "#1C1C1E" }}>{pool.product.name}</p>
                    <p className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>{pool.product.vendor.name} · by {pool.creator.firstName}</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>
                    {pool.status}
                  </span>
                </div>
                {/* Fill progress */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "#F8F8F6" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(fillPct, 3)}%`, background: fillPct >= 100 ? "#22C55E" : "#E84C3D" }} />
                  </div>
                  <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: "#1C1C1E" }}>{members}/{pool.minSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>
                    {pool.status === "OPEN" && minsLeft > 0 ? `${minsLeft}m left` : new Date(pool.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{fp(pool.product.groupPrice)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
