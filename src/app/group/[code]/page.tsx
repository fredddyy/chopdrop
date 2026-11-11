"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface InviteData {
  id: string;
  restaurantName: string;
  coordinatorName: string;
  deadline: string;
  memberCount: number;
  deliveryAddress: string;
  status: string;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Member {
  id: string;
  userId: string;
  firstName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryShare: number;
  paymentStatus: string;
}

interface GroupTier { min: number; discount: number; }

interface FullOrder {
  id: string;
  inviteCode: string;
  status: string;
  deadline: string;
  deliveryAddress: string;
  deliveryFee: number;
  settled?: boolean;
  restaurant: { id: string; name: string; imageUrl: string | null };
  coordinator: { id: string; firstName: string };
  members: Member[];
  groupTiers?: GroupTier[];
  paidMemberCount?: number;
  currentDiscount?: number;
  nextTier?: GroupTier | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  category: string;
}

function fp(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

function timeLeft(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Deadline passed";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m} min left`;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Accepting orders", color: "#22C55E", bg: "#F0FDF4" },
  CLOSED: { label: "Order closed \u2014 preparing", color: "#D97706", bg: "#FEF3C7" },
  ORDERED: { label: "Sent to restaurant", color: "#3B82F6", bg: "#EFF6FF" },
  READY: { label: "Food ready!", color: "#E84C3D", bg: "#FEF2F0" },
  DELIVERED: { label: "Delivered", color: "#22C55E", bg: "#F0FDF4" },
};

export default function GroupOrderPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6">
          <div className="h-6 w-[60%] rounded-[8px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-4 w-[40%] rounded-[8px] mb-8" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
        </div>
        <BottomNav />
      </main>
    }>
      <GroupOrderInner />
    </Suspense>
  );
}

