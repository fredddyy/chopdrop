"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

const FACE_COLORS = ["#C4572A", "#1A7D4B", "#D4A24E", "#1C1C1E", "#6366F1"];

type Tab = "orders" | "members" | "activity";

interface GroupOrder {
  id: string;
  restaurantName: string;
  status: string;
  deadline: string;
  memberCount: number;
  paidMemberCount?: number;
  currentDiscount?: number;
  deliveryAddress: string;
  deliveryFee: number;
  inviteCode: string;
}

interface GangData {
  id: string;
  name: string;
  emoji: string;
  motto: string | null;
  campus: string | null;
  deliveryAddress: string | null;
  inviteCode: string;
  members: Array<{ id: string; userId: string; role: string; joinedAt: string; firstName: string; user?: { firstName: string } }>;
}

export default function GangDetailPage() {
  const { gangId } = useParams<{ gangId: string }>();
  const router = useRouter();
  const [gang, setGang] = useState<GangData | null>(null);
  const [groupOrders, setGroupOrders] = useState<GroupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.success) setCurrentUserId(d.data.id); }).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch(`/api/gangs/${gangId}`).then((r) => r.json()),
      fetch(`/api/group-orders?gangId=${gangId}`).then((r) => r.ok ? r.json() : { success: false }),
    ]).then(([gangData, ordersData]) => {
      if (gangData.success) setGang(gangData.data);
      else setError(true);
      if (ordersData.success) setGroupOrders(ordersData.data || []);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [gangId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // null = still loading auth, true = member, false = not member or not logged in
  const isMember = gang ? (currentUserId ? gang.members.some(m => m.userId === currentUserId) : false) : null;
  const isLoggedIn = currentUserId !== null;

  async function handleJoinGang() {
    setJoining(true);
    try {
      const res = await fetch(`/api/gangs/${gangId}/join`, { method: "POST" });
      const d = await res.json();
      if (d.success) {
        fetchData(); // Refresh to show updated member list
      } else if (d.error === "Not authenticated") {
        router.push(`/auth?returnTo=/pools/${gangId}`);
      }
    } catch {}
    setJoining(false);
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4 flex items-center justify-between">
          <div className="w-11 h-11 rounded-full" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="space-y-1 text-center">
            <div className="h-3 w-[80px] mx-auto rounded-[8px]" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "50ms" }} />
            <div className="h-4 w-[100px] mx-auto rounded-[8px]" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
          </div>
          <div className="w-11" />
        </div>
        <div className="px-5 mt-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full shrink-0" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "150ms" }} />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-[55%] rounded-[8px]" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "200ms" }} />
            <div className="h-4 w-[40%] rounded-[8px]" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "250ms" }} />
          </div>
        </div>
        <div className="px-5 mt-5 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-[44px] rounded-full" style={{ background: "var(--sand)", opacity: 0.5, animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${300 + i * 50}ms` }} />
          ))}
        </div>
        <div className="px-5 mt-4">
          <div className="h-[80px] rounded-[16px]" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "500ms" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error || !gang) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4">
          <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        </div>
        <div className="py-16 text-center px-8">
          <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text)" }}>{error ? "Couldn\u2019t load gang" : "Gang not found"}</h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>{error ? "Check your connection and try again." : "This gang may not exist yet or the link is invalid."}</p>
          {error ? (
            <button type="button" onClick={fetchData} className="h-[44px] px-5 rounded-full text-[13px] font-bold text-white mt-4 press-feedback" style={{ background: "var(--coral)" }}>Try again</button>
          ) : (
            <button type="button" onClick={() => router.push("/pools")} className="h-[44px] px-5 rounded-full text-[13px] font-bold text-white mt-4 press-feedback" style={{ background: "var(--coral)" }}>Back to Gangs</button>
          )}
        </div>
        <BottomNav />
      </main>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/pools/${gang.id}` : "";
  const activeOrders = groupOrders.filter((o) => o.status === "OPEN" || o.status === "CLOSED" || o.status === "ORDERED");
  const pastOrders = groupOrders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED");
  const faceColor = FACE_COLORS[gang.name.charCodeAt(0) % FACE_COLORS.length];
  const initial = gang.emoji?.length === 1 && /[A-Za-z]/.test(gang.emoji)
    ? gang.emoji.toUpperCase()
    : gang.name.charAt(0).toUpperCase();

  // ── Not a member — show join screen ──
  if (isMember === false) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4">
          <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        </div>

        {/* Gang intro card */}
        <div className="px-5 mt-6">
          <div className="rounded-[16px] p-6 text-center" style={{ background: "var(--dark)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[28px] font-extrabold text-white mx-auto mb-4" style={{ background: faceColor }}>
              {initial}
            </div>
            <h1 className="text-[24px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{gang.name}</h1>
            {gang.motto && <p className="text-[13px] mt-1" style={{ color: "var(--subdued)" }}>&ldquo;{gang.motto}&rdquo;</p>}
            <p className="text-[13px] mt-2" style={{ color: "var(--subdued)" }}>
              {gang.members.length} member{gang.members.length !== 1 ? "s" : ""}{gang.campus ? ` · ${gang.campus}` : ""}
            </p>

            {/* Member avatars */}
            <div className="flex items-center justify-center gap-1 mt-4">
              <div className="flex -space-x-2">
                {gang.members.slice(0, 5).map((m, i) => (
                  <div key={m.id} className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: FACE_COLORS[i % FACE_COLORS.length], border: "2px solid var(--dark)" }}>
                    {(m.firstName || m.user?.firstName || "?").charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why join */}
        <div className="px-5 mt-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald-soft)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Order together</p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Pick a restaurant, everyone adds their items, split delivery.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald-soft)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Save more together</p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>3+ people ordering = group discounts on every meal.</p>
            </div>
          </div>
        </div>

        {/* Join CTA */}
        <div className="px-5 mt-6">
          {isLoggedIn ? (
            <button type="button" onClick={handleJoinGang} disabled={joining}
              className="w-full h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white press-feedback disabled:opacity-50"
              style={{ background: "var(--coral)" }}>
              {joining ? "Joining\u2026" : `Join ${gang.name}`}
            </button>
          ) : (
            <a href={`/auth?returnTo=/pools/${gangId}`}
              className="w-full h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white press-feedback"
              style={{ background: "var(--coral)" }}>
              Sign up to join
            </a>
          )}
          <p className="text-[11px] text-center mt-3" style={{ color: "var(--text-muted)" }}>Free to join. {isLoggedIn ? "You can leave anytime." : "Takes 30 seconds."}</p>
        </div>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs · {gang.name}</p>
          <p className="text-[14px] font-extrabold" style={{ color: "var(--text)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{gang.members.length} member{gang.members.length !== 1 ? "s" : ""}{activeOrders.length > 0 ? ` · ${activeOrders.length} ordering` : ""}</p>
        </div>
        <div className="w-11" />
      </div>

      {/* ── Gang profile ── */}
      <div className="px-5 mt-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[22px] font-extrabold text-white shrink-0" style={{ background: faceColor }}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-extrabold truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{gang.name}</h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {gang.members.length} member{gang.members.length !== 1 ? "s" : ""}{gang.campus ? ` · ${gang.campus}` : ""}
          </p>
        </div>
      </div>

      {gang.motto && (
        <p className="px-5 mt-2 text-[13px] leading-[145%]" style={{ color: "var(--text-muted)" }}>&ldquo;{gang.motto}&rdquo;</p>
      )}

      {/* ── Share buttons — tappable ── */}
      <div className="px-5 mt-3 flex gap-2">
        <button
          type="button"
          className="h-[36px] px-4 rounded-full text-[12px] font-bold press-feedback"
          style={{ background: "var(--dark)", color: "white" }}
          onClick={() => {
            if (navigator.share) navigator.share({ title: `Join ${gang.name} on ChopDrop`, text: "Join our food gang!", url: shareUrl }).catch(() => {});
            else { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
          }}
        >
          {copied ? "Copied!" : "Share invite link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Join ${gang.name} on ChopDrop! ${shareUrl}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="h-[36px] px-4 rounded-full text-[12px] font-bold inline-flex items-center press-feedback"
          style={{ background: "var(--sand)", color: "var(--text)" }}
        >
          WhatsApp invite
        </a>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 mt-5 flex">
        {(["orders", "members", "activity"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="flex-1 h-[44px] text-[13px] font-bold press-feedback rounded-full"
            style={{
              background: tab === t ? "var(--dark)" : "transparent",
              color: tab === t ? "white" : "var(--text-muted)",
              transition: "background 150ms ease-out, color 150ms ease-out",
            }}>
            {t === "orders" ? `Orders${activeOrders.length > 0 ? ` · ${activeOrders.length}` : ""}` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ═══ ORDERS TAB ═══ */}
      {tab === "orders" && (
        <div className="px-5 mt-4">
          {/* Start group order CTA */}
          <Link href={`/group/create?gang=${gangId}`}
            className="flex items-center gap-3 p-4 rounded-[16px] press-feedback mb-4" style={{ background: "var(--dark)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white">Order together</p>
              <p className="text-[11px]" style={{ color: "var(--subdued)" }}>Pick a restaurant, everyone adds their items</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
          </Link>

          {/* Active orders */}
          {activeOrders.length > 0 && (
            <div className="flex flex-col gap-3 mb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)" }}>Active orders</p>
              {activeOrders.map((order) => {
                const minsLeft = Math.max(0, Math.round((new Date(order.deadline).getTime() - Date.now()) / 60000));
                const deadlinePassed = new Date(order.deadline).getTime() < Date.now();
                const isAccepting = order.status === "OPEN" && !deadlinePassed;
                const isClosed = deadlinePassed || order.status !== "OPEN";
                const statusLabel = isAccepting ? "Ordering now" : deadlinePassed ? "Deadline passed" : order.status;
                const statusColor = isAccepting ? "var(--emerald)" : "var(--text-muted)";
                const statusBg = isAccepting ? "var(--emerald-soft)" : "var(--sand)";
                return (
                  <Link key={order.id} href={`/group/${order.inviteCode}`} className="p-4 rounded-[16px] press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: statusBg, color: statusColor }}>
                        {statusLabel}
                      </span>
                      {isAccepting && <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>{minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft}m left`}</span>}
                      {isClosed && order.paidMemberCount != null && order.currentDiscount != null && order.currentDiscount > 0 && (
                        <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>{order.currentDiscount}% off · {order.paidMemberCount} paid</span>
                      )}
                    </div>
                    <h4 className="text-[16px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{order.restaurantName}</h4>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{order.memberCount} people · {order.deliveryAddress}</p>
                    {order.deliveryFee > 0 && isAccepting && (
                      <p className="text-[11px] font-bold mt-1.5" style={{ color: "var(--emerald)" }}>Delivery {fp(order.deliveryFee)} split {order.memberCount} ways = {fp(Math.round(order.deliveryFee / Math.max(1, order.memberCount)))} each</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Past orders */}
          {pastOrders.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mt-2" style={{ color: "var(--text-muted)" }}>History</p>
              {pastOrders.slice(0, 5).map((order) => (
                <Link key={order.id} href={`/group/${order.inviteCode}`} className="flex items-center justify-between py-3 press-feedback" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{order.restaurantName}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{order.memberCount} people</p>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: order.status === "DELIVERED" ? "var(--emerald)" : "var(--text-muted)" }}>
                    {order.status === "DELIVERED" ? "Delivered" : "Cancelled"}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Empty */}
          {groupOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No orders yet. Start one above — your gang will be notified.</p>
              <Link href="/discover" className="mt-3 text-[13px] font-bold inline-block" style={{ color: "var(--coral)" }}>Or browse deals →</Link>
            </div>
          )}
        </div>
      )}

      {/* ═══ MEMBERS TAB ═══ */}
      {tab === "members" && (
        <div className="px-5 mt-4">
          <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {gang.members.map((member, i) => (
              <div key={member.id}>
                {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: FACE_COLORS[i % FACE_COLORS.length] }}>
                    {(member.firstName || member.user?.firstName || "?").charAt(0)}
                  </div>
                  <span className="text-[14px] font-medium flex-1" style={{ color: "var(--text)" }}>
                    {(member.firstName || member.user?.firstName || "?")}
                  </span>
                  {member.role === "ADMIN" && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide shrink-0" style={{ color: "var(--coral)" }}>Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 text-[13px] font-bold press-feedback flex items-center gap-1.5"
            style={{ color: "var(--coral)" }}
            onClick={() => { if (navigator.share) navigator.share({ title: `Join ${gang.name} on ChopDrop`, text: "Join our food gang!", url: shareUrl }).catch(() => {}); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6" /></svg>
            Invite people
          </button>

          {/* Leave gang */}
          <button
            type="button"
            className="mt-6 text-[12px] font-bold press-feedback"
            style={{ color: "var(--text-muted)" }}
            onClick={async () => {
              if (!confirm(`Leave ${gang.name}? You can rejoin anytime.`)) return;
              try {
                const res = await fetch(`/api/gangs/${gangId}/leave`, { method: "POST" });
                const d = await res.json();
                if (d.success) {
                  router.push("/pools");
                } else {
                  alert(d.error || "Couldn\u2019t leave gang");
                }
              } catch {
                alert("Network error");
              }
            }}
          >
            Leave gang
          </button>
        </div>
      )}

      {/* ═══ ACTIVITY TAB ═══ */}
      {tab === "activity" && (
        <div className="px-5 mt-4">
          {/* Stats bar */}
          <div className="flex gap-2 mb-5">
            <div className="flex-1 p-3 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[20px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{gang.members.length}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Members</p>
            </div>
            <div className="flex-1 p-3 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[20px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{groupOrders.length}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Orders</p>
            </div>
            <div className="flex-1 p-3 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[20px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>{activeOrders.length}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Active</p>
            </div>
          </div>

          {/* Timeline */}
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--coral)" }}>Timeline</p>
          <div className="flex flex-col gap-4">
            {/* Merge orders + members into a timeline */}
            {[
              ...gang.members.map((m) => ({
                type: "join" as const,
                name: m.firstName || m.user?.firstName || "?",
                role: m.role,
                date: new Date(m.joinedAt),
                id: m.id,
              })),
              ...groupOrders.map((o) => ({
                type: "order" as const,
                name: o.restaurantName,
                status: o.status,
                memberCount: o.memberCount,
                date: new Date(o.deadline),
                id: o.id,
              })),
            ]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 10)
              .map((event, i) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: event.type === "order" ? "var(--coral-soft)" : "var(--sand)" }}>
                    {event.type === "order" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><path d="M6 1v3M10 1v3M14 1v3" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {event.type === "order" ? (
                      <p className="text-[13px] leading-[145%]" style={{ color: "var(--text)" }}>
                        <span className="font-bold">{event.name}</span> · {(event as { memberCount: number }).memberCount} people · <span style={{ color: (event as { status: string }).status === "DELIVERED" ? "var(--emerald)" : "var(--text-muted)" }}>{(event as { status: string }).status === "DELIVERED" ? "Delivered" : (event as { status: string }).status}</span>
                      </p>
                    ) : (
                      <p className="text-[13px] leading-[145%]" style={{ color: "var(--text)" }}>
                        <span className="font-bold">{event.name}</span> {(event as { role: string }).role === "ADMIN" ? "created the gang" : "joined"}
                      </p>
                    )}
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{event.date.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
              ))}
          </div>

          {gang.members.length <= 1 && groupOrders.length === 0 && (
            <p className="text-[13px] text-center mt-6" style={{ color: "var(--text-muted)" }}>
              Invite your people to get the gang going.
            </p>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
