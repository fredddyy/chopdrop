/** Reusable skeleton loading components — warm cream pulse, not gray */

export function SkeletonLine({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div className="rounded-[8px] animate-pulse" style={{ width, height, background: "var(--sand)" }} />
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return (
    <div className="rounded-full animate-pulse shrink-0" style={{ width: size, height: size, background: "var(--sand)" }} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="animate-pulse" style={{ height: 160, background: "var(--sand)" }} />
      <div className="p-4 space-y-3">
        <SkeletonLine width="70%" height={16} />
        <SkeletonLine width="40%" height={12} />
        <SkeletonLine width="30%" height={20} />
      </div>
    </div>
  );
}

export function SkeletonDealCard({ dark = false }: { dark?: boolean }) {
  return (
    <div className="rounded-[16px] overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.05)" : "var(--card)", border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid var(--border)" }}>
      <div className="animate-pulse" style={{ height: 180, background: dark ? "rgba(255,255,255,0.03)" : "var(--sand)" }} />
      <div className="p-4 space-y-3">
        <div className="rounded-[8px] animate-pulse" style={{ width: "65%", height: 16, background: dark ? "rgba(255,255,255,0.06)" : "var(--sand)" }} />
        <div className="rounded-[8px] animate-pulse" style={{ width: "40%", height: 12, background: dark ? "rgba(255,255,255,0.04)" : "var(--sand)" }} />
        <div className="rounded-[8px] animate-pulse" style={{ width: "35%", height: 22, background: dark ? "rgba(255,255,255,0.06)" : "var(--sand)" }} />
        <div className="rounded-full animate-pulse" style={{ width: "100%", height: 4, background: dark ? "rgba(255,255,255,0.04)" : "var(--sand)" }} />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <SkeletonCircle size={48} />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="60%" height={14} />
        <SkeletonLine width="30%" height={12} />
      </div>
      <SkeletonLine width={60} height={28} />
    </div>
  );
}
