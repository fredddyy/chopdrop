"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ── Types ── */
interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: string;
  createdAt: string;
  walletBalance: number;
  poolCount: number;
  orderCount: number;
}

interface PoolMembershipDetail {
  id: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  pool: {
    id: string;
    name: string | null;
    status: string;
    product: { name: string };
  };
}

interface CreditTx {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: string;
  createdAt: string;
  wallet: {
    id: string;
    balance: number;
    transactions: CreditTx[];
  } | null;
  poolMemberships: PoolMembershipDetail[];
  _count: { poolMemberships: number; orders: number };
}

function koboToNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG");
}

/* ── Page ── */
export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Wallet adjustment
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDesc, setWalletDesc] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: "20",
        });
        if (q) params.set("search", q);
        const res = await fetch(`/api/admin/users?${params}`);
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
          setTotal(json.meta.total);
        }
      } catch {
        /* network error */
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    load(page, search);
  }, [page, load, search]);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      load(1, val);
    }, 400);
  }

  async function toggleExpand(userId: string) {
    if (expandedId === userId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(userId);
    setLoadingDetail(true);
    setWalletAmount("");
    setWalletDesc("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (json.success) setDetail(json.data);
    } catch {
      setDetail(null);
    }
    setLoadingDetail(false);
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "USER" ? "CAPTAIN" : "USER";
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      // Refresh list and detail
      await load(page, search);
      if (expandedId === userId) {
        const res = await fetch(`/api/admin/users/${userId}`);
        const json = await res.json();
        if (json.success) setDetail(json.data);
      }
    } catch {
      /* error */
    }
  }

  async function adjustWallet() {
    if (!detail || !walletAmount) return;
    setAdjusting(true);
    try {
      const amountKobo = Math.round(Number(walletAmount) * 100);
      await fetch(`/api/admin/users/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAdjustment: amountKobo,
          description: walletDesc || undefined,
        }),
      });
      // Refresh detail
      const res = await fetch(`/api/admin/users/${detail.id}`);
      const json = await res.json();
      if (json.success) setDetail(json.data);
      // Refresh list
      await load(page, search);
      setWalletAmount("");
      setWalletDesc("");
    } catch {
      /* error */
    }
    setAdjusting(false);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1
          className="text-2xl font-bold text-[#1C1C1E]"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Users
        </h1>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-[38px] w-64 pl-9 pr-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] bg-white focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
            placeholder="Search by phone or name"
          />
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6B7280] text-sm">No users found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_140px_90px_80px_90px_100px] gap-3 px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide border-b border-[#E5E7EB]">
              <span>Name</span>
              <span>Phone</span>
              <span className="text-center">Role</span>
              <span className="text-right">Pools</span>
              <span className="text-right">Wallet</span>
              <span className="text-right">Joined</span>
            </div>

            {/* Rows */}
            {users.map((u) => {
              const isExpanded = expandedId === u.id;
              return (
                <div key={u.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(u.id)}
                    className={`w-full text-left grid grid-cols-1 md:grid-cols-[1fr_140px_90px_80px_90px_100px] gap-3 px-4 py-3 border-b border-[#E5E7EB] items-center hover:bg-[#F8F8F6] transition-colors ${
                      isExpanded ? "bg-[#F8F8F6]" : ""
                    }`}
                  >
                    {/* Name */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1C1C1E] truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-[#6B7280] md:hidden">
                        {u.phone}
                      </p>
                    </div>

                    {/* Phone */}
                    <p className="hidden md:block text-sm text-[#6B7280] tabular-nums">
                      {u.phone}
                    </p>

                    {/* Role */}
                    <div className="hidden md:flex justify-center">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === "CAPTAIN"
                            ? "bg-[rgba(232,76,61,0.1)] text-[#E84C3D]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>

                    {/* Pools */}
                    <p className="hidden md:block text-sm text-[#6B7280] text-right tabular-nums">
                      {u.poolCount}
                    </p>

                    {/* Wallet */}
                    <p className="hidden md:block text-sm font-semibold text-[#1A7D4B] text-right tabular-nums">
                      {"\u20A6"}{koboToNaira(u.walletBalance)}
                    </p>

                    {/* Joined */}
                    <p className="hidden md:block text-[12px] text-[#9CA3AF] text-right">
                      {new Date(u.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-b border-[#E5E7EB] bg-[#FAFAF9] px-5 py-4">
                      {loadingDetail ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-4 h-4 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : detail ? (
                        <div className="space-y-5">
                          {/* Role toggle */}
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-medium text-[#6B7280]">
                              Role:
                            </span>
                            <button
                              onClick={() => toggleRole(u.id, u.role)}
                              className={`h-7 px-3 rounded-lg text-[11px] font-bold transition-colors ${
                                u.role === "CAPTAIN"
                                  ? "bg-[#E84C3D] text-white"
                                  : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
                              }`}
                            >
                              {u.role === "CAPTAIN"
                                ? "Demote to USER"
                                : "Promote to CAPTAIN"}
                            </button>
                          </div>

                          {/* Wallet adjustment */}
                          <div>
                            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                              Wallet — {"\u20A6"}
                              {koboToNaira(detail.wallet?.balance ?? 0)}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="number"
                                value={walletAmount}
                                onChange={(e) =>
                                  setWalletAmount(e.target.value)
                                }
                                className="h-9 w-28 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                                placeholder="Naira (+/-)"
                              />
                              <input
                                value={walletDesc}
                                onChange={(e) =>
                                  setWalletDesc(e.target.value)
                                }
                                className="h-9 flex-1 min-w-[140px] px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                                placeholder="Reason (optional)"
                              />
                              <button
                                onClick={adjustWallet}
                                disabled={
                                  adjusting ||
                                  !walletAmount ||
                                  Number(walletAmount) === 0
                                }
                                className="h-9 px-4 rounded-lg bg-[#1C1C1E] text-white text-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333] transition-colors"
                              >
                                {adjusting ? "..." : "Adjust"}
                              </button>
                            </div>
                          </div>

                          {/* Credit transactions */}
                          {detail.wallet &&
                            detail.wallet.transactions.length > 0 && (
                              <div>
                                <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                                  Recent Transactions
                                </p>
                                <div className="space-y-1">
                                  {detail.wallet.transactions.map((tx) => (
                                    <div
                                      key={tx.id}
                                      className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-b-0"
                                    >
                                      <div className="min-w-0">
                                        <span className="text-[12px] text-[#1C1C1E]">
                                          {tx.description || tx.type}
                                        </span>
                                        <span className="text-[10px] text-[#9CA3AF] ml-2">
                                          {tx.type}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`text-[13px] font-bold tabular-nums ${
                                            tx.amount > 0
                                              ? "text-[#1A7D4B]"
                                              : "text-[#DC2626]"
                                          }`}
                                        >
                                          {tx.amount > 0 ? "+" : ""}
                                          {"\u20A6"}
                                          {koboToNaira(Math.abs(tx.amount))}
                                        </span>
                                        <span className="text-[10px] text-[#9CA3AF]">
                                          {new Date(
                                            tx.createdAt
                                          ).toLocaleDateString("en-NG", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Pool memberships */}
                          {detail.poolMemberships.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                                Pool History
                              </p>
                              <div className="space-y-1">
                                {detail.poolMemberships.map((pm) => (
                                  <div
                                    key={pm.id}
                                    className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-b-0"
                                  >
                                    <div className="min-w-0">
                                      <span className="text-[12px] font-medium text-[#1C1C1E]">
                                        {pm.pool.product.name}
                                      </span>
                                      <span className="text-[10px] text-[#9CA3AF] ml-2">
                                        x{pm.quantity}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                          pm.pool.status === "COMPLETED"
                                            ? "bg-[rgba(26,125,75,0.1)] text-[#1A7D4B]"
                                            : pm.pool.status === "OPEN"
                                            ? "bg-[rgba(232,76,61,0.1)] text-[#E84C3D]"
                                            : "bg-[#F3F4F6] text-[#9CA3AF]"
                                        }`}
                                      >
                                        {pm.pool.status}
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                          pm.paymentStatus === "SUCCESS"
                                            ? "bg-[rgba(26,125,75,0.1)] text-[#1A7D4B]"
                                            : pm.paymentStatus === "FAILED"
                                            ? "bg-[#FEF2F2] text-[#DC2626]"
                                            : "bg-[#F3F4F6] text-[#9CA3AF]"
                                        }`}
                                      >
                                        {pm.paymentStatus}
                                      </span>
                                      <span className="text-[10px] text-[#9CA3AF]">
                                        {new Date(
                                          pm.createdAt
                                        ).toLocaleDateString("en-NG", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[12px] text-[#9CA3AF] py-2">
                          Failed to load user details
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[12px] text-[#9CA3AF]">
                {total} users total
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-8 px-3 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="text-[12px] text-[#6B7280] px-2 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-8 px-3 rounded-lg border border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
