"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";
import { CountdownTimer } from "@/components/countdown-timer";
import { Logo } from "@/components/logo";

interface OrderData {
  id: string;
  orderCode: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  quantity: number;
  createdAt: string;
  dailyMenu: {
    meal: { name: string; restaurant: { name: string } };
  };
}

interface RestaurantReadiness {
  name: string;
  ready: number;
  total: number;
  percent: number;
}

type OpsTab = "overview" | "restaurants" | "offices" | "meals" | "menu";

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

interface OfficeDataItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  secretToken: string;
  address: string;
  collectionPoint: string;
  assistantName: string | null;
  assistantPhone: string | null;
  isActive: boolean;
  _count: { orders: number };
}

export default function OpsPage() {
  const [tab, setTab] = useState<OpsTab>("overview");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [offices, setOffices] = useState<OfficeDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Restaurant form
  const [showRestForm, setShowRestForm] = useState(false);
  const [restName, setRestName] = useState("");
  const [restAddress, setRestAddress] = useState("");
  const [restPhone, setRestPhone] = useState("");

  // Office form
  const [showOfficeForm, setShowOfficeForm] = useState(false);
  const [offName, setOffName] = useState("");
  const [offAddress, setOffAddress] = useState("");
  const [offCollection, setOffCollection] = useState("Main reception");
  const [offAssistant, setOffAssistant] = useState("");
  const [offAssistantPhone, setOffAssistantPhone] = useState("");

  // Meals
  const [meals, setMeals] = useState<{ id: string; name: string; price: number; tag: string; type: string; isAvailable: boolean; restaurant: { id: string; name: string } }[]>([]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealPrice, setMealPrice] = useState("");
  const [mealRestId, setMealRestId] = useState("");
  const [mealTag, setMealTag] = useState("REGULAR");
  const [mealType, setMealType] = useState("FIXED");
  const [mealDesc, setMealDesc] = useState("");
  const [mealImage, setMealImage] = useState("");

  // Daily menu
  const [dailyMenus, setDailyMenus] = useState<{ id: string; maxOrders: number; currentOrders: number; meal: { name: string; price: number; restaurant: { name: string } }; timeSlot: { label: string; startTime: string; endTime: string } }[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ id: string; label: string; startTime: string; endTime: string }[]>([]);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuMealId, setMenuMealId] = useState("");
  const [menuSlotId, setMenuSlotId] = useState("");
  const [menuMaxOrders, setMenuMaxOrders] = useState("30");
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split("T")[0]);

  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("admin@chopdrop.ng");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  async function handleLogin() {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setNeedsLogin(false);
      loadAll();
    } else {
      setLoginError(data.error || "Invalid credentials");
    }
  }

  function loadAll() {
    fetch("/api/admin/restaurants").then((r) => {
      if (r.status === 401) { setNeedsLogin(true); setLoading(false); return; }
      return r.json();
    }).then((restData) => {
      if (!restData) return;
      // Auth is good — load everything
      Promise.all([
        fetch("/api/admin/orders?date=" + new Date().toISOString().split("T")[0]).then((r) => r.json()),
        Promise.resolve(restData),
        fetch("/api/admin/offices").then((r) => r.json()),
        fetch("/api/admin/meals").then((r) => r.json()),
        fetch("/api/admin/daily-menu?date=" + new Date().toISOString().split("T")[0]).then((r) => r.json()),
        fetch("/api/admin/time-slots").then((r) => r.json()),
      ]).then(([ordersData, restD, offData, mealsData, dmData, slotsData]) => {
        if (ordersData.success) setOrders(ordersData.data.filter((o: OrderData) => o.paymentStatus === "SUCCESS"));
        if (restD.success) setRestaurants(restD.data);
        if (offData.success) setOffices(offData.data);
        if (mealsData.success) setMeals(mealsData.data);
        if (dmData.success) setDailyMenus(dmData.data);
        if (slotsData.success) {
          setTimeSlots(slotsData.data);
          if (slotsData.data.length > 0 && !menuSlotId) setMenuSlotId(slotsData.data[0].id);
        }
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function addRestaurant() {
    if (!restName.trim()) return;
    await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: restName.trim(), address: restAddress.trim(), phone: restPhone.trim() }),
    });
    setRestName(""); setRestAddress(""); setRestPhone(""); setShowRestForm(false);
    loadAll();
  }

  async function addOffice() {
    if (!offName.trim()) return;
    await fetch("/api/admin/offices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: offName.trim(),
        address: offAddress.trim(),
        collectionPoint: offCollection.trim(),
        assistantName: offAssistant.trim() || null,
        assistantPhone: offAssistantPhone.trim() || null,
      }),
    });
    setOffName(""); setOffAddress(""); setOffCollection("Main reception"); setOffAssistant(""); setOffAssistantPhone(""); setShowOfficeForm(false);
    loadAll();
  }

  async function addMeal() {
    if (!mealName.trim() || !mealRestId || !mealPrice) return;
    await fetch("/api/admin/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: mealName.trim(),
        restaurantId: mealRestId,
        price: Math.round(parseFloat(mealPrice) * 100),
        tag: mealTag,
        type: mealType,
        description: mealDesc.trim() || undefined,
        imageUrl: mealImage.trim() || undefined,
      }),
    });
    setMealName(""); setMealPrice(""); setMealRestId(""); setMealTag("REGULAR"); setMealType("FIXED"); setMealDesc(""); setMealImage(""); setShowMealForm(false);
    loadAll();
  }

  async function toggleMealAvailability(id: string, current: boolean) {
    await fetch(`/api/admin/meals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !current }),
    });
    loadAll();
  }

  async function addToMenu() {
    if (!menuMealId || !menuSlotId) return;
    await fetch("/api/admin/daily-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: menuDate,
        mealId: menuMealId,
        timeSlotId: menuSlotId,
        maxOrders: parseInt(menuMaxOrders),
      }),
    });
    setMenuMealId(""); setMenuMaxOrders("30"); setShowMenuForm(false);
    loadAll();
  }

  async function removeFromMenu(id: string) {
    await fetch(`/api/admin/daily-menu/${id}`, { method: "DELETE" });
    loadAll();
  }

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalBoxes = orders.reduce((s, o) => s + o.quantity, 0);

  // Group by restaurant for readiness
  const restMap = new Map<string, { total: number; ready: number }>();
  for (const order of orders) {
    const name = order.dailyMenu.meal.restaurant.name;
    const existing = restMap.get(name) || { total: 0, ready: 0 };
    existing.total += order.quantity;
    if (order.status === "READY" || order.status === "COMPLETED") existing.ready += order.quantity;
    restMap.set(name, existing);
  }
  const readiness: RestaurantReadiness[] = Array.from(restMap.entries()).map(([name, data]) => ({
    name,
    ready: data.ready,
    total: data.total,
    percent: data.total > 0 ? Math.round((data.ready / data.total) * 100) : 0,
  }));

  // Status counts
  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;

  // Recent activity from orders
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Search filter
  const searchResults = searchQuery.trim()
    ? orders.filter((o) =>
        o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-cream">
        <div className="w-8 h-8 border-[3px] border-green border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Login prompt
  if (needsLogin) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-cream px-5">
        <div className="max-w-sm w-full">
          <div className="mb-6">
            <Logo size={28} />
          </div>
          <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Ops login</div>
          <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1 mb-4">Control room</h1>
          <div className="space-y-3">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@chopdrop.ng" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          {loginError && <p className="text-coral text-[12px] font-semibold mt-2">{loginError}</p>}
          <button type="button" onClick={handleLogin} className="w-full mt-4 bg-coral text-white font-bold py-3 rounded-[10px] text-sm hover:bg-[#d95038] transition-all">Sign in</button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[225px] bg-ink text-white flex-col p-5 z-30">
        <div className="mb-6">
          <Logo size={28} variant="dark" />
        </div>
        <div className="flex items-center gap-2.5 bg-white/[0.08] rounded-[11px] p-3 mb-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <div>
            <small className="text-[#91a49c] text-[9px] uppercase block">Control room</small>
            <strong className="text-[12px]">ChopDrop Ops</strong>
          </div>
        </div>
        <nav className="space-y-1">
          {([
            ["overview", "Overview", "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
            ["meals", "Meals", "M6 7h12l1 14H5L6 7ZM9 9V6a3 3 0 0 1 6 0v3"],
            ["menu", "Daily Menu", "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6"],
            ["restaurants", "Restaurants", "M4 3v7a3 3 0 0 0 6 0V3M7 3v18M16 3v18M16 3c4 2 4 8 0 10"],
            ["offices", "Offices", "M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3"],
          ] as const).map(([id, label, path]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id as OpsTab)}
              className={`w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-bold text-left transition-colors ${
                tab === id ? "bg-lime/[0.12] text-lime" : "text-[#aebcb7] hover:bg-white/[0.05]"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 text-[#aebcb7] rounded-[10px] px-3 py-2.5 text-[13px] hover:bg-white/[0.05] cursor-pointer transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
          Sign out
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-[225px] px-5 md:px-10 py-8 pb-20 max-w-6xl">

        {/* Mobile tab switcher */}
        <div className="flex gap-2 mb-5 md:hidden overflow-x-auto hide-scrollbar">
          {(["overview", "meals", "menu", "restaurants", "offices"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize flex-shrink-0 transition-colors ${tab === t ? "bg-ink text-white" : "bg-paper border border-line text-ink-soft"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (<>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Ikeja launch zone</div>
            <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Lunch control room</h1>
            <p className="text-ink-soft text-[13px] mt-1">Live oversight for today&apos;s aggregated office drops.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="border border-line bg-paper font-bold px-4 py-2.5 rounded-[10px] text-sm inline-flex items-center gap-2 hover:bg-cream transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
              </svg>
              Find order
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="mb-5 bg-paper border border-line rounded-[13px] p-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order code or customer name..."
              autoFocus
              className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30 mb-3"
            />
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 border border-line rounded-[10px] p-3">
                    <strong className="text-coral font-display text-[13px]">{o.orderCode}</strong>
                    <span className="text-[12px] flex-1">{o.customerName}</span>
                    <span className="text-[11px] text-ink-soft">{o.dailyMenu.meal.name}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      o.status === "COMPLETED" ? "bg-green-soft text-green" :
                      o.status === "READY" ? "bg-amber-soft text-[#7d5716]" :
                      "bg-cream text-ink-soft"
                    }`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-ink-soft text-sm text-center py-2">No orders found.</p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-paper border border-line rounded-[13px] p-4 border-t-[3px] border-t-green">
            <span className="text-ink-soft text-[10px] font-bold block">Gross order value</span>
            <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{formatNaira(totalRevenue)}</strong>
            <small className="text-ink-soft text-[9px]">100% prepaid</small>
          </div>
          <div className="bg-paper border border-line rounded-[13px] p-4">
            <span className="text-ink-soft text-[10px] font-bold block">Prepaid orders</span>
            <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{orders.length}</strong>
            <small className="text-ink-soft text-[9px]">{totalBoxes} boxes total</small>
          </div>
          <div className="bg-paper border border-line rounded-[13px] p-4">
            <span className="text-ink-soft text-[10px] font-bold block">Restaurants</span>
            <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{readiness.length}</strong>
            <small className="text-ink-soft text-[9px]">Active today</small>
          </div>
          <div className="bg-paper border border-line rounded-[13px] p-4">
            <span className="text-ink-soft text-[10px] font-bold block">Fulfillment</span>
            <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{completedCount} / {orders.length}</strong>
            <small className="text-ink-soft text-[9px]">{confirmedCount} pending, {readyCount} ready</small>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.5fr_0.8fr] gap-4 mb-4">
          {/* Orders table */}
          <div className="bg-paper border border-line rounded-[15px] p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-display font-bold text-[17px]">Today&apos;s orders</div>
                <span className="text-ink-soft text-[10px]">All paid orders with status</span>
              </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1.5fr_0.8fr_0.5fr_0.7fr] gap-2 text-ink-soft text-[9px] font-extrabold uppercase tracking-[0.08em] pb-2 border-b border-line">
              <span>Customer</span>
              <span>Meal</span>
              <span>Code</span>
              <span>Status</span>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-ink-soft text-sm">No orders today.</div>
            ) : (
              orders.slice(0, 15).map((order) => (
                <div key={order.id} className="grid grid-cols-[1.5fr_0.8fr_0.5fr_0.7fr] gap-2 items-center min-h-[50px] border-b border-line text-[11px]">
                  <span className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-green-soft text-green rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
                      </svg>
                    </div>
                    <strong>{order.customerName}</strong>
                  </span>
                  <span className="text-ink-soft truncate">{order.dailyMenu.meal.name}</span>
                  <strong className="text-coral font-display">{order.orderCode}</strong>
                  <span>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded-full ${
                      order.status === "COMPLETED" ? "bg-green-soft text-green" :
                      order.status === "READY" ? "bg-amber-soft text-[#7d5716]" :
                      order.status === "CANCELLED" ? "bg-red-soft text-coral" :
                      "bg-cream text-ink-soft"
                    }`}>{order.status}</span>
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Restaurant readiness */}
          <div className="bg-paper border border-line rounded-[15px] p-5">
            <div className="font-display font-bold text-[17px] mb-1">Restaurant readiness</div>
            <span className="text-ink-soft text-[10px] block mb-4">{readiness.length} launch partner{readiness.length !== 1 ? "s" : ""}</span>

            {readiness.map((r) => (
              <div key={r.name} className="flex items-center gap-3 py-4 border-b border-line last:border-b-0">
                <div className="flex-1">
                  <strong className="text-[11px] block">{r.name}</strong>
                  <span className="text-ink-soft text-[9px]">{r.ready} / {r.total} boxes ready</span>
                </div>
                <div className="w-[70px] h-[6px] bg-cream rounded-full overflow-hidden">
                  <div className="h-full bg-green rounded-full transition-all" style={{ width: `${r.percent}%` }} />
                </div>
                <strong className="text-[10px] w-8 text-right">{r.percent}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Activity strip */}
        <div className="bg-ink text-[#b8c6c1] rounded-xl px-5 py-3.5 flex items-center gap-5 overflow-x-auto hide-scrollbar text-[9px]">
          <div className="flex items-center gap-2 text-white flex-shrink-0">
            <span className="w-[7px] h-[7px] bg-lime rounded-full shadow-[0_0_0_5px_rgba(223,242,77,0.13)]" />
            <strong>Live activity</strong>
          </div>
          {recentOrders.map((o) => (
            <span key={o.id} className="flex-shrink-0">
              <b className="text-lime mr-1">
                {new Date(o.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </b>
              {o.customerName} ordered {o.dailyMenu.meal.name}
            </span>
          ))}
          {recentOrders.length === 0 && <span>No activity yet today</span>}
        </div>
        </>)}

        {/* Restaurants Tab */}
        {tab === "restaurants" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Partner management</div>
                <h2 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Restaurants</h2>
              </div>
              <button type="button" onClick={() => setShowRestForm(!showRestForm)} className="bg-coral text-white font-bold px-4 py-2.5 rounded-[10px] text-sm inline-flex items-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                Add restaurant
              </button>
            </div>

            {showRestForm && (
              <div className="bg-paper border border-line rounded-[15px] p-5 mb-5">
                <div className="font-display font-bold text-[17px] mb-4">New restaurant</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Name</label>
                    <input type="text" value={restName} onChange={(e) => setRestName(e.target.value)} placeholder="Kulture Kitchen" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Address</label>
                    <input type="text" value={restAddress} onChange={(e) => setRestAddress(e.target.value)} placeholder="15 Allen Avenue, Ikeja" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Phone</label>
                    <input type="tel" value={restPhone} onChange={(e) => setRestPhone(e.target.value)} placeholder="08012345678" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={addRestaurant} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Save</button>
                  <button type="button" onClick={() => setShowRestForm(false)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {restaurants.map((r) => (
                <div key={r.id} className="bg-paper border border-line rounded-[15px] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-soft text-green rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M16 3v18M16 3c4 2 4 8 0 10" /></svg>
                  </div>
                  <div className="flex-1">
                    <strong className="text-[14px] block">{r.name}</strong>
                    <span className="text-ink-soft text-[11px]">{r.address} &middot; {r.phone}</span>
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${r.isActive ? "bg-green-soft text-green" : "bg-cream text-ink-soft"}`}>
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
              {restaurants.length === 0 && (
                <div className="text-center py-12 text-ink-soft text-sm">No restaurants yet. Click &quot;Add restaurant&quot; to onboard your first partner.</div>
              )}
            </div>
          </>
        )}

        {/* Meals Tab */}
        {tab === "meals" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Meal management</div>
                <h2 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Meals</h2>
              </div>
              <button type="button" onClick={() => setShowMealForm(!showMealForm)} className="bg-coral text-white font-bold px-4 py-2.5 rounded-[10px] text-sm inline-flex items-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                Add meal
              </button>
            </div>

            {showMealForm && (
              <div className="bg-paper border border-line rounded-[15px] p-5 mb-5">
                <div className="font-display font-bold text-[17px] mb-4">New meal</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Meal name</label>
                    <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Smoky party jollof" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Restaurant</label>
                    <select value={mealRestId} onChange={(e) => setMealRestId(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                      <option value="">Select restaurant</option>
                      {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Price (₦)</label>
                    <input type="number" value={mealPrice} onChange={(e) => setMealPrice(e.target.value)} placeholder="2500" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Tag</label>
                    <select value={mealTag} onChange={(e) => setMealTag(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                      <option value="REGULAR">Regular</option>
                      <option value="DEAL">Deal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Type</label>
                    <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                      <option value="FIXED">Fixed Combo</option>
                      <option value="BUILD_YOUR_PLATE">Build Your Plate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Description <span className="font-normal text-ink-soft">(optional)</span></label>
                    <input type="text" value={mealDesc} onChange={(e) => setMealDesc(e.target.value)} placeholder="Grilled chicken, plantain & slaw" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-[12px] font-bold mb-1.5">Image URL <span className="font-normal text-ink-soft">(optional)</span></label>
                    <input type="url" value={mealImage} onChange={(e) => setMealImage(e.target.value)} placeholder="https://images.unsplash.com/photo-..." className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                    {mealImage && <img src={mealImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover mt-2 border border-line" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={addMeal} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Save meal</button>
                  <button type="button" onClick={() => setShowMealForm(false)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {meals.map((m) => (
                <div key={m.id} className={`bg-paper border border-line rounded-[15px] p-4 flex items-center gap-4 ${!m.isAvailable ? "opacity-50" : ""}`}>
                  <div className="w-10 h-10 bg-amber-soft text-[#7d5716] rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg">
                    🍽️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-[14px]">{m.name}</strong>
                      {m.tag === "DEAL" && <span className="bg-coral/10 text-coral text-[9px] font-extrabold px-2 py-0.5 rounded-full">Deal</span>}
                      {m.type === "BUILD_YOUR_PLATE" && <span className="bg-green-soft text-green text-[9px] font-extrabold px-2 py-0.5 rounded-full">Build-a-plate</span>}
                    </div>
                    <span className="text-ink-soft text-[11px]">{m.restaurant.name} &middot; {formatNaira(m.price)}</span>
                  </div>
                  <button type="button" onClick={() => toggleMealAvailability(m.id, m.isAvailable)} className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full transition-colors ${m.isAvailable ? "bg-green-soft text-green hover:bg-red-soft hover:text-coral" : "bg-cream text-ink-soft hover:bg-green-soft hover:text-green"}`}>
                    {m.isAvailable ? "Active" : "Disabled"}
                  </button>
                </div>
              ))}
              {meals.length === 0 && (
                <div className="text-center py-12 text-ink-soft text-sm">No meals yet. Add a restaurant first, then create meals.</div>
              )}
            </div>
          </>
        )}

        {/* Daily Menu Tab */}
        {tab === "menu" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Daily menu</div>
                <h2 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Today&apos;s Menu</h2>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={async () => { const res = await fetch("/api/admin/daily-menu/auto-publish", { method: "POST" }); const data = await res.json(); if (data.success) loadAll(); }} className="border border-line bg-paper font-bold px-3 py-2.5 rounded-[10px] text-[11px] hover:bg-cream transition-colors">
                  Repeat yesterday
                </button>
                <button type="button" onClick={() => setShowMenuForm(!showMenuForm)} className="bg-coral text-white font-bold px-4 py-2.5 rounded-[10px] text-sm inline-flex items-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                  Add to menu
                </button>
              </div>
            </div>

            {/* Date picker */}
            <div className="mb-5">
              <label className="block text-[12px] font-bold mb-1.5">Date</label>
              <input type="date" value={menuDate} onChange={(e) => setMenuDate(e.target.value)} className="px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" />
            </div>

            {showMenuForm && (
              <div className="bg-paper border border-line rounded-[15px] p-5 mb-5">
                <div className="font-display font-bold text-[17px] mb-4">Add meal to today&apos;s menu</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Meal</label>
                    <select value={menuMealId} onChange={(e) => setMenuMealId(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                      <option value="">Select meal</option>
                      {meals.filter((m) => m.isAvailable).map((m) => <option key={m.id} value={m.id}>{m.name} ({m.restaurant.name})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Time slot</label>
                    {timeSlots.length > 0 ? (
                      <select value={menuSlotId} onChange={(e) => setMenuSlotId(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                        <option value="">Select slot</option>
                        {timeSlots.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.startTime}–{s.endTime})</option>)}
                      </select>
                    ) : (
                      <p className="text-ink-soft text-[11px] py-2">No time slots available. Seed data first.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Max orders</label>
                    <input type="number" value={menuMaxOrders} onChange={(e) => setMenuMaxOrders(e.target.value)} min="1" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={addToMenu} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Publish</button>
                  <button type="button" onClick={() => setShowMenuForm(false)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {dailyMenus.length === 0 ? (
              <div className="text-center py-12 text-ink-soft text-sm">No meals on the menu for this date. Click &quot;Add to menu&quot; to assign meals.</div>
            ) : (
              <div className="space-y-3">
                {dailyMenus.map((dm) => (
                  <div key={dm.id} className="bg-paper border border-line rounded-[15px] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-soft text-green rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg">
                      🍽️
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-[14px] block">{dm.meal.name}</strong>
                      <span className="text-ink-soft text-[11px]">
                        {dm.meal.restaurant.name} &middot; {formatNaira(dm.meal.price)} &middot; {dm.timeSlot.startTime}–{dm.timeSlot.endTime}
                      </span>
                      <div className="text-[10px] mt-1">
                        <strong>{dm.currentOrders}</strong> / {dm.maxOrders} orders
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromMenu(dm.id)} className="bg-red-soft text-coral text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full hover:bg-coral hover:text-white transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Offices Tab */}
        {tab === "offices" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Office management</div>
                <h2 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Offices</h2>
              </div>
              <button type="button" onClick={() => setShowOfficeForm(!showOfficeForm)} className="bg-coral text-white font-bold px-4 py-2.5 rounded-[10px] text-sm inline-flex items-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                Add office
              </button>
            </div>

            {showOfficeForm && (
              <div className="bg-paper border border-line rounded-[15px] p-5 mb-5">
                <div className="font-display font-bold text-[17px] mb-4">New office</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Office name</label>
                    <input type="text" value={offName} onChange={(e) => setOffName(e.target.value)} placeholder="Northcourt" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Address</label>
                    <input type="text" value={offAddress} onChange={(e) => setOffAddress(e.target.value)} placeholder="8th floor, Alausa, Ikeja" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Collection point</label>
                    <input type="text" value={offCollection} onChange={(e) => setOffCollection(e.target.value)} placeholder="Main reception desk" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Assistant name <span className="font-normal text-ink-soft">(optional)</span></label>
                    <input type="text" value={offAssistant} onChange={(e) => setOffAssistant(e.target.value)} placeholder="Dami Ogunleye" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Assistant phone <span className="font-normal text-ink-soft">(optional)</span></label>
                    <input type="tel" value={offAssistantPhone} onChange={(e) => setOffAssistantPhone(e.target.value)} placeholder="08034567890" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                </div>
                <p className="text-ink-soft text-[10px] mt-3">An office code will be generated automatically. Share it with workers to connect them.</p>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={addOffice} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Create office</button>
                  <button type="button" onClick={() => setShowOfficeForm(false)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {offices.map((o) => (
                <div key={o.id} className="bg-paper border border-line rounded-[15px] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-soft text-green rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-[14px]">{o.name}</strong>
                      <span className="bg-amber-soft text-[#7d5716] text-[9px] font-extrabold px-2 py-0.5 rounded-full">{o.code}</span>
                    </div>
                    <span className="text-ink-soft text-[11px] block mt-0.5">{o.address}</span>
                    <span className="text-ink-soft text-[10px] block">
                      {o.assistantName ? `Assistant: ${o.assistantName}` : "No assistant"} &middot; {o.collectionPoint} &middot; {o._count.orders} orders
                    </span>
                    {o.slug && (
                      <span className="text-[9px] text-green block mt-1 break-all">
                        Magic link: /captain/{o.slug}{o.secretToken ? `?token=${o.secretToken}` : ""}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${o.isActive ? "bg-green-soft text-green" : "bg-cream text-ink-soft"}`}>
                    {o.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
              {offices.length === 0 && (
                <div className="text-center py-12 text-ink-soft text-sm">No offices yet. Click &quot;Add office&quot; to onboard your first location.</div>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
