"use client";

export default function GangsManagementPage() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[28px] font-bold text-[#1C1C1E] tracking-[-0.02em]"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Gangs
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Manage gangs, members, and group activity
        </p>
      </div>

      {/* Coming soon state */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
        <div className="text-center py-12">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F3F4F6] mb-5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>

          <h2
            className="text-xl font-bold text-[#1C1C1E] mb-2"
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            }}
          >
            Gang Management
          </h2>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
            View all gangs, members, and activity. The gangs backend is built
            &mdash; admin API endpoints are coming next.
          </p>

          {/* Planned sections preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-lg mx-auto">
            {[
              { label: "All Gangs", desc: "Browse & search" },
              { label: "Members", desc: "Per-gang roster" },
              { label: "Activity", desc: "Orders & savings" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-[#F8F8F6] border border-[#E5E7EB] p-4"
              >
                <p className="text-sm font-semibold text-[#1C1C1E]">
                  {item.label}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
