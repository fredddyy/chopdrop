export default function MenuLoading() {
  return (
    <main className="flex-1 max-w-[480px] lg:max-w-[1120px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
      {/* Header skeleton */}
      <div className="px-5 py-3" style={{ background: "var(--dark)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[120px] h-4 rounded-[6px]" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>
          <div className="w-9 h-9 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
        {/* Search bar skeleton */}
        <div className="mt-3 w-full h-11 rounded-[12px]" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      <div className="px-5 pt-6 space-y-5">
        {/* Section title */}
        <div className="w-[100px] h-4 rounded-[6px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />

        {/* Food card grid skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="h-[130px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 150}ms` }} />
              <div className="p-3 space-y-2">
                <div className="h-3.5 rounded-[4px] w-[80%]" style={{ background: "var(--sand)" }} />
                <div className="h-3 rounded-[4px] w-[50%]" style={{ background: "var(--sand)" }} />
                <div className="h-5 rounded-[4px] w-[60%]" style={{ background: "var(--sand)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Second section */}
        <div className="w-[140px] h-4 rounded-[6px] mt-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="h-[130px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${(i + 4) * 150}ms` }} />
              <div className="p-3 space-y-2">
                <div className="h-3.5 rounded-[4px] w-[75%]" style={{ background: "var(--sand)" }} />
                <div className="h-5 rounded-[4px] w-[55%]" style={{ background: "var(--sand)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
