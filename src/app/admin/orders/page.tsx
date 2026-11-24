"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingCart } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface OrderUser {
  firstName: string;
  phone: string;
}

interface OrderVendor {
  name: string;
}

interface OrderProduct {
  name: string;
  vendor: OrderVendor;
}

interface OrderData {
  id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  serviceFee: number;
  deliveryFee: number;
  paymentStatus: string;
  createdAt: string;
  user: OrderUser;
  product: OrderProduct;
}

// ── Constants ──────────────────────────────────────────────────────────

type StatusKey = "PENDING" | "CONFIRMED" | "READY" | "COMPLETED";

const STATUS_TABS: { label: string; value: StatusKey | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
];

const DATE_FILTERS: { label: string; value: "today" | "week" | "all" }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "All Time", value: "all" },
];

const STATUS_BADGE_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  PENDING: { bg: "#FEF2F0", color: "#E84C3D", border: "#FDDDD8" },
  CONFIRMED: { bg: "#FEF9C3", color: "#B45309", border: "#FEF08A" },
  READY: { bg: "#DBEAFE", color: "#1D4ED8", border: "#BFDBFE" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "READY",
  READY: "COMPLETED",
};

// ── Helpers ────────────────────────────────────────────────────────────

function formatNaira(kobo: number): string {
  return `\u20A6${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

// ── Skeleton ───────────────────────────────────────────────────────────

function SkeletonCard() {
  const shimmer: React.CSSProperties = {
    background: "linear-gradient(90deg, #F0EBE4 25%, #E8E2DA 50%, #F0EBE4 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: 6,
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ ...shimmer, width: 90, height: 16 }} />
        <div style={{ ...shimmer, width: 70, height: 22 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ ...shimmer, width: "60%", height: 14 }} />
        <div style={{ ...shimmer, width: "40%", height: 12 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...shimmer, width: 80, height: 20 }} />
        <div style={{ ...shimmer, width: 100, height: 32 }} />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusKey | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">("today");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Build date param
      const now = new Date();
      if (dateFilter === "today") {
        params.set("date", now.toISOString().split("T")[0]);
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.set("from", weekAgo.toISOString().split("T")[0]);
        params.set("to", now.toISOString().split("T")[0]);
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadOrders();
    } finally {
      setUpdatingId(null);
    }
  }

  // Filter orders client-side for tab switching (API may already filter, but this is instant)
  const filtered =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  // Count per status for tab badges
  const counts: Record<string, number> = { ALL: orders.length };
  for (const o of orders) {
    counts[o.status] = (counts[o.status] || 0) + 1;
  }

  return (
    <>
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* ── Header ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#FEF2F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCart size={20} color="#E84C3D" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#1A1A1A",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Orders
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#6B7280",
                margin: 0,
                marginTop: 2,
              }}
            >
              Manage and track all customer orders
            </p>
          </div>
        </div>

        {/* ── Date Filter Row ───────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {DATE_FILTERS.map((df) => (
            <button
              key={df.value}
              onClick={() => setDateFilter(df.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                border: "1px solid",
                borderColor:
                  dateFilter === df.value ? "#E84C3D" : "#E5E7EB",
                background:
                  dateFilter === df.value ? "#FEF2F0" : "#FFFFFF",
                color: dateFilter === df.value ? "#E84C3D" : "#6B7280",
                cursor: "pointer",
                transition: "all 150ms ease-out",
              }}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* ── Status Tabs ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = counts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  border: "none",
                  background: isActive ? "#1A1A1A" : "transparent",
                  color: isActive ? "#FFFFFF" : "#6B7280",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  transition: "all 150ms ease-out",
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: 10,
                      background: isActive
                        ? "rgba(255,255,255,0.2)"
                        : "#F3F4F6",
                      color: isActive ? "#FFFFFF" : "#9CA3AF",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 20px",
              color: "#9CA3AF",
            }}
          >
            <ShoppingCart
              size={40}
              color="#D1D5DB"
              style={{ margin: "0 auto 12px" }}
            />
            <p
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#6B7280",
                margin: "0 0 4px",
              }}
            >
              No orders found
            </p>
            <p style={{ fontSize: 13, margin: 0 }}>
              {statusFilter !== "ALL"
                ? `No ${statusFilter.toLowerCase()} orders for this period`
                : "No orders match the selected filters"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((order) => {
              const badge = STATUS_BADGE_STYLES[order.status] ?? {
                bg: "#F3F4F6",
                color: "#6B7280",
                border: "#E5E7EB",
              };
              const nextStatus = NEXT_STATUS[order.status];
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: 14,
                    padding: 16,
                    transition: "border-color 150ms ease-out",
                  }}
                >
                  {/* Top row: order code + status badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#E84C3D",
                        letterSpacing: 0.5,
                      }}
                    >
                      {order.orderCode}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        textTransform: "uppercase",
                        letterSpacing: 0.3,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Customer + product info */}
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1A1A1A",
                        marginBottom: 2,
                      }}
                    >
                      {order.user.firstName}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9CA3AF",
                        marginBottom: 6,
                      }}
                    >
                      {order.user.phone}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {order.product.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#D1D5DB" }}>
                        /
                      </span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>
                        {order.product.vendor.name}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: amount, date, action */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #F3F4F6",
                      paddingTop: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#1A1A1A",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatNaira(order.totalAmount)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#9CA3AF",
                        }}
                      >
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>

                    {nextStatus ? (
                      <button
                        onClick={() => updateStatus(order.id, nextStatus)}
                        disabled={isUpdating}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          border: "none",
                          background: isUpdating ? "#F3F4F6" : "#E84C3D",
                          color: isUpdating ? "#9CA3AF" : "#FFFFFF",
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          transition: "all 150ms ease-out",
                          opacity: isUpdating ? 0.7 : 1,
                        }}
                      >
                        {isUpdating
                          ? "Updating..."
                          : `Mark ${nextStatus.charAt(0)}${nextStatus.slice(1).toLowerCase()}`}
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#15803D",
                          fontWeight: 600,
                        }}
                      >
                        Done
                      </span>
                    )}
                  </div>

                  {/* Fee breakdown (subtle) */}
                  {(order.serviceFee > 0 || order.deliveryFee > 0) && (
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        marginTop: 8,
                        paddingTop: 6,
                      }}
                    >
                      {order.serviceFee > 0 && (
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                          Service: {formatNaira(order.serviceFee)}
                        </span>
                      )}
                      {order.deliveryFee > 0 && (
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                          Delivery: {formatNaira(order.deliveryFee)}
                        </span>
                      )}
                      {order.paymentStatus && (
                        <span
                          style={{
                            fontSize: 11,
                            color:
                              order.paymentStatus === "PAID"
                                ? "#15803D"
                                : "#B45309",
                            fontWeight: 500,
                          }}
                        >
                          {order.paymentStatus}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
