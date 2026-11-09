"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

const AVATAR_COLORS = ["#1C1C1E", "#E84C3D", "#22C55E", "#D4A43A", "#6366F1"];

type Tab = "orders" | "members" | "activity";

interface GroupOrder {
  id: string;
  restaurantName: string;
  status: string;
  deadline: string;
  memberCount: number;
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
  inviteCode: string;
  members: Array<{ id: string; role: string; joinedAt: string; firstName: string; user?: { firstName: string } }>;
}

export default function GangDetailPage() {
  const { gangId } = useParams<{ gangId: string }>();
  const router = useRouter();
  const [gang, setGang] = useState<GangData | null>(null);
  const [groupOrders, setGroupOrders] = useState<GroupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    Promise.all([
      fetch(`/api/gangs/${gangId}`).then((r) => r.json()),
      fetch(`/api/group-orders?gangId=${gangId}`).then((r) => r.ok ? r.json() : { success: false }),
    ]).then(([gangData, ordersData]) => {
      if (gangData.success) setGang(gangData.data);
      if (ordersData.success) setGroupOrders(ordersData.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [gangId]);

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        {/* Header */}
        <div className="px-5 pt-4 flex items-center justify-between">
          <div className="w-9 h-9 rounded-full" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="space-y-1 text-center">
            <div className="h-3 w-[80px] mx-auto rounded-[12px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "50ms" }} />
            <div className="h-4 w-[100px] mx-auto rounded-[12px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
          </div>
          <div className="w-9 h-9 rounded-full" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
        </div>

        {/* Gang profile */}
        <div className="px-5 mt-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full shrink-0" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "150ms" }} />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-[55%] rounded-[12px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "200ms" }} />
            <div className="h-4 w-[40%] rounded-[12px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "250ms" }} />
          </div>
        </div>

        {/* Share buttons */}
        <div className="px-5 mt-3 flex gap-2">
          <div className="h-[25px] w-[120px] rounded-full" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "300ms" }} />
          <div className="h-[25px] w-[110px] rounded-full" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "350ms" }} />
        </div>

        {/* Tabs */}
        <div className="px-5 mt-5 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-[40px] rounded-full" style={{ background: i === 0 ? "var(--sand)" : "transparent", borderWidth: i > 0 ? 1 : 0, borderColor: "var(--border)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${400 + i * 50}ms` }} />
          ))}
        </div>

        {/* Activity card */}
        <div className="px-5 mt-4">
          <div className="h-[70px] rounded-[22px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "550ms" }} />
        </div>

        {/* Activity items */}
        <div className="px-5 mt-5 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full shrink-0" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${600 + i * 80}ms` }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 rounded-[12px] w-[70%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${650 + i * 80}ms` }} />
                <div className="h-3 rounded-[12px] w-[30%]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${700 + i * 80}ms` }} />
              </div>
            </div>
          ))}
        </div>

        <BottomNav />
      </main>
    );
  }

  if (!gang) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        </div>
        <div className="py-16 text-center px-8">
          <h2 className="text-[17px] font-extrabold" style={{ color: "#17271F" }}>Gang not found</h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>This gang may not exist yet or the link is invalid.</p>
          <button type="button" onClick={() => router.push("/pools")} className="h-[40px] px-5 rounded-full text-[13px] font-bold text-white mt-4 cursor-pointer press-feedback" style={{ background: "var(--coral)" }}>Back to Gangs</button>
        </div>
        <BottomNav />
      </main>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/pools/${gang.id}` : "";

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs · {gang.name}</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>The gang&apos;s gist</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Gang profile ── */}
      <div className="px-5 mt-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] shrink-0" style={{ background: "var(--sand)" }}>
          {gang.emoji}
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{gang.name}</h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{gang.members.length} member{gang.members.length !== 1 ? "s" : ""}{gang.campus ? ` · ${gang.campus}` : ""}</p>
        </div>
      </div>

      {gang.motto && (
        <p className="px-5 mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>&ldquo;{gang.motto}&rdquo;</p>
      )}

      {/* ── Share buttons ── */}
      <div className="px-5 mt-3 flex gap-2">
        <button className="h-[25px] px-3 rounded-full text-[11px] font-bold cursor-pointer press-feedback" style={{ background: "#17271F", color: "white" }}
          onClick={() => { if (navigator.share) navigator.share({ title: `Join ${gang.name} on ChopDrop`, text: `Join our food gang!`, url: shareUrl }).catch(() => {}); else navigator.clipboard.writeText(shareUrl); }}>
          Share invite link
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Join ${gang.name} on ChopDrop! ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer"
          className="h-[25px] px-3 rounded-full text-[11px] font-bold inline-flex items-center press-feedback" style={{ background: "var(--sand)", color: "#17271F" }}>
          WhatsApp invite
        </a>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 mt-5 flex">
        {(["orders", "members", "activity"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="flex-1 h-[40px] text-[13px] font-bold cursor-pointer rounded-full"
            style={{ background: tab === t ? "#1C1C1E" : "transparent", color: tab === t ? "white" : "var(--text-muted)" }}>
            {t === "orders" ? "Orders" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Activity tab ── */}
      {tab === "activity" && (
        <>
          <div className="px-5 mt-4">
            <div className="p-4 rounded-[22px]" style={{ background: "#1C1C1E" }}>
              <p className="text-[15px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Good food travels fast.</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--subdued)" }}>{gang.members.length} member{gang.members.length !== 1 ? "s" : ""} · {groupOrders.filter(o => o.status === "OPEN").length} active order{groupOrders.filter(o => o.status === "OPEN").length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="px-5 mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Around the table</h3>
              <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>Recent</span>
            </div>

            {gang.members.length > 0 ? (
              <div className="flex flex-col gap-5">
                {gang.members.slice(0, 5).map((member, i) => (
                  <div key={member.id} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {(member.firstName || member.user?.firstName || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] leading-[145%]" style={{ color: "#17271F" }}>
                        <span className="font-bold">{(member.firstName || member.user?.firstName || "?")}</span> {member.role === "ADMIN" ? "created the gang." : "joined the gang."}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{new Date(member.joinedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No activity yet. Invite friends to get started.</p>
            )}

            <p className="text-[12px] text-center mt-6" style={{ color: "var(--text-muted)" }}>
              All caught up. Your next good lunch is on the Pools tab.
            </p>
          </div>
        </>
      )}

      {/* ── Orders tab — group orders + pool deals ── */}
      {tab === "orders" && (
        <div className="px-5 mt-4">
          {/* Start group order CTA */}
          <Link href={`/group/create?gang=${gangId}`}
            className="flex items-center gap-3 p-4 rounded-[22px] press-feedback mb-4" style={{ background: "#1C1C1E" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">Order together</p>
              <p className="text-[11px]" style={{ color: "var(--subdued)" }}>Pick a restaurant, everyone adds their items, split delivery</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="shrink-0 ml-auto"><path d="m9 18 6-6-6-6" /></svg>
          </Link>

          {/* Active group orders */}
          {groupOrders.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Active orders</h3>
              {groupOrders.map((order) => {
                const minsLeft = Math.max(0, Math.round((new Date(order.deadline).getTime() - Date.now()) / 60000));
                const isOpen = order.status === "OPEN";
                return (
                  <Link key={order.id} href={`/group/${order.inviteCode}`} className="p-4 rounded-[22px] press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: isOpen ? "#FEF2F0" : "var(--sand)", color: isOpen ? "var(--coral)" : "var(--text-muted)" }}>
                        {isOpen ? "Open · Ordering" : order.status}
                      </span>
                      {isOpen && <span className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>{minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft}m left`}</span>}
                    </div>
                    <h4 className="text-[15px] font-bold" style={{ color: "#1C1C1E" }}>{order.restaurantName}</h4>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{order.memberCount} people · {order.deliveryAddress}</p>
                    {order.deliveryFee > 0 && (
                      <p className="text-[11px] mt-1" style={{ color: "var(--emerald)" }}>Delivery {fp(order.deliveryFee)} split {order.memberCount} ways = {fp(Math.round(order.deliveryFee / Math.max(1, order.memberCount)))} each</p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No active group orders. Start one above — your gang will be notified.</p>
              <Link href="/discover" className="mt-3 text-[13px] font-bold inline-block" style={{ color: "var(--coral)" }}>Or browse pool deals →</Link>
            </div>
          )}
        </div>
      )}

      {/* ── Members tab ── */}
      {tab === "members" && (
        <div className="px-5 mt-4">
          <div className="rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
            {gang.members.map((member, i) => (
              <div key={member.id}>
                {i > 0 && <div className="mx-5 h-px" style={{ background: "var(--border)" }} />}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {(member.firstName || member.user?.firstName || "?").charAt(0)}
                  </div>
                  <span className="text-[14px] font-medium" style={{ color: "#17271F" }}>{(member.firstName || member.user?.firstName || "?")}{member.role === "ADMIN" ? " (Admin)" : ""}</span>
                  {member.role === "ADMIN" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>Creator</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-[13px] font-bold cursor-pointer flex items-center gap-1.5" style={{ color: "var(--coral)" }}
            onClick={() => { if (navigator.share) navigator.share({ title: `Join ${gang.name} on ChopDrop`, text: "Join our food gang!", url: shareUrl }).catch(() => {}); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6" /></svg>
            Invite people
          </button>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
