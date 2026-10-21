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

type OpsTab = "overview" | "restaurants" | "offices" | "meals" | "menu" | "items" | "promos";

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  zoneId: string | null;
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
  zoneId: string | null;
  _count: { orders: number };
}

interface ZoneData {
  id: string;
  name: string;
  areas: string;
  isActive: boolean;
  _count: { restaurants: number; offices: number };
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
  const [meals, setMeals] = useState<{ id: string; name: string; price: number; tag: string; type: string; isAvailable: boolean; imageUrl: string | null; description: string | null; originalPrice: number | null; maxDeals: number; claimedPad: number; restaurant: { id: string; name: string } }[]>([]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealPrice, setMealPrice] = useState("");
  const [mealRestId, setMealRestId] = useState("");
  const [mealTag, setMealTag] = useState("REGULAR");
  const [mealType, setMealType] = useState("FIXED");
  const [mealDesc, setMealDesc] = useState("");
  const [mealImage, setMealImage] = useState("");
  const [mealOriginalPrice, setMealOriginalPrice] = useState("");
  const [mealMaxDeals, setMealMaxDeals] = useState("20");
  const [mealClaimedPad, setMealClaimedPad] = useState("0");
  const [uploading, setUploading] = useState(false);

  // Daily menu
  const [dailyMenus, setDailyMenus] = useState<{ id: string; maxOrders: number; currentOrders: number; meal: { name: string; price: number; tag: string; type: string; imageUrl: string | null; restaurant: { name: string } }; timeSlot: { id: string; label: string; startTime: string; endTime: string } }[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ id: string; label: string; startTime: string; endTime: string }[]>([]);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuMealId, setMenuMealId] = useState("");
  const [menuSlotId, setMenuSlotId] = useState("");
  const [menuMaxOrders, setMenuMaxOrders] = useState("30");
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split("T")[0]);

  // Menu Items tab state
  const [menuRestaurantId, setMenuRestaurantId] = useState("");
  const [menuCategories, setMenuCategories] = useState<Array<{
    id: string; name: string; selectionRule: string; sortOrder: number;
    items: Array<{ id: string; name: string; price: number; sortOrder: number }>;
  }>>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemImage, setEditItemImage] = useState("");
  const [editItemUploading, setEditItemUploading] = useState(false);
  const [newItemImage, setNewItemImage] = useState("");
  const [newItemUploading, setNewItemUploading] = useState(false);
  const [newItemCategoryId, setNewItemCategoryId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryRule, setNewCategoryRule] = useState("PICK_ONE");

  // Restaurant editing
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [editRestName, setEditRestName] = useState("");
  const [editRestAddress, setEditRestAddress] = useState("");
  const [editRestPhone, setEditRestPhone] = useState("");
  const [editRestImage, setEditRestImage] = useState("");
  const [editRestActive, setEditRestActive] = useState(true);
  const [uploadingRestImage, setUploadingRestImage] = useState(false);

  // Office editing
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null);
  const [editOffName, setEditOffName] = useState("");
  const [editOffAddress, setEditOffAddress] = useState("");
  const [editOffCollection, setEditOffCollection] = useState("");
  const [editOffAssistant, setEditOffAssistant] = useState("");
  const [editOffAssistantPhone, setEditOffAssistantPhone] = useState("");
  const [editOffActive, setEditOffActive] = useState(true);

  // Office details view
  const [viewingOfficeId, setViewingOfficeId] = useState<string | null>(null);
  const [officeDetails, setOfficeDetails] = useState<{
    office: { id: string; name: string; code: string; address: string; collectionPoint: string; assistantName: string | null; assistantPhone: string | null; assistantEmail: string | null };
    stats: { totalMembers: number; totalOrders: number; totalRevenue: number; totalTips: number; totalServiceFees: number; todayOrders: number; todayTips: number };
    members: Array<{ id: string; name: string; email: string; phone: string; joinedAt: string; orderCount: number; totalSpent: number; lastOrder: string | null }>;
  } | null>(null);
  const [officeDetailsLoading, setOfficeDetailsLoading] = useState(false);

  // Meal editing
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealName, setEditMealName] = useState("");
  const [editMealPrice, setEditMealPrice] = useState("");
  const [editMealDesc, setEditMealDesc] = useState("");
  const [editMealImage, setEditMealImage] = useState("");
  const [editMealTag, setEditMealTag] = useState("REGULAR");
  const [editMealType, setEditMealType] = useState("FIXED");
  const [editMealOriginalPrice, setEditMealOriginalPrice] = useState("");
  const [editMealMaxDeals, setEditMealMaxDeals] = useState("20");
  const [editMealClaimedPad, setEditMealClaimedPad] = useState("0");
  const [editMealAvailable, setEditMealAvailable] = useState(true);
  const [uploadingEditMealImage, setUploadingEditMealImage] = useState(false);

  // Zone management
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string>("all");
  const [activeDropFilter, setActiveDropFilter] = useState<string>("all");
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneAreas, setNewZoneAreas] = useState("");
  const [offZoneId, setOffZoneId] = useState("");

  // Promo management
  interface PromoData {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    minOrders: number;
    rewardAmount: number;
    rewardType: string;
    cutoffTime: string | null;
    maxUses: number;
    startDate: string | null;
    endDate: string | null;
    officeOnly: boolean;
    description: string | null;
  }
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoName, setPromoName] = useState("");
  const [promoType, setPromoType] = useState("GROUP_CASHBACK");
  const [promoRewardAmount, setPromoRewardAmount] = useState("");
  const [promoRewardType, setPromoRewardType] = useState("CASHBACK");
  const [promoMinOrders, setPromoMinOrders] = useState("5");
  const [promoCutoffTime, setPromoCutoffTime] = useState("");
  const [promoMaxUses, setPromoMaxUses] = useState("0");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoOfficeOnly, setPromoOfficeOnly] = useState(true);
  const [promoDescription, setPromoDescription] = useState("");
  const [promoImageUrl, setPromoImageUrl] = useState("");

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
        fetch("/api/admin/zones").then((r) => r.json()),
        fetch("/api/admin/promos").then((r) => r.json()).catch(() => ({ success: true, data: [] })),
      ]).then(([ordersData, restD, offData, mealsData, dmData, slotsData, zoneData, promoData]) => {
        if (ordersData.success) setOrders(ordersData.data.filter((o: OrderData) => o.paymentStatus === "SUCCESS"));
        if (restD.success) setRestaurants(restD.data);
        if (offData.success) setOffices(offData.data);
        if (mealsData.success) setMeals(mealsData.data);
        if (dmData.success) setDailyMenus(dmData.data);
        if (slotsData.success) {
          setTimeSlots(slotsData.data);
          if (slotsData.data.length > 0 && !menuSlotId) setMenuSlotId(slotsData.data[0].id);
        }
        if (promoData?.success) setPromos(promoData.data);
        if (zoneData.success) setZones(zoneData.data);
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadMenuItems(); }, [menuRestaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function startEditRestaurant(r: RestaurantData & { imageUrl?: string }) {
    setEditingRestaurantId(r.id);
    setEditRestName(r.name);
    setEditRestAddress(r.address);
    setEditRestPhone(r.phone);
    setEditRestImage((r as { imageUrl?: string }).imageUrl || "");
    setEditRestActive(r.isActive);
  }

  async function saveRestaurant() {
    if (!editingRestaurantId || !editRestName.trim()) return;
    await fetch(`/api/admin/restaurants/${editingRestaurantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editRestName.trim(),
        address: editRestAddress.trim(),
        phone: editRestPhone.trim(),
        imageUrl: editRestImage.trim() || null,
        isActive: editRestActive,
      }),
    });
    setEditingRestaurantId(null);
    loadAll();
  }

  async function handleRestImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRestImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chopdrop");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setEditRestImage(data.url);
      else alert("Upload failed: " + (data.error || "Unknown error"));
    } finally {
      setUploadingRestImage(false);
    }
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
        zoneId: offZoneId || null,
      }),
    });
    setOffName(""); setOffAddress(""); setOffCollection("Main reception"); setOffAssistant(""); setOffAssistantPhone(""); setOffZoneId(""); setShowOfficeForm(false);
    loadAll();
  }

  async function loadOfficeDetails(officeId: string) {
    setViewingOfficeId(officeId);
    setOfficeDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/offices/${officeId}/details`);
      const data = await res.json();
      if (data.success) setOfficeDetails(data.data);
    } catch { /* ignore */ }
    setOfficeDetailsLoading(false);
  }

  function startEditOffice(o: OfficeDataItem) {
    setEditingOfficeId(o.id);
    setEditOffName(o.name);
    setEditOffAddress(o.address);
    setEditOffCollection(o.collectionPoint);
    setEditOffAssistant(o.assistantName || "");
    setEditOffAssistantPhone(o.assistantPhone || "");
    setEditOffActive(o.isActive);
  }

  async function saveOffice() {
    if (!editingOfficeId || !editOffName.trim()) return;
    await fetch(`/api/admin/offices/${editingOfficeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editOffName.trim(),
        address: editOffAddress.trim(),
        collectionPoint: editOffCollection.trim(),
        assistantName: editOffAssistant.trim() || null,
        assistantPhone: editOffAssistantPhone.trim() || null,
        isActive: editOffActive,
      }),
    });
    setEditingOfficeId(null);
    loadAll();
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chopdrop");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) return data.url;
      alert("Upload failed: " + (data.error || "Unknown error"));
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setMealImage(url);
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
        originalPrice: mealOriginalPrice ? Math.round(parseFloat(mealOriginalPrice) * 100) : undefined,
        maxDeals: isNaN(parseInt(mealMaxDeals)) ? 20 : parseInt(mealMaxDeals),
        claimedPad: parseInt(mealClaimedPad) || 0,
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

  function startEditMeal(m: typeof meals[0]) {
    setEditingMealId(m.id);
    setEditMealName(m.name);
    setEditMealPrice(String(m.price / 100));
    setEditMealDesc((m as { description?: string }).description || "");
    setEditMealImage(m.imageUrl || "");
    setEditMealTag(m.tag);
    setEditMealType(m.type);
    setEditMealOriginalPrice((m as { originalPrice?: number }).originalPrice ? String((m as { originalPrice?: number }).originalPrice! / 100) : "");
    setEditMealMaxDeals(String((m as { maxDeals?: number }).maxDeals ?? 20));
    setEditMealClaimedPad(String((m as { claimedPad?: number }).claimedPad ?? 0));
    setEditMealAvailable(m.isAvailable);
  }

  async function saveMeal() {
    if (!editingMealId || !editMealName.trim() || !editMealPrice) return;
    await fetch(`/api/admin/meals/${editingMealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editMealName.trim(),
        price: Math.round(parseFloat(editMealPrice) * 100),
        description: editMealDesc.trim() || undefined,
        imageUrl: editMealImage.trim() || undefined,
        tag: editMealTag,
        type: editMealType,
        originalPrice: editMealOriginalPrice ? Math.round(parseFloat(editMealOriginalPrice) * 100) : undefined,
        maxDeals: isNaN(parseInt(editMealMaxDeals)) ? 20 : parseInt(editMealMaxDeals),
        claimedPad: parseInt(editMealClaimedPad) || 0,
        isAvailable: editMealAvailable,
      }),
    });
    setEditingMealId(null);
    loadAll();
  }

  async function handleEditMealImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditMealImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chopdrop");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setEditMealImage(data.url);
      else alert("Upload failed: " + (data.error || "Unknown error"));
    } finally {
      setUploadingEditMealImage(false);
    }
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

  // Menu Items CRUD
  async function loadMenuItems() {
    if (!menuRestaurantId) { setMenuCategories([]); return; }
    setMenuLoading(true);
    const res = await fetch(`/api/admin/menu-items?restaurantId=${menuRestaurantId}`);
    const data = await res.json();
    if (data.success && data.data) setMenuCategories(data.data.menuCategories || []);
    setMenuLoading(false);
  }

  async function uploadItemImage(file: File, setter: (url: string) => void, setUploading: (v: boolean) => void) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chopdrop/items");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setter(data.url);
    } catch { /* ignore */ }
    setUploading(false);
  }

  async function saveEditItem(itemId: string) {
    if (!editItemName.trim() || !editItemPrice) return;
    await fetch(`/api/admin/menu-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editItemName.trim(), price: Math.round(parseFloat(editItemPrice) * 100), imageUrl: editItemImage.trim() || null }),
    });
    setEditingItemId(null);
    loadMenuItems();
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/admin/menu-items/${itemId}`, { method: "DELETE" });
    loadMenuItems();
  }

  async function addItem(categoryId: string) {
    if (!newItemName.trim() || !newItemPrice) return;
    await fetch("/api/admin/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name: newItemName.trim(), price: Math.round(parseFloat(newItemPrice) * 100), imageUrl: newItemImage.trim() || null }),
    });
    setNewItemCategoryId(null);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemImage("");
    loadMenuItems();
  }

  async function addCategory() {
    if (!newCategoryName.trim() || !menuRestaurantId) return;
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: menuRestaurantId, name: newCategoryName.trim(), selectionRule: newCategoryRule, sortOrder: menuCategories.length }),
    });
    setShowAddCategory(false);
    setNewCategoryName("");
    setNewCategoryRule("PICK_ONE");
    loadMenuItems();
  }

  async function deleteCategory(categoryId: string) {
    if (!confirm("Delete this category and all its items?")) return;
    await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
    loadMenuItems();
  }

  // Promo functions
  function resetPromoForm() {
    setPromoName("");
    setPromoType("GROUP_CASHBACK");
    setPromoRewardAmount("");
    setPromoRewardType("CASHBACK");
    setPromoMinOrders("5");
    setPromoCutoffTime("");
    setPromoMaxUses("0");
    setPromoStartDate("");
    setPromoEndDate("");
    setPromoOfficeOnly(true);
    setPromoDescription("");
    setPromoImageUrl("");
    setEditingPromoId(null);
    setShowPromoForm(false);
  }

  function startEditPromo(p: PromoData) {
    setEditingPromoId(p.id);
    setPromoName(p.name);
    setPromoType(p.type);
    setPromoRewardAmount(String(p.rewardAmount / 100));
    setPromoRewardType(p.rewardType);
    setPromoMinOrders(String(p.minOrders));
    setPromoCutoffTime(p.cutoffTime || "");
    setPromoMaxUses(String(p.maxUses));
    setPromoStartDate(p.startDate ? p.startDate.split("T")[0] : "");
    setPromoEndDate(p.endDate ? p.endDate.split("T")[0] : "");
    setPromoOfficeOnly(p.officeOnly);
    setPromoDescription(p.description || "");
    setPromoImageUrl((p as { imageUrl?: string }).imageUrl || "");
    setShowPromoForm(true);
  }

  async function savePromo() {
    if (!promoName.trim()) return;
    const payload = {
      name: promoName.trim(),
      type: promoType,
      rewardAmount: Math.round(parseFloat(promoRewardAmount || "0") * 100),
      rewardType: promoRewardType,
      minOrders: parseInt(promoMinOrders) || 5,
      cutoffTime: promoCutoffTime || null,
      maxUses: parseInt(promoMaxUses) || 0,
      startDate: promoStartDate || null,
      endDate: promoEndDate || null,
      officeOnly: promoOfficeOnly,
      description: promoDescription.trim() || null,
      imageUrl: promoImageUrl.trim() || null,
    };

    if (editingPromoId) {
      await fetch(`/api/admin/promos/${editingPromoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetPromoForm();
    loadAll();
  }

  async function togglePromo(id: string, currentActive: boolean) {
    await fetch(`/api/admin/promos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    loadAll();
  }

  async function deletePromo(id: string) {
    if (!confirm("Delete this promo?")) return;
    await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
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

  // Filter by active zone
  const filteredRestaurants = activeZoneId === "all" ? restaurants : restaurants.filter((r) => r.zoneId === activeZoneId);
  const filteredOffices = activeZoneId === "all" ? offices : offices.filter((o) => o.zoneId === activeZoneId);

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
            ["items", "Menu Items", "M4 6h16M4 10h16M4 14h8M4 18h8"],
            ["promos", "Promos", "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"],
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
          {(["overview", "meals", "menu", "restaurants", "offices", "items", "promos"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize flex-shrink-0 transition-colors ${tab === t ? "bg-ink text-white" : "bg-paper border border-line text-ink-soft"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Zone filter */}
        {zones.length > 0 && (
          <div className="flex items-center gap-2 mb-5 overflow-x-auto hide-scrollbar">
            <span className="text-[10px] font-bold text-ink-soft uppercase tracking-[0.06em] flex-shrink-0">Zone:</span>
            <button type="button" onClick={() => setActiveZoneId("all")} className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 transition-colors ${activeZoneId === "all" ? "bg-green text-white" : "bg-cream text-ink-soft hover:bg-line"}`}>All zones</button>
            {zones.map((z) => (
              <button key={z.id} type="button" onClick={() => setActiveZoneId(z.id)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 transition-colors ${activeZoneId === z.id ? "bg-green text-white" : "bg-cream text-ink-soft hover:bg-line"}`}>
                {z.name} <span className="ml-1 text-[9px] opacity-70">{z._count.restaurants}R · {z._count.offices}O</span>
              </button>
            ))}
            <button type="button" onClick={() => setShowZoneForm(true)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold text-green bg-green-soft hover:bg-green/20 flex-shrink-0 transition-colors">+ Add zone</button>
          </div>
        )}

        {/* New zone form */}
        {showZoneForm && (
          <div className="bg-paper border border-line rounded-[15px] p-5 mb-5">
            <div className="font-display font-bold text-[17px] mb-4">New zone</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold mb-1.5">Zone name</label>
                <input type="text" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="e.g. Victoria Island" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1.5">Areas covered</label>
                <input type="text" value={newZoneAreas} onChange={(e) => setNewZoneAreas(e.target.value)} placeholder="Lekki, Ikoyi, Oniru" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={async () => {
                if (!newZoneName.trim()) return;
                await fetch("/api/admin/zones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newZoneName.trim(), areas: newZoneAreas.trim() }) });
                setNewZoneName(""); setNewZoneAreas(""); setShowZoneForm(false);
                loadAll();
              }} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Create zone</button>
              <button type="button" onClick={() => setShowZoneForm(false)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {zones.length === 0 && !showZoneForm && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setShowZoneForm(true)}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold text-green bg-green-soft hover:bg-green/20 transition-colors"
            >
              + Add first zone
            </button>
          </div>
        )}

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
              {filteredRestaurants.map((r) => (
                <div key={r.id} className="bg-paper border border-line rounded-[16px] overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
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
                    <button
                      type="button"
                      onClick={() => editingRestaurantId === r.id ? setEditingRestaurantId(null) : startEditRestaurant(r)}
                      className="text-[10px] font-bold text-green hover:underline ml-1"
                    >
                      {editingRestaurantId === r.id ? "Close" : "Edit"}
                    </button>
                  </div>
                  {editingRestaurantId === r.id && (
                    <div className="border-t border-line p-4 bg-cream/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Name</label>
                          <input type="text" value={editRestName} onChange={(e) => setEditRestName(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Address</label>
                          <input type="text" value={editRestAddress} onChange={(e) => setEditRestAddress(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Phone</label>
                          <input type="tel" value={editRestPhone} onChange={(e) => setEditRestPhone(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Status</label>
                          <select value={editRestActive ? "active" : "inactive"} onChange={(e) => setEditRestActive(e.target.value === "active")} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="col-span-full">
                          <label className="block text-[12px] font-bold mb-1.5">Image <span className="font-normal text-ink-soft">(optional)</span></label>
                          <div className="flex items-center gap-3">
                            <label className={`px-4 py-2.5 border border-line rounded-[10px] text-sm cursor-pointer transition-colors ${uploadingRestImage ? "bg-line text-ink-soft" : "bg-cream/50 hover:bg-cream text-ink"}`}>
                              {uploadingRestImage ? "Uploading..." : editRestImage ? "Change image" : "Choose image"}
                              <input type="file" accept="image/*" onChange={handleRestImageFile} disabled={uploadingRestImage} className="hidden" />
                            </label>
                            {editRestImage && (
                              <button type="button" onClick={() => setEditRestImage("")} className="text-ink-soft text-xs hover:text-coral">Remove</button>
                            )}
                          </div>
                          {editRestImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={editRestImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover mt-2 border border-line" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button type="button" onClick={saveRestaurant} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Save</button>
                        <button type="button" onClick={() => setEditingRestaurantId(null)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredRestaurants.length === 0 && (
                <div className="text-center py-12 text-ink-soft text-sm">
                  {activeZoneId === "all" ? "No restaurants yet. Click \"Add restaurant\" to onboard your first partner." : "No restaurants in this zone."}
                </div>
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
                      <option value="DEAL">Deal (discount combo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Type</label>
                    <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                      <option value="FIXED">Fixed Combo</option>
                      <option value="BUILD_YOUR_PLATE">Build Your Plate</option>
                    </select>
                  </div>
                  {mealTag === "DEAL" && (
                    <>
                      <div>
                        <label className="block text-[12px] font-bold mb-1.5">Original price (₦) <span className="font-normal text-ink-soft">strikethrough</span></label>
                        <input type="number" value={mealOriginalPrice} onChange={(e) => setMealOriginalPrice(e.target.value)} placeholder="e.g. 2500 (before discount)" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold mb-1.5">Max discount spots</label>
                        <input type="number" value={mealMaxDeals} onChange={(e) => setMealMaxDeals(e.target.value)} placeholder="20" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold mb-1.5">Claimed padding <span className="font-normal text-ink-soft">fake boost</span></label>
                        <input type="number" value={mealClaimedPad} onChange={(e) => setMealClaimedPad(e.target.value)} placeholder="0" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Description <span className="font-normal text-ink-soft">(optional)</span></label>
                    <input type="text" value={mealDesc} onChange={(e) => setMealDesc(e.target.value)} placeholder="Grilled chicken, plantain & slaw" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-[12px] font-bold mb-1.5">Image <span className="font-normal text-ink-soft">(optional)</span></label>
                    <div className="flex items-center gap-3">
                      <label className={`px-4 py-2.5 border border-line rounded-[10px] text-sm cursor-pointer transition-colors ${uploading ? "bg-line text-ink-soft" : "bg-cream/50 hover:bg-cream text-ink"}`}>
                        {uploading ? "Uploading..." : mealImage ? "Change image" : "Choose image"}
                        <input type="file" accept="image/*" onChange={handleImageFile} disabled={uploading} className="hidden" />
                      </label>
                      {mealImage && (
                        <button type="button" onClick={() => setMealImage("")} className="text-ink-soft text-xs hover:text-coral">Remove</button>
                      )}
                    </div>
                    {mealImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mealImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover mt-2 border border-line" />
                    )}
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
                <div key={m.id} className={`bg-paper border border-line rounded-[16px] overflow-hidden ${!m.isAvailable && editingMealId !== m.id ? "opacity-50" : ""}`}>
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[10px] overflow-hidden flex-shrink-0">
                      {m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-amber-soft text-[#7d5716] flex items-center justify-center text-lg">🍽️</div>
                      )}
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
                    <button
                      type="button"
                      onClick={() => editingMealId === m.id ? setEditingMealId(null) : startEditMeal(m)}
                      className="text-[10px] font-bold text-green hover:underline ml-1"
                    >
                      {editingMealId === m.id ? "Close" : "Edit"}
                    </button>
                  </div>
                  {editingMealId === m.id && (
                    <div className="border-t border-line p-4 bg-cream/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Meal name</label>
                          <input type="text" value={editMealName} onChange={(e) => setEditMealName(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Price (₦)</label>
                          <input type="number" value={editMealPrice} onChange={(e) => setEditMealPrice(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Tag</label>
                          <select value={editMealTag} onChange={(e) => setEditMealTag(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                            <option value="REGULAR">Regular</option>
                            <option value="DEAL">Deal (discount combo)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Type</label>
                          <select value={editMealType} onChange={(e) => setEditMealType(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                            <option value="FIXED">Fixed Combo</option>
                            <option value="BUILD_YOUR_PLATE">Build Your Plate</option>
                          </select>
                        </div>
                        {editMealTag === "DEAL" && (
                          <>
                            <div>
                              <label className="block text-[12px] font-bold mb-1.5">Original price (₦) <span className="font-normal text-ink-soft">strikethrough</span></label>
                              <input type="number" value={editMealOriginalPrice} onChange={(e) => setEditMealOriginalPrice(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                            </div>
                            <div>
                              <label className="block text-[12px] font-bold mb-1.5">Max discount spots</label>
                              <input type="number" value={editMealMaxDeals} onChange={(e) => setEditMealMaxDeals(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                            </div>
                            <div>
                              <label className="block text-[12px] font-bold mb-1.5">Claimed padding <span className="font-normal text-ink-soft">fake boost</span></label>
                              <input type="number" value={editMealClaimedPad} onChange={(e) => setEditMealClaimedPad(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Description <span className="font-normal text-ink-soft">(optional)</span></label>
                          <input type="text" value={editMealDesc} onChange={(e) => setEditMealDesc(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Available</label>
                          <select value={editMealAvailable ? "yes" : "no"} onChange={(e) => setEditMealAvailable(e.target.value === "yes")} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                            <option value="yes">Available</option>
                            <option value="no">Unavailable</option>
                          </select>
                        </div>
                        <div className="col-span-full">
                          <label className="block text-[12px] font-bold mb-1.5">Image <span className="font-normal text-ink-soft">(optional)</span></label>
                          <div className="flex items-center gap-3">
                            <label className={`px-4 py-2.5 border border-line rounded-[10px] text-sm cursor-pointer transition-colors ${uploadingEditMealImage ? "bg-line text-ink-soft" : "bg-cream/50 hover:bg-cream text-ink"}`}>
                              {uploadingEditMealImage ? "Uploading..." : editMealImage ? "Change image" : "Choose image"}
                              <input type="file" accept="image/*" onChange={handleEditMealImageFile} disabled={uploadingEditMealImage} className="hidden" />
                            </label>
                            {editMealImage && (
                              <button type="button" onClick={() => setEditMealImage("")} className="text-ink-soft text-xs hover:text-coral">Remove</button>
                            )}
                          </div>
                          {editMealImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={editMealImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover mt-2 border border-line" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button type="button" onClick={saveMeal} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Save</button>
                        <button type="button" onClick={() => setEditingMealId(null)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
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
              <div className="text-center py-12 text-ink-soft text-sm">No meals on the menu for this date. Meals auto-publish when restaurants and meals are active.</div>
            ) : (
              <div className="space-y-6">
                {/* Group daily menus by time slot */}
                {(() => {
                  const slotGroups = new Map<string, { label: string; items: typeof dailyMenus }>();
                  for (const dm of dailyMenus) {
                    const key = dm.timeSlot.id;
                    const existing = slotGroups.get(key);
                    if (existing) { existing.items.push(dm); }
                    else { slotGroups.set(key, { label: dm.timeSlot.label, items: [dm] }); }
                  }
                  return Array.from(slotGroups.entries()).map(([slotId, group]) => (
                    <div key={slotId}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[16px]">{group.label.toLowerCase().includes("breakfast") ? "☀️" : "🍛"}</span>
                        <h3 className="font-display font-bold text-[16px]">{group.label.split("(")[0].trim()}</h3>
                        <span className="text-ink-soft text-[11px]">{group.items.length} items</span>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((dm) => (
                          <div key={dm.id} className="bg-paper border border-line rounded-[12px] p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[8px] overflow-hidden flex-shrink-0">
                              {dm.meal.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={dm.meal.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-green-soft text-green flex items-center justify-center text-[12px]">🍽️</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <strong className="text-[13px] block truncate">{dm.meal.name}</strong>
                              <span className="text-ink-soft text-[10px]">
                                {dm.meal.restaurant.name} &middot; {dm.meal.price > 0 ? formatNaira(dm.meal.price) : "Build-a-plate"}
                              </span>
                              <div className="text-[9px] text-ink-soft mt-0.5">
                                <strong className="text-ink">{dm.currentOrders}</strong> / {dm.maxOrders} orders
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {dm.meal.tag === "DEAL" && <span className="bg-coral/10 text-coral text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">Deal</span>}
                              {dm.meal.type === "BUILD_YOUR_PLATE" && <span className="bg-green-soft text-green text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">Restaurant</span>}
                              <button type="button" onClick={() => removeFromMenu(dm.id)} className="text-coral text-[9px] font-bold hover:underline">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
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
                  {zones.length > 0 && (
                    <div>
                      <label className="block text-[12px] font-bold mb-1.5">Zone</label>
                      <select value={offZoneId} onChange={(e) => setOffZoneId(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                        <option value="">No zone</option>
                        {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <p className="text-ink-soft text-[10px] mt-3">An office code will be generated automatically. Share it with workers to connect them.</p>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={addOffice} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Create office</button>
                  <button type="button" onClick={() => setShowOfficeForm(false)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {filteredOffices.map((o) => (
                <div key={o.id} className="bg-paper border border-line rounded-[16px] overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
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
                    <button
                      type="button"
                      onClick={() => loadOfficeDetails(o.id)}
                      className="text-[10px] font-bold text-coral hover:underline ml-1"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => editingOfficeId === o.id ? setEditingOfficeId(null) : startEditOffice(o)}
                      className="text-[10px] font-bold text-green hover:underline ml-1"
                    >
                      {editingOfficeId === o.id ? "Close" : "Edit"}
                    </button>
                  </div>
                  {editingOfficeId === o.id && (
                    <div className="border-t border-line p-4 bg-cream/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Office name</label>
                          <input type="text" value={editOffName} onChange={(e) => setEditOffName(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Address</label>
                          <input type="text" value={editOffAddress} onChange={(e) => setEditOffAddress(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Collection point</label>
                          <input type="text" value={editOffCollection} onChange={(e) => setEditOffCollection(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Status</label>
                          <select value={editOffActive ? "active" : "inactive"} onChange={(e) => setEditOffActive(e.target.value === "active")} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Assistant name <span className="font-normal text-ink-soft">(optional)</span></label>
                          <input type="text" value={editOffAssistant} onChange={(e) => setEditOffAssistant(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold mb-1.5">Assistant phone <span className="font-normal text-ink-soft">(optional)</span></label>
                          <input type="tel" value={editOffAssistantPhone} onChange={(e) => setEditOffAssistantPhone(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button type="button" onClick={saveOffice} className="bg-coral text-white font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Save</button>
                        <button type="button" onClick={() => setEditingOfficeId(null)} className="bg-cream text-ink-soft font-bold px-5 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredOffices.length === 0 && (
                <div className="text-center py-12 text-ink-soft text-sm">
                  {activeZoneId === "all" ? "No offices yet. Click \"Add office\" to onboard your first location." : "No offices in this zone."}
                </div>
              )}
            </div>

            {/* Office Detail Panel */}
            {viewingOfficeId && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" onClick={() => { setViewingOfficeId(null); setOfficeDetails(null); }}>
                <div className="bg-paper rounded-t-[20px] md:rounded-[20px] w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  {officeDetailsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-8 h-8 border-[3px] border-green border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : officeDetails ? (
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-display font-bold text-[20px]">{officeDetails.office.name}</h2>
                          <span className="text-ink-soft text-[11px]">{officeDetails.office.address} &middot; Code: <strong className="text-ink">{officeDetails.office.code}</strong></span>
                        </div>
                        <button type="button" onClick={() => { setViewingOfficeId(null); setOfficeDetails(null); }} className="w-8 h-8 rounded-full bg-cream flex items-center justify-center hover:bg-line">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </div>

                      {/* Captain info */}
                      <div className="bg-green-soft rounded-[12px] p-4 mb-4">
                        <div className="text-[10px] font-bold text-green uppercase tracking-[0.06em] mb-2">ChopDropper / Assistant</div>
                        {officeDetails.office.assistantName ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <strong className="text-[14px] block">{officeDetails.office.assistantName}</strong>
                              <span className="text-ink-soft text-[11px]">{officeDetails.office.assistantPhone || "No phone"}</span>
                            </div>
                            <div className="text-right">
                              <strong className="text-green text-[16px] font-display block">{formatNaira(officeDetails.stats.totalTips)}</strong>
                              <span className="text-ink-soft text-[9px]">Total tips earned</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-ink-soft text-[12px]">No ChopDropper assigned yet</div>
                        )}
                        {officeDetails.stats.todayTips > 0 && (
                          <div className="mt-2 pt-2 border-t border-green/20 text-[11px] text-green font-semibold">
                            Today&apos;s tips: {formatNaira(officeDetails.stats.todayTips)}
                          </div>
                        )}
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-4 gap-2 mb-5">
                        {[
                          [String(officeDetails.stats.totalMembers), "Members"],
                          [String(officeDetails.stats.totalOrders), "Orders"],
                          [formatNaira(officeDetails.stats.totalRevenue), "Revenue"],
                          [formatNaira(officeDetails.stats.totalServiceFees), "Fees earned"],
                        ].map(([val, label]) => (
                          <div key={label} className="bg-cream rounded-[10px] p-3 text-center">
                            <strong className="font-display text-[14px] block">{val}</strong>
                            <span className="text-ink-soft text-[8px] uppercase tracking-[0.05em]">{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Members list */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-display font-bold text-[15px]">Members using this code</h3>
                          <span className="text-ink-soft text-[11px]">{officeDetails.members.length} people</span>
                        </div>
                        {officeDetails.members.length === 0 ? (
                          <div className="text-center py-8 text-ink-soft text-[12px]">No members yet. Share the code <strong className="text-ink">{officeDetails.office.code}</strong> with office workers.</div>
                        ) : (
                          <div className="space-y-1">
                            {officeDetails.members.map((m) => (
                              <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-b-0">
                                <div className="w-8 h-8 rounded-full bg-amber-soft flex items-center justify-center text-[10px] font-bold text-ink flex-shrink-0">
                                  {m.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <strong className="text-[12px] block truncate">{m.name}</strong>
                                  <span className="text-ink-soft text-[10px]">{m.phone} &middot; {m.orderCount} orders</span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <strong className="text-[12px] block">{formatNaira(m.totalSpent)}</strong>
                                  <span className="text-ink-soft text-[9px]">
                                    {m.lastOrder ? `Last: ${new Date(m.lastOrder).toLocaleDateString("en-US", { day: "numeric", month: "short" })}` : "No orders"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Collection point */}
                      <div className="bg-cream rounded-[10px] p-3 text-[11px] text-ink-soft">
                        <strong className="text-ink block mb-0.5">Collection point:</strong> {officeDetails.office.collectionPoint}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-ink-soft text-sm">Failed to load office details</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Menu Items Tab */}
        {tab === "items" && (
          <>
            <div className="mb-6">
              <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Menu management</div>
              <h2 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Menu Items</h2>
              <p className="text-ink-soft text-[13px] mt-1">Manage categories and items for each restaurant&apos;s build-a-plate menu.</p>
            </div>

            <div className="space-y-4">
              {/* Restaurant selector */}
              <div>
                <label className="block text-[12px] font-bold mb-1.5">Select restaurant</label>
                <select
                  value={menuRestaurantId}
                  onChange={(e) => setMenuRestaurantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30"
                >
                  <option value="">Choose a restaurant</option>
                  {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {menuLoading && <div className="text-center py-8 text-ink-soft">Loading...</div>}

              {/* Categories and items */}
              {menuCategories.map((cat) => (
                <div key={cat.id} className="bg-paper border border-line rounded-[16px] overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-cream/50 border-b border-line">
                    <div>
                      <strong className="text-[13px]">{cat.name}</strong>
                      <span className="text-ink-soft text-[10px] ml-2">
                        {cat.selectionRule === "PICK_ONE" ? "Pick one" : cat.selectionRule === "PICK_ONE_OR_MORE" ? "Pick one or more" : "Pick any"} &middot; {cat.items.length} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setNewItemCategoryId(cat.id); setNewItemName(""); setNewItemPrice(""); }}
                        className="text-[10px] font-bold text-green hover:underline"
                      >
                        + Add item
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        className="text-[10px] font-bold text-coral hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-line">
                    {cat.items.map((item) => (
                      <div key={item.id} className="px-4 py-2.5">
                        {editingItemId === item.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input type="text" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} className="flex-1 px-2.5 py-1.5 border border-line rounded-[8px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                              <input type="number" value={editItemPrice} onChange={(e) => setEditItemPrice(e.target.value)} className="w-24 px-2.5 py-1.5 border border-line rounded-[8px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" placeholder="₦" />
                              <button type="button" onClick={() => saveEditItem(item.id)} className="bg-green text-white text-[10px] font-bold px-3 py-1.5 rounded-[8px]">Save</button>
                              <button type="button" onClick={() => setEditingItemId(null)} className="text-ink-soft text-[10px] font-bold px-2 py-1.5">Cancel</button>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className={`px-3 py-1.5 border border-line rounded-[8px] text-[10px] font-bold cursor-pointer ${editItemUploading ? "bg-line text-ink-soft" : "bg-cream/50 hover:bg-cream text-ink"}`}>
                                {editItemUploading ? "Uploading..." : editItemImage ? "Change image" : "Add image"}
                                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadItemImage(f, setEditItemImage, setEditItemUploading); }} disabled={editItemUploading} className="hidden" />
                              </label>
                              {editItemImage && (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={editItemImage} alt="" className="w-8 h-8 rounded object-cover border border-line" />
                                  <button type="button" onClick={() => setEditItemImage("")} className="text-coral text-[9px] font-bold">Remove</button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {(item as { imageUrl?: string }).imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={(item as { imageUrl?: string }).imageUrl!} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                              )}
                              <span className="text-[13px]">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <strong className="text-[13px]">₦{(item.price / 100).toLocaleString()}</strong>
                              <button
                                type="button"
                                onClick={() => { setEditingItemId(item.id); setEditItemName(item.name); setEditItemPrice(String(item.price / 100)); setEditItemImage((item as { imageUrl?: string }).imageUrl || ""); }}
                                className="text-[10px] font-bold text-green hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="text-[10px] font-bold text-coral hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add new item inline */}
                    {newItemCategoryId === cat.id && (
                      <div className="px-4 py-2.5 bg-green-soft/30 space-y-2">
                        <div className="flex items-center gap-2">
                          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item name" className="flex-1 px-2.5 py-1.5 border border-line rounded-[8px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" autoFocus />
                          <input type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} placeholder="Price ₦" className="w-24 px-2.5 py-1.5 border border-line rounded-[8px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30" />
                          <button
                            type="button"
                            onClick={() => addItem(cat.id)}
                            className="bg-coral text-white text-[10px] font-bold px-3 py-1.5 rounded-[8px]"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => { setNewItemCategoryId(null); setNewItemImage(""); }}
                            className="text-ink-soft text-[10px] font-bold px-2 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className={`px-3 py-1.5 border border-line rounded-[8px] text-[10px] font-bold cursor-pointer ${newItemUploading ? "bg-line text-ink-soft" : "bg-paper hover:bg-cream text-ink"}`}>
                            {newItemUploading ? "Uploading..." : newItemImage ? "Change image" : "Add image (optional)"}
                            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadItemImage(f, setNewItemImage, setNewItemUploading); }} disabled={newItemUploading} className="hidden" />
                          </label>
                          {newItemImage && (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={newItemImage} alt="" className="w-8 h-8 rounded object-cover border border-line" />
                              <button type="button" onClick={() => setNewItemImage("")} className="text-coral text-[9px] font-bold">Remove</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {cat.items.length === 0 && newItemCategoryId !== cat.id && (
                      <div className="px-4 py-4 text-center text-ink-soft text-[11px]">No items yet</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add category button */}
              {menuRestaurantId && !showAddCategory && (
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="w-full py-3 border-2 border-dashed border-line rounded-[16px] text-[12px] font-bold text-ink-soft hover:border-green hover:text-green transition-colors"
                >
                  + Add new category
                </button>
              )}

              {showAddCategory && (
                <div className="bg-paper border border-line rounded-[16px] p-4 space-y-3">
                  <strong className="text-[13px] block">New category</strong>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name (e.g. Soups, Protein)"
                    className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30"
                  />
                  <select
                    value={newCategoryRule}
                    onChange={(e) => setNewCategoryRule(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30"
                  >
                    <option value="PICK_ONE">Pick one (required)</option>
                    <option value="PICK_ONE_OR_MORE">Pick one or more</option>
                    <option value="PICK_ANY">Pick any (optional)</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addCategory}
                      className="flex-1 bg-coral text-white font-bold py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors"
                    >
                      Create category
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(false)}
                      className="flex-1 bg-cream text-ink-soft font-bold py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!menuRestaurantId && (
                <div className="text-center py-12 text-ink-soft text-sm">Select a restaurant to manage its menu items</div>
              )}
            </div>
          </>
        )}

        {/* Promos Tab */}
        {tab === "promos" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Promotions</div>
                <h2 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Promos</h2>
                <p className="text-ink-soft text-[13px] mt-1">Manage discounts and promotions for ChopDrop orders.</p>
              </div>
              <button
                type="button"
                onClick={() => { resetPromoForm(); setShowPromoForm(true); }}
                className="bg-coral text-white font-bold text-[12px] px-4 py-2.5 rounded-[10px] hover:bg-[#d95038] transition-colors"
              >
                + Create promo
              </button>
            </div>

            {/* Create / Edit form */}
            {showPromoForm && (
              <div className="bg-paper border border-line rounded-[16px] p-5 mb-6 space-y-4">
                <div className="font-display font-bold text-[17px]">{editingPromoId ? "Edit promo" : "New promo"}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Name</label>
                    <input type="text" value={promoName} onChange={(e) => setPromoName(e.target.value)} placeholder="e.g. Office Group Cashback" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Type</label>
                    <select value={promoType} onChange={(e) => setPromoType(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                      <option value="GROUP_CASHBACK">Group Cashback</option>
                      <option value="REFER">Refer a Friend</option>
                      <option value="EARLY_BIRD">Early Bird</option>
                      <option value="WEEKLY_LOYALTY">Weekly Loyalty</option>
                      <option value="FIRST_ORDER">First Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Reward amount (in Naira)</label>
                    <input type="number" value={promoRewardAmount} onChange={(e) => setPromoRewardAmount(e.target.value)} placeholder="e.g. 200" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Reward type</label>
                    <select value={promoRewardType} onChange={(e) => setPromoRewardType(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30">
                      <option value="CASHBACK">Cashback</option>
                      <option value="DISCOUNT">Discount</option>
                      <option value="FREE_DELIVERY">Free Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Min orders (for group)</label>
                    <input type="number" value={promoMinOrders} onChange={(e) => setPromoMinOrders(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Cutoff time (for early bird)</label>
                    <input type="time" value={promoCutoffTime} onChange={(e) => setPromoCutoffTime(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Max uses (0 = unlimited)</label>
                    <input type="number" value={promoMaxUses} onChange={(e) => setPromoMaxUses(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">Start date</label>
                    <input type="date" value={promoStartDate} onChange={(e) => setPromoStartDate(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold mb-1.5">End date</label>
                    <input type="date" value={promoEndDate} onChange={(e) => setPromoEndDate(e.target.value)} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="promoOfficeOnly" checked={promoOfficeOnly} onChange={(e) => setPromoOfficeOnly(e.target.checked)} className="w-4 h-4 rounded border-line" />
                    <label htmlFor="promoOfficeOnly" className="text-[12px] font-bold">Office drops only</label>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1.5">Description (optional)</label>
                  <textarea value={promoDescription} onChange={(e) => setPromoDescription(e.target.value)} placeholder="Shown to customers on the promo banner" rows={2} className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30 resize-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1.5">Banner image <span className="font-normal text-ink-soft">(optional)</span></label>
                  <div className="flex items-center gap-3">
                    <label className={`px-4 py-2.5 border border-line rounded-[10px] text-sm cursor-pointer transition-colors ${uploading ? "bg-line text-ink-soft" : "bg-cream/50 hover:bg-cream text-ink"}`}>
                      {uploading ? "Uploading..." : promoImageUrl ? "Change image" : "Upload banner"}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const data = await res.json();
                          if (data.url) setPromoImageUrl(data.url);
                        } catch { /* ignore */ }
                        setUploading(false);
                      }} />
                    </label>
                    {promoImageUrl && <button type="button" onClick={() => setPromoImageUrl("")} className="text-[12px] text-ink-soft hover:text-coral">Remove</button>}
                  </div>
                  {promoImageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-line h-[120px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={promoImageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={savePromo} className="flex-1 bg-coral text-white font-bold py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">
                    {editingPromoId ? "Save changes" : "Create promo"}
                  </button>
                  <button type="button" onClick={resetPromoForm} className="flex-1 bg-cream text-ink-soft font-bold py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Promos list */}
            {promos.length === 0 ? (
              <div className="text-center py-12 text-ink-soft text-sm">No promos yet. Create one to get started.</div>
            ) : (
              <div className="space-y-3">
                {promos.map((p) => (
                  <div key={p.id} className="bg-paper border border-line rounded-[16px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.isActive ? "bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-[#d1d5db]"}`} />
                        <div>
                          <strong className="text-[14px] block">{p.name}</strong>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full bg-green-soft text-green">{p.type.replace(/_/g, " ")}</span>
                            <span className="text-ink-soft text-[11px]">{formatNaira(p.rewardAmount)} {p.rewardType.toLowerCase()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startEditPromo(p)} className="text-[10px] font-bold text-green hover:underline">Edit</button>
                        <button type="button" onClick={() => togglePromo(p.id, p.isActive)} className={`text-[10px] font-bold px-3 py-1 rounded-full ${p.isActive ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-cream text-ink-soft"}`}>
                          {p.isActive ? "Active" : "Paused"}
                        </button>
                        <button type="button" onClick={() => deletePromo(p.id)} className="text-[10px] font-bold text-coral hover:underline">Delete</button>
                      </div>
                    </div>
                    {p.description && <p className="text-ink-soft text-[11px] mt-1">{p.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-ink-soft">
                      {p.type === "GROUP_CASHBACK" && <span>Min orders: {p.minOrders}</span>}
                      {p.cutoffTime && <span>Cutoff: {p.cutoffTime}</span>}
                      {p.maxUses > 0 && <span>Max uses: {p.maxUses}</span>}
                      {p.startDate && <span>Starts: {new Date(p.startDate).toLocaleDateString()}</span>}
                      {p.endDate && <span>Ends: {new Date(p.endDate).toLocaleDateString()}</span>}
                      {p.officeOnly && <span>Office drops only</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
