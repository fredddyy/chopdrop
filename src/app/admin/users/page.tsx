"use client";

import { useState, useEffect } from "react";
import { UserCircle, Search } from "lucide-react";

interface UserItem {
  id: string; firstName: string; lastName: string; phone: string; email: string | null;
  createdAt: string; _count?: { poolMemberships: number; orders: number };
  wallet?: { balance: number };
}

function fp(kobo: number): string { return "\u20A6" + Math.round(kobo / 100).toLocaleString(); }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => { if (d.success) setUsers(d.data || []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function doSearch() {
    if (!search.trim()) return;
    setLoading(true);
    fetch(`/api/admin/users?search=${encodeURIComponent(search.trim())}`).then(r => r.json()).then(d => { if (d.success) setUsers(d.data || []); }).catch(() => {}).finally(() => setLoading(false));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <UserCircle size={20} style={{ color: "#E84C3D" }} />
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Users</h1>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center h-[40px] px-3 rounded-[10px] gap-2" style={{ background: "#F8F8F6", border: "1px solid #E5E7EB" }}>
          <Search size={16} style={{ color: "#9CA3AF" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search by phone or name..."
            className="flex-1 bg-transparent text-[13px] font-medium outline-none" style={{ color: "#1C1C1E" }} />
        </div>
        <button onClick={doSearch} className="h-[40px] px-4 rounded-[10px] text-[12px] font-bold text-white" style={{ background: "#E84C3D" }}>Search</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-[14px] p-4 flex items-center gap-3" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
              <div className="w-[40px] h-[40px] rounded-full" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded w-[40%]" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div className="h-3 rounded w-[25%]" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite" }} />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[14px] font-bold" style={{ color: "#1C1C1E" }}>No users found</p>
          <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="rounded-[14px] p-4 flex items-center gap-3" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold text-white" style={{ background: "#E84C3D" }}>
                {(u.firstName || "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "#1C1C1E" }}>{u.firstName} {u.lastName}</p>
                <p className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>{u.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-bold" style={{ color: "#1C1C1E" }}>{u._count?.orders || 0} orders</p>
                <p className="text-[10px] font-medium" style={{ color: "#9CA3AF" }}>{u._count?.poolMemberships || 0} pools</p>
                {u.wallet && u.wallet.balance > 0 && (
                  <p className="text-[10px] font-bold" style={{ color: "#22C55E" }}>{fp(u.wallet.balance)} credit</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