function GroupOrderInner() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentReference = searchParams.get("reference");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [fullOrder, setFullOrder] = useState<FullOrder | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Current user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Menu browser
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // Items
  const [savingItems, setSavingItems] = useState(false);
  const [myItems, setMyItems] = useState<OrderItem[]>([]);

  // Checkout
  const [checkingOut, setCheckingOut] = useState(false);

  // Share
  const [copied, setCopied] = useState(false);

  // Payment confirmation
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(!!paymentReference);

  // Fetch current user on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCurrentUserId(d.data.id); })
      .catch(() => {});
  }, []);

  const fetchFull = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/group-orders/${orderId}`);
      const d = await res.json();
      if (d.success) {
        setFullOrder(d.data);
        setIsMember(true);
      }
    } catch {
      // Auth might have failed -- fall back to invite view
    }
  }, []);

  // Fetch restaurant menu when we know the restaurant
  const fetchMenu = useCallback(async (restaurantId: string) => {
    setMenuLoading(true);
    try {
      const res = await fetch(`/api/stores/${restaurantId}`);
      const d = await res.json();
      if (d.success) {
        const store = d.data;
        // Merge all menu sources into flat list (same pattern as store page)
        const seenIds = new Set<string>();
        const items: MenuItem[] = [];

        // Products
        for (const p of (store.products || [])) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            items.push({
              id: p.id,
              name: p.name,
              description: p.description || null,
              imageUrl: p.imageUrl || null,
              price: p.retailPrice,
              category: p.subcategory || p.category || "Menu",
            });
          }
        }

        // Combos
        for (const c of (store.combos || [])) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            items.push({
              id: c.id,
              name: c.name,
              description: c.description || null,
              imageUrl: c.imageUrl || null,
              price: c.price,
              category: "Combos",
            });
          }
        }

        // Menu category items
        for (const cat of (store.menuCategories || [])) {
          for (const item of cat.items) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              items.push({
                id: item.id,
                name: item.name,
                description: item.description || null,
                imageUrl: item.imageUrl || null,
                price: item.price,
                category: cat.name,
              });
            }
          }
        }

        setMenuItems(items);
      }
    } catch {
      // Menu fetch failed -- user can still add manually
    }
    setMenuLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // First get invite to know the order ID
        const invRes = await fetch(`/api/group-orders/invite/${code}`);
        const invData = await invRes.json();
        if (!invData.success) { setError("Invite not found"); setLoading(false); return; }
        if (!cancelled) setInvite(invData.data);

        // Try auth'd full detail
        const fullRes = await fetch(`/api/group-orders/${invData.data.id}`);
        if (fullRes.ok) {
          const fullData = await fullRes.json();
          if (fullData.success && !cancelled) {
            setFullOrder(fullData.data);
            // Check if current user is actually a member
            const meRes = await fetch("/api/auth/me");
            const meData = meRes.ok ? await meRes.json() : null;
            if (meData?.success && !cancelled) setCurrentUserId(meData.data.id);
            const myId = meData?.success ? meData.data.id : null;
            const isActualMember = myId && fullData.data.members.some((m: { userId: string }) => m.userId === myId);
            if (isActualMember) {
              setIsMember(true);
            }
            // Don't auto-join — let user see the order first and decide
          }
        }
      } catch {
        // network error
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [code]);

  // Verify payment if returning from Paystack
  useEffect(() => {
    if (!paymentReference || !fullOrder || !currentUserId) return;
    let done = false;
    async function verify() {
      setVerifyingPayment(true);
      try {
        // Call verify endpoint to confirm payment with Paystack and update DB
        await fetch(`/api/group-orders/${fullOrder!.id}/verify?reference=${paymentReference}`);
        // Re-fetch order to get updated payment status
        const res = await fetch(`/api/group-orders/${fullOrder!.id}`);
        const d = await res.json();
        if (!done && d.success) {
          setFullOrder(d.data);
          const me = d.data.members.find((m: Member) => m.userId === currentUserId);
          if (me?.paymentStatus === "SUCCESS") {
            setPaymentConfirmed(true);
          }
        }
      } catch { /* network error */ }
      if (!done) setVerifyingPayment(false);
    }
    verify();
    return () => { done = true; };
  }, [paymentReference, fullOrder?.id, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync myItems from fullOrder once we know the current user
  useEffect(() => {
    if (!fullOrder || !currentUserId) return;
    const me = fullOrder.members.find((m) => m.userId === currentUserId);
    if (me && me.items && Array.isArray(me.items)) {
      setMyItems(me.items as OrderItem[]);
    }
  }, [fullOrder, currentUserId]);

  // Fetch menu when fullOrder loads
  useEffect(() => {
    if (fullOrder?.restaurant.id) {
      fetchMenu(fullOrder.restaurant.id);
    }
  }, [fullOrder?.restaurant.id, fetchMenu]);

  async function handleJoin() {
    if (!invite) return;
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/group-orders/${invite.id}/join`, { method: "POST" });
      const d = await res.json();
      if (!d.success) {
        if (res.status === 401) {
          router.push(`/auth?returnTo=/group/${code}`);
          return;
        }
        if (d.error === "You already joined this group order") {
          await fetchFull(invite.id);
          setJoining(false);
          return;
        }
        setError(d.error || "Could not join");
        setJoining(false);
        return;
      }
      await fetchFull(invite.id);
    } catch {
      setError("Network error");
    }
    setJoining(false);
  }

  function addMenuItemToOrder(menuItem: MenuItem) {
    if (!fullOrder) return;
    // Check if already in myItems
    const existingIdx = myItems.findIndex((i) => i.productId === menuItem.id);
    let updated: OrderItem[];
    if (existingIdx >= 0) {
      updated = myItems.map((item, i) =>
        i === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...myItems, {
        productId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
      }];
    }
    setMyItems(updated);
    saveItems(updated);
  }

  function changeItemQuantity(productId: string, delta: number) {
    if (!fullOrder) return;
    let updated: OrderItem[];
    const existingIdx = myItems.findIndex((i) => i.productId === productId);
    if (existingIdx < 0) return;
    const newQty = myItems[existingIdx].quantity + delta;
    if (newQty <= 0) {
      updated = myItems.filter((_, i) => i !== existingIdx);
    } else {
      updated = myItems.map((item, i) =>
        i === existingIdx ? { ...item, quantity: newQty } : item
      );
    }
    setMyItems(updated);
    saveItems(updated);
  }

  async function saveItems(items: OrderItem[]) {
    if (!fullOrder) return;
    setSavingItems(true);
    try {
      await fetch(`/api/group-orders/${fullOrder.id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      await fetchFull(fullOrder.id);
    } catch {
      // silently fail
    }
    setSavingItems(false);
  }

  async function handleCheckout() {
    if (!fullOrder) return;
    setCheckingOut(true);
    try {
      const res = await fetch(`/api/group-orders/${fullOrder.id}/checkout`, { method: "POST" });
      const d = await res.json();
      if (d.success && d.data.authorizationUrl) {
        window.location.href = d.data.authorizationUrl;
        return;
      }
      setError(d.error || "Checkout failed");
    } catch {
      setError("Network error");
    }
    setCheckingOut(false);
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/group/${code}` : "";
  const restaurantName = fullOrder?.restaurant.name || invite?.restaurantName || "";
  const whatsappText = `Join my group order from ${restaurantName}! Add your items before the deadline. ${shareUrl}`;

  if (loading || verifyingPayment) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6">
          <div className="h-6 w-[60%] rounded-[8px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-4 w-[40%] rounded-[8px] mb-8" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
          <div className="h-[120px] rounded-[16px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "200ms" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error === "Invite not found") {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="py-20 text-center px-8">
          <h2 className="text-[17px] font-extrabold mb-1" style={{ color: "#1C1C1E" }}>Invite not found</h2>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>This group order link may have expired.</p>
          <button type="button" onClick={() => router.push("/discover")} className="text-[14px] font-bold mt-4 cursor-pointer" style={{ color: "#E84C3D" }}>
            Back to Discover
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  // -- Payment confirmation screen --
  if (paymentConfirmed && fullOrder) {
    const paidMember = fullOrder.members.find((m) => m.userId === currentUserId);
    const paidTotal = (paidMember?.subtotal || 0) + (paidMember?.deliveryShare || 0);
    const paidCount = fullOrder.members.filter((m) => m.paymentStatus === "SUCCESS").length;
    const allPaid = paidCount === fullOrder.members.length;
    const itemCount = paidMember?.items ? (paidMember.items as OrderItem[]).length : 0;
    const paidItems = (paidMember?.items || []) as OrderItem[];
    const confirmShareUrl = typeof window !== "undefined" ? `${window.location.origin}/group/${code}` : "";
    const unpaidCount = fullOrder.members.length - paidCount;
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-screen pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6 pb-10">

          {/* ── Celebration card ── */}
          <div className="rounded-[16px] p-6 text-center" style={{ background: "var(--dark)" }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4" style={{ background: "var(--emerald)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <h1 className="text-[24px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "white" }}>
              You&apos;re in!
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--subdued)" }}>
              {fullOrder.restaurant.name} · {allPaid ? "Everyone\u2019s paid" : `Waiting for ${unpaidCount} more`}
            </p>
          </div>

          {/* ── Receipt ── */}
          <div className="mt-5 rounded-[16px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--text-muted)" }}>Your receipt</p>

            {/* Item list */}
            {paidItems.length > 0 && (
              <div className="mb-3">
                {paidItems.map((item, i) => (
                  <div key={item.productId || i} className="flex items-center justify-between py-1.5">
                    <span className="text-[13px]" style={{ color: "var(--text)" }}>{item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}</span>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text)" }}>{fp(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            {paidItems.length === 0 && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Items</span>
                <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
              </div>
            )}

            <div className="h-px" style={{ background: "var(--border)" }} />

            {/* Delivery share */}
            {(paidMember?.deliveryShare || 0) > 0 && (
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Delivery ({fullOrder.members.length}-way split)</span>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text)" }}>{fp(paidMember?.deliveryShare || 0)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[13px] font-extrabold" style={{ color: "var(--text)" }}>Total paid</span>
              <span className="text-[24px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>{fp(paidTotal)}</span>
            </div>

            {/* Squad progress */}
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
              <span>{paidCount} of {fullOrder.members.length} paid</span>
              <span style={{ color: allPaid ? "var(--emerald)" : "var(--coral)" }}>{allPaid ? "All set!" : `${unpaidCount} pending`}</span>
            </div>
            <div className="mt-1.5 h-[6px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: `${Math.round((paidCount / fullOrder.members.length) * 100)}%`, background: "var(--emerald)", borderRadius: "9px", transition: "width 300ms ease-out" }} />
            </div>
          </div>

          {/* ── Nudge unpaid members ── */}
          {!allPaid && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`I just paid for my items from ${fullOrder.restaurant.name}! Add yours before the deadline: ${confirmShareUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 w-full h-[44px] rounded-full flex items-center justify-center gap-2 text-[13px] font-bold text-white press-feedback"
              style={{ background: "#25D366" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Nudge {unpaidCount} to pay
            </a>
          )}

          {/* ── Actions ── */}
          <button
            type="button"
            onClick={() => setPaymentConfirmed(false)}
            className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white press-feedback mt-4"
            style={{ background: "var(--dark)" }}
          >
            View group order
          </button>

          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold press-feedback mt-3"
            style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Go to My Orders
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  // -- State A: Not a member --
  if (!isMember && invite) {
    const inviteDeadlinePassed = new Date(invite.deadline).getTime() < Date.now();
    const inviteAccepting = invite.status === "OPEN" && !inviteDeadlinePassed;
    const st = inviteDeadlinePassed && invite.status === "OPEN"
      ? { label: "Deadline passed", color: "var(--text-muted)", bg: "var(--sand)" }
      : STATUS_LABELS[invite.status] || STATUS_LABELS.OPEN;
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4 pb-10">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback mb-4" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "#E84C3D" }}>Group Order</p>
          <h1 className="text-[28px] font-extrabold mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
            {invite.restaurantName}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
            Started by {invite.coordinatorName}
          </p>

          {/* Info card */}
          <div className="mt-6 rounded-[16px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
              {invite.status === "OPEN" && (
                <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                  {timeLeft(invite.deadline)}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                <p className="text-[13px]" style={{ color: "#1C1C1E" }}>{invite.memberCount} member{invite.memberCount !== 1 ? "s" : ""} so far</p>
              </div>
              <div className="flex items-start gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <p className="text-[13px]" style={{ color: "#1C1C1E" }}>{invite.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {error && error !== "Invite not found" && (
            <p className="text-[13px] font-bold mt-4" style={{ color: "#E84C3D" }}>{error}</p>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !inviteAccepting}
            className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white cursor-pointer press-feedback mt-6"
            style={{ background: !inviteAccepting ? "var(--text-muted)" : "var(--coral)" }}
          >
            {joining ? "Joining..." : "Join this group order"}
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  // -- State B1: Can see the order but not a member — show preview + join button --
  if (fullOrder && !isMember) {
    const previewDeadlinePassed = new Date(fullOrder.deadline).getTime() < Date.now();
    const canJoin = fullOrder.status === "OPEN" && !previewDeadlinePassed && currentUserId;
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-screen pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-4 pb-10">
          <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback mb-4" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          {/* Restaurant header */}
          <div className="flex items-center gap-4">
            {fullOrder.restaurant.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fullOrder.restaurant.imageUrl} alt={fullOrder.restaurant.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
            )}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)" }}>Group Order</p>
              <h1 className="text-[22px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fullOrder.restaurant.name}</h1>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: canJoin ? "var(--emerald-soft)" : "var(--sand)", color: canJoin ? "var(--emerald)" : "var(--text-muted)" }}>
              {canJoin ? "Accepting orders" : previewDeadlinePassed ? "Deadline passed" : fullOrder.status}
            </span>
            {canJoin && (
              <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{timeLeft(fullOrder.deadline)}</span>
            )}
          </div>

          {/* Delivery address */}
          <div className="flex items-start gap-2 mt-3">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{fullOrder.deliveryAddress}</p>
          </div>

          {/* Members preview */}
          <div className="mt-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--text-muted)" }}>
              {fullOrder.members.length} member{fullOrder.members.length !== 1 ? "s" : ""} so far
            </p>
            <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {fullOrder.members.map((m, i) => (
                <div key={m.id}>
                  {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: m.userId === fullOrder.coordinator.id ? "var(--coral)" : "var(--dark)" }}>
                      {m.firstName.charAt(0)}
                    </div>
                    <span className="text-[14px] font-medium" style={{ color: "var(--text)" }}>
                      {m.firstName}{m.userId === fullOrder.coordinator.id ? " (organiser)" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Join CTA */}
          {canJoin ? (
            <button
              type="button"
              disabled={joining}
              onClick={async () => {
                setJoining(true);
                try {
                  const res = await fetch(`/api/group-orders/${fullOrder.id}/join`, { method: "POST" });
                  const d = await res.json();
                  if (d.success || d.error === "You already joined this group order") {
                    setIsMember(true);
                    await fetchFull(fullOrder.id);
                  } else if (res.status === 401) {
                    router.push(`/auth?returnTo=/group/${code}`);
                  } else {
                    alert(d.error || "Couldn\u2019t join");
                  }
                } catch { alert("Network error"); }
                setJoining(false);
              }}
              className="w-full h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white press-feedback mt-6 disabled:opacity-50"
              style={{ background: "var(--coral)" }}
            >
              {joining ? "Joining\u2026" : "Join this order"}
            </button>
          ) : !currentUserId ? (
            <a href={`/auth?returnTo=/group/${code}`}
              className="w-full h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white press-feedback mt-6"
              style={{ background: "var(--coral)" }}>
              Sign up to join
            </a>
          ) : (
            <p className="text-[13px] text-center mt-6" style={{ color: "var(--text-muted)" }}>
              {previewDeadlinePassed ? "This order\u2019s deadline has passed." : "This order is no longer accepting members."}
            </p>
          )}
        </div>
        <BottomNav />
      </main>
    );
  }

  // -- State B2: Member view --
  if (!fullOrder) return null;

  const deadlinePassed = new Date(fullOrder.deadline).getTime() < Date.now();
  const isStillAccepting = fullOrder.status === "OPEN" && !deadlinePassed;
  const st = deadlinePassed && fullOrder.status === "OPEN"
    ? { label: "Deadline passed", color: "var(--text-muted)", bg: "var(--sand)" }
    : STATUS_LABELS[fullOrder.status] || STATUS_LABELS.OPEN;
  const memberCount = fullOrder.members.length;
  const deliveryPerPerson = memberCount > 0 ? Math.round(fullOrder.deliveryFee / memberCount) : 0;
  const mySubtotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const myTotal = mySubtotal + deliveryPerPerson;

  // Find current user's member record
  const myMember = currentUserId
    ? fullOrder.members.find((m) => m.userId === currentUserId)
    : null;

  const hasPaid = myMember?.paymentStatus === "SUCCESS";

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          {/* Share button */}
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="h-[32px] px-3 rounded-[10px] flex items-center gap-1.5 text-[12px] font-bold cursor-pointer press-feedback"
            style={{ background: "var(--sand)", color: "#1C1C1E", border: "1px solid var(--border)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>
            {copied ? "Copied!" : "Share"}
          </button>
        </div>

        {/* Restaurant profile — matches store page */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
            {fullOrder.restaurant.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fullOrder.restaurant.imageUrl} alt={fullOrder.restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[18px] font-extrabold" style={{ color: "var(--text-muted)" }}>
                {fullOrder.restaurant.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "#E84C3D" }}>Group Order</p>
            <h1 className="text-[22px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
              {fullOrder.restaurant.name}
            </h1>
          </div>
        </div>

        {/* Status + deadline */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
            {st.label}
          </span>
          {isStillAccepting && (
            <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
              {timeLeft(fullOrder.deadline)}
            </span>
          )}
        </div>

        {/* Delivery address */}
        <div className="flex items-start gap-2 mt-3">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{fullOrder.deliveryAddress}</p>
        </div>

        {/* WhatsApp share bar */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full h-[40px] rounded-[10px] flex items-center justify-center gap-2 text-[13px] font-bold text-white press-feedback"
          style={{ background: "#25D366" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          Invite more people
        </a>

        {/* -- Cancel order (coordinator only, while still open) -- */}
        {currentUserId === fullOrder.coordinator.id && isStillAccepting && (
          <button
            type="button"
            className="mt-4 text-[12px] font-bold press-feedback block"
            style={{ color: "var(--text-muted)" }}
            onClick={async () => {
              const paidCount = fullOrder.members.filter(m => m.paymentStatus === "SUCCESS").length;
              const msg = paidCount > 0
                ? `Cancel this order? ${paidCount} paid member${paidCount !== 1 ? "s" : ""} will be refunded to their wallet.`
                : "Cancel this group order?";
              if (!confirm(msg)) return;
              try {
                const res = await fetch(`/api/group-orders/${fullOrder.id}/cancel`, { method: "POST" });
                const d = await res.json();
                if (d.success) {
                  alert(d.data.message);
                  router.push("/pools");
                } else {
                  alert(d.error || "Couldn\u2019t cancel");
                }
              } catch { alert("Network error"); }
            }}
          >
            Cancel this order
          </button>
        )}

        {/* -- Tier progress -- */}
        {fullOrder.groupTiers && fullOrder.groupTiers.length > 0 && (
          <div className="mt-6 rounded-[16px] p-4" style={{ background: "var(--dark)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--emerald)" }}>Group discount</p>
              {(fullOrder.currentDiscount || 0) > 0 && (
                <span className="text-[12px] font-extrabold" style={{ color: "var(--emerald)" }}>{fullOrder.currentDiscount}% off reached</span>
              )}
            </div>
            <div className="flex gap-2">
              {fullOrder.groupTiers.map((t) => {
                const reached = (fullOrder.paidMemberCount || 0) >= t.min;
                return (
                  <div key={t.min} className="flex-1 rounded-[8px] py-2 text-center" style={{ background: reached ? "rgba(13,159,95,0.15)" : "rgba(255,255,255,0.06)", border: reached ? "1px solid var(--emerald)" : "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[14px] font-extrabold tabular-nums" style={{ color: reached ? "var(--emerald)" : "white" }}>{t.min}+</p>
                    <p className="text-[10px]" style={{ color: reached ? "var(--emerald)" : "var(--subdued)" }}>{t.discount}% off</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] mt-2" style={{ color: "var(--subdued)" }}>
              {fullOrder.paidMemberCount || 0} paid · {fullOrder.nextTier ? `${fullOrder.nextTier.min - (fullOrder.paidMemberCount || 0)} more for ${fullOrder.nextTier.discount}% off` : (fullOrder.currentDiscount || 0) > 0 ? "Top tier reached!" : "Get 3+ people to unlock discounts"}
            </p>
          </div>
        )}

        {/* -- Members -- */}
        <section className="mt-5">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--text-muted)" }}>
            Members ({memberCount})
          </h2>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {fullOrder.members.map((m, i) => {
              const isMe = currentUserId && m.userId === currentUserId;
              const isCoordinator = m.userId === fullOrder.coordinator.id;
              return (
                <div key={m.id}>
                  {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: isCoordinator ? "#E84C3D" : "#1C1C1E" }}>
                        {m.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold" style={{ color: "#1C1C1E" }}>
                          {m.firstName}
                          {isMe && (
                            <span className="text-[10px] font-bold ml-1.5" style={{ color: "#E84C3D" }}>(you)</span>
                          )}
                          {isCoordinator && (
                            <span className="text-[10px] font-bold ml-1.5" style={{ color: "var(--text-muted)" }}>Organizer</span>
                          )}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {(m.items as OrderItem[]).length} item{(m.items as OrderItem[]).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: m.paymentStatus === "SUCCESS" ? "#F0FDF4" : "var(--sand)",
                        color: m.paymentStatus === "SUCCESS" ? "#22C55E" : "var(--text-muted)",
                      }}
                    >
                      {m.paymentStatus === "SUCCESS" ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* -- My items section — editable only before payment -- */}
        {isStillAccepting && !hasPaid && (
          <section className="mt-7">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--text-muted)" }}>
              Your items
            </h2>

            {myItems.length > 0 && (
              <div className="rounded-[16px] overflow-hidden mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {myItems.map((item, i) => (
                  <div key={item.productId}>
                    {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold truncate" style={{ color: "#1C1C1E" }}>{item.name}</p>
                        <p className="text-[13px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
                          {fp(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item.productId, -1)}
                          className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer press-feedback"
                          style={{ background: "var(--sand)" }}
                        >
                          {item.quantity === 1 ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E84C3D" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                          )}
                        </button>
                        <span className="w-[24px] text-center text-[14px] font-extrabold tabular-nums" style={{ color: "#1C1C1E" }}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item.productId, 1)}
                          className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer press-feedback"
                          style={{ background: "#E84C3D" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Subtotal */}
                <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold" style={{ color: "var(--text-secondary)" }}>Food subtotal</span>
                    <span className="text-[14px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{fp(mySubtotal)}</span>
                  </div>
                  {deliveryPerPerson > 0 && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[12px] font-bold" style={{ color: "var(--text-secondary)" }}>Delivery ({memberCount}-way split)</span>
                      <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text-secondary)" }}>{fp(deliveryPerPerson)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-[13px] font-extrabold" style={{ color: "#1C1C1E" }}>Your total</span>
                    <span className="text-[18px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#E84C3D" }}>{fp(myTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Menu browser */}
            <div className="mt-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--text-muted)" }}>
                {fullOrder.restaurant.name} menu
              </h3>

              {menuLoading && (
                <div className="rounded-[16px] p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: "var(--sand)", animation: "pulse 1.2s ease-in-out infinite" }} />
                    <p className="text-[12px] font-bold" style={{ color: "var(--text-muted)" }}>Loading menu...</p>
                  </div>
                </div>
              )}

              {!menuLoading && menuItems.length > 0 && (
                <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {menuItems.map((item, i) => {
                    const inOrder = myItems.find((o) => o.productId === item.id);
                    const qty = inOrder?.quantity || 0;
                    return (
                      <div key={item.id}>
                        {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Food image */}
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="w-[48px] h-[48px] rounded-[10px] object-cover shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-[48px] h-[48px] rounded-[10px] shrink-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
                              <span className="text-[14px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{item.name.charAt(0)}</span>
                            </div>
                          )}
                          {/* Name + price */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold leading-[135%] truncate" style={{ color: "#1C1C1E" }}>{item.name}</p>
                            {item.description && (
                              <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                            )}
                            <p className="text-[14px] font-extrabold tabular-nums mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
                              {fp(item.price)}
                            </p>
                          </div>
                          {/* Add / stepper */}
                          {qty > 0 ? (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button type="button" onClick={() => changeItemQuantity(item.id, -1)}
                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer press-feedback"
                                style={{ background: "var(--sand)" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                              </button>
                              <span className="w-[24px] text-center text-[14px] font-extrabold tabular-nums" style={{ color: "#1C1C1E" }}>{qty}</span>
                              <button type="button" onClick={() => addMenuItemToOrder(item)}
                                className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer press-feedback"
                                style={{ background: "#E84C3D" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => addMenuItemToOrder(item)}
                              className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer press-feedback shrink-0"
                              style={{ background: "#E84C3D" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!menuLoading && menuItems.length === 0 && (
                <div className="rounded-[16px] p-5 text-center" style={{ background: "var(--sand)", border: "1px solid var(--border)" }}>
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-muted)" }}>
                    Menu not available yet
                  </p>
                  <Link
                    href={`/store/${fullOrder.restaurant.id}?groupOrder=${fullOrder.id}`}
                    className="text-[12px] font-bold mt-2 inline-block"
                    style={{ color: "#E84C3D" }}
                  >
                    Browse full store page
                  </Link>
                </div>
              )}
            </div>

            {/* Saving indicator */}
            {savingItems && (
              <p className="text-[11px] font-bold mt-2 text-center" style={{ color: "var(--text-muted)" }}>Saving...</p>
            )}

          </section>
        )}

        {/* Status: already paid — show locked order summary */}
        {hasPaid && (
          <section className="mt-7">
            <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {/* Paid header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--emerald-soft)" }}>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                  <span className="text-[13px] font-extrabold" style={{ color: "var(--emerald)" }}>Paid</span>
                </div>
                <span className="text-[13px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{fp(myTotal)}</span>
              </div>
              {/* Items (read-only) */}
              {myItems.length > 0 && (
                <div className="px-4">
                  {myItems.map((item, i) => (
                    <div key={item.productId}>
                      {i > 0 && <div className="h-px" style={{ background: "var(--border)" }} />}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-[13px]" style={{ color: "var(--text)" }}>{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}</span>
                        <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text)" }}>{fp(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[12px] text-center mt-3" style={{ color: "var(--text-muted)" }}>
              Your order is locked. Waiting for others to join.
            </p>
          </section>
        )}
      </div>

      {/* ── Sticky pay bar ── */}
      {isStillAccepting && myItems.length > 0 && !hasPaid && (
        <div className="fixed bottom-[72px] left-0 right-0 z-30 px-5 pb-3 pt-3" style={{ background: "linear-gradient(transparent, var(--bg) 8px)" }}>
          <div className="max-w-[480px] mx-auto">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full h-[50px] rounded-[12px] flex items-center justify-between px-5 text-[15px] font-bold text-white cursor-pointer press-feedback"
              style={{ background: checkingOut ? "var(--text-muted)" : "#E84C3D" }}
            >
              <span>{checkingOut ? "Redirecting..." : `Pay ${fp(myTotal)}`}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
