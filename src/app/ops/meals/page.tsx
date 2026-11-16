"use client";

import { useState, useEffect, useCallback } from "react";

interface Restaurant { id: string; name: string; }
interface Meal { id: string; restaurantId: string; name: string; description: string | null; imageUrl: string | null; price: number; originalPrice: number | null; tag: string; type: string; isAvailable: boolean; sortOrder: number; restaurant: { name: string }; }
interface MenuItem { id: string; name: string; description: string | null; imageUrl: string | null; price: number; sortOrder: number; }
interface Category { id: string; name: string; selectionRule: string; items: MenuItem[]; }

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

type Tab = "meals" | "builder" | "products";

export default function MealsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [tab, setTab] = useState<Tab>("meals");

  // Meals state
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealForm, setMealForm] = useState({ name: "", price: "", originalPrice: "", description: "", imageUrl: "", tag: "REGULAR", type: "FIXED", maxDeals: "20", restaurantId: "" });
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [showMealForm, setShowMealForm] = useState(false);

  // Products state
  const [storeProducts, setStoreProducts] = useState<Array<{ id: string; name: string; description: string | null; imageUrl: string | null; subcategory: string | null; retailPrice: number; groupPrice: number; category: string }>>([]);

  // Menu builder state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatRule, setNewCatRule] = useState("PICK_ONE");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: "", price: "", description: "" });
  const [itemForms, setItemForms] = useState<Record<string, { name: string; price: string; description: string; imageUrl: string }>>({});

  // Load restaurants
  useEffect(() => {
    fetch("/api/admin/restaurants").then(r => r.json()).then(d => { if (d.success) setRestaurants(d.data); }).catch(() => {});
  }, []);

  // Load meals when restaurant changes
  const loadMeals = useCallback(() => {
    if (!selectedRestaurant) return;
    setMealsLoading(true);
    fetch("/api/admin/meals").then(r => r.json()).then(d => {
      if (d.success) setMeals(d.data.filter((m: Meal) => m.restaurantId === selectedRestaurant));
      setMealsLoading(false);
    }).catch(() => setMealsLoading(false));
  }, [selectedRestaurant]);

  const loadCategories = useCallback(() => {
    if (!selectedRestaurant) return;
    setCatLoading(true);
    fetch(`/api/admin/menu-items?restaurantId=${selectedRestaurant}`).then(r => r.json()).then(d => {
      if (d.success && d.data) {
        // API returns single restaurant object when restaurantId is provided
        const cats = d.data.menuCategories || (Array.isArray(d.data) && d.data[0]?.menuCategories) || [];
        setCategories(cats);
      } else setCategories([]);
      setCatLoading(false);
    }).catch(() => setCatLoading(false));
  }, [selectedRestaurant]);

  useEffect(() => {
    loadMeals(); loadCategories();
    if (selectedRestaurant) {
      fetch(`/api/admin/products?vendorId=${selectedRestaurant}`).then(r => r.json()).then(d => {
        if (d.success) setStoreProducts(d.data);
      }).catch(() => {});
    }
  }, [loadMeals, loadCategories, selectedRestaurant]);

  // Meal CRUD
  async function saveMeal() {
    const body = {
      restaurantId: selectedRestaurant,
      name: mealForm.name,
      price: Math.round(parseFloat(mealForm.price || "0") * 100),
      originalPrice: mealForm.originalPrice ? Math.round(parseFloat(mealForm.originalPrice) * 100) : null,
      description: mealForm.description || null,
      imageUrl: mealForm.imageUrl || null,
      tag: mealForm.tag,
      type: mealForm.type,
      maxDeals: parseInt(mealForm.maxDeals || "20"),
    };
    const url = editingMeal ? `/api/admin/meals/${editingMeal}` : "/api/admin/meals";
    const method = editingMeal ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowMealForm(false);
    setEditingMeal(null);
    setMealForm({ name: "", price: "", originalPrice: "", description: "", imageUrl: "", tag: "REGULAR", type: "FIXED", maxDeals: "20", restaurantId: "" });
    loadMeals();
  }

  async function toggleMealAvailable(meal: Meal) {
    await fetch(`/api/admin/meals/${meal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable: !meal.isAvailable }) });
    loadMeals();
  }

  async function deleteMeal(id: string) {
    if (!confirm("Delete this meal?")) return;
    await fetch(`/api/admin/meals/${id}`, { method: "DELETE" });
    loadMeals();
  }

  function editMeal(meal: Meal) {
    setMealForm({ name: meal.name, price: String(meal.price / 100), originalPrice: meal.originalPrice ? String(meal.originalPrice / 100) : "", description: meal.description || "", imageUrl: meal.imageUrl || "", tag: meal.tag, type: meal.type, maxDeals: "20", restaurantId: meal.restaurantId });
    setEditingMeal(meal.id);
    setShowMealForm(true);
  }

  // Category CRUD
  async function addCategory() {
    if (!newCatName.trim() || !selectedRestaurant) return;
    await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantId: selectedRestaurant, name: newCatName.trim(), selectionRule: newCatRule }) });
    setNewCatName("");
    loadCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its items?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    loadCategories();
  }

  // Item CRUD
  function getItemForm(catId: string) {
    return itemForms[catId] || { name: "", price: "", description: "", imageUrl: "" };
  }

  async function addItem(categoryId: string) {
    const form = getItemForm(categoryId);
    if (!form.name.trim()) return;
    await fetch("/api/admin/menu-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId, name: form.name.trim(), price: Math.round(parseFloat(form.price || "0") * 100), description: form.description || null, imageUrl: form.imageUrl || null }) });
    setItemForms(prev => ({ ...prev, [categoryId]: { name: "", price: "", description: "", imageUrl: "" } }));
    loadCategories();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
    loadCategories();
  }

  async function updateCategoryName(catId: string) {
    if (!editCatName.trim()) return;
    await fetch(`/api/admin/categories/${catId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editCatName.trim() }) });
    setEditingCatId(null);
    loadCategories();
  }

  async function updateItem(itemId: string) {
    if (!editItemForm.name.trim()) return;
    await fetch(`/api/admin/menu-items/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editItemForm.name.trim(), price: Math.round(parseFloat(editItemForm.price || "0") * 100), description: editItemForm.description || null }) });
    setEditingItemId(null);
    loadCategories();
  }

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      return data.success ? data.url : null;
    } catch { return null; }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Store Menu</h1>
      </div>

      {/* Restaurant selector */}
      <div className="mb-6">
        <select
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 min-w-[280px]"
        >
          <option value="">Select a store...</option>
          {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {!selectedRestaurant ? (
        <div className="text-center py-16 text-sm text-[#9CA3AF]">Select a store to manage its menu</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#F8F8F6] p-1 rounded-lg w-fit">
            {(["meals", "builder", "products"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="h-8 px-4 rounded-md text-xs font-semibold cursor-pointer"
                style={{ background: tab === t ? "#1C1C1E" : "transparent", color: tab === t ? "white" : "#6B7280" }}>
                {t === "meals" ? "Meals & Combos" : t === "builder" ? "Menu Builder" : `Products (${storeProducts.length})`}
              </button>
            ))}
          </div>

          {/* ═══ MEALS TAB ═══ */}
          {tab === "meals" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#1C1C1E]">Meals & Combos</h2>
                <button onClick={() => { setShowMealForm(true); setEditingMeal(null); setMealForm({ name: "", price: "", originalPrice: "", description: "", imageUrl: "", tag: "REGULAR", type: "FIXED", maxDeals: "20", restaurantId: selectedRestaurant }); }}
                  className="h-9 px-4 rounded-lg text-xs font-bold text-white cursor-pointer" style={{ background: "#E84C3D" }}>
                  Add meal
                </button>
              </div>

              {mealsLoading ? (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">Loading...</div>
              ) : meals.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">No meals for this restaurant</div>
              ) : (
                <div className="rounded-xl border border-[#E5E7EB] overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-[#E5E7EB] text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-2">Price</th>
                      <th className="text-left py-3 px-2">Original</th>
                      <th className="text-left py-3 px-2">Tag</th>
                      <th className="text-left py-3 px-2">Type</th>
                      <th className="text-center py-3 px-2">Available</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr></thead>
                    <tbody>
                      {meals.map(meal => (
                        <tr key={meal.id} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA]">
                          <td className="py-3 px-4 flex items-center gap-3">
                            {meal.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={meal.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            ) : <div className="w-9 h-9 rounded-lg bg-[#F5F5F0]" />}
                            <span className="font-medium text-[#1C1C1E] truncate max-w-[200px]">{meal.name}</span>
                          </td>
                          <td className="py-3 px-2 font-semibold tabular-nums">{fp(meal.price)}</td>
                          <td className="py-3 px-2 text-[#9CA3AF] tabular-nums">{meal.originalPrice ? fp(meal.originalPrice) : "—"}</td>
                          <td className="py-3 px-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: meal.tag === "DEAL" ? "#FEF2F0" : "#F0FDF4", color: meal.tag === "DEAL" ? "#E84C3D" : "#22C55E" }}>{meal.tag}</span></td>
                          <td className="py-3 px-2 text-[#9CA3AF] text-xs">{meal.type}</td>
                          <td className="py-3 px-2 text-center">
                            <button onClick={() => toggleMealAvailable(meal)} className="w-10 h-5 rounded-full cursor-pointer relative" style={{ background: meal.isAvailable ? "#22C55E" : "#D1D5DB" }}>
                              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white" style={{ left: meal.isAvailable ? 22 : 2 }} />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => editMeal(meal)} className="text-xs font-medium text-[#1C1C1E] border border-[#E5E7EB] px-3 py-1 rounded-lg cursor-pointer hover:bg-[#F8F8F6] mr-1">Edit</button>
                            <button onClick={() => deleteMeal(meal.id)} className="text-xs font-medium text-[#E84C3D] px-3 py-1 rounded-lg cursor-pointer hover:bg-[#FEF2F0]">Del</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Meal form modal */}
              {showMealForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowMealForm(false)}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-[#1C1C1E]">{editingMeal ? "Edit Meal" : "Add Meal"}</h3>
                      <button onClick={() => setShowMealForm(false)} className="text-[#9CA3AF] cursor-pointer text-xl">×</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Name</label>
                        <input value={mealForm.name} onChange={e => setMealForm({ ...mealForm, name: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1">Price (Naira)</label>
                          <input type="number" value={mealForm.price} onChange={e => setMealForm({ ...mealForm, price: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1">Original price</label>
                          <input type="number" value={mealForm.originalPrice} onChange={e => setMealForm({ ...mealForm, originalPrice: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none" placeholder="Optional" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Description</label>
                        <textarea value={mealForm.description} onChange={e => setMealForm({ ...mealForm, description: e.target.value })} className="w-full h-16 px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1">Tag</label>
                          <select value={mealForm.tag} onChange={e => setMealForm({ ...mealForm, tag: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none">
                            <option value="REGULAR">Regular</option>
                            <option value="DEAL">Deal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1">Type</label>
                          <select value={mealForm.type} onChange={e => setMealForm({ ...mealForm, type: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none">
                            <option value="FIXED">Fixed</option>
                            <option value="BUILD_YOUR_PLATE">Build Your Plate</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Image</label>
                        <div className="flex items-center gap-3">
                          {mealForm.imageUrl && <img src={mealForm.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                          <label className="h-10 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-[#F8F8F6]">
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f, "chopdrop/meals"); if (url) setMealForm(prev => ({ ...prev, imageUrl: url })); } }} />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowMealForm(false)} className="flex-1 h-10 rounded-lg border border-[#E5E7EB] text-sm font-medium cursor-pointer">Cancel</button>
                      <button onClick={saveMeal} className="flex-1 h-10 rounded-lg text-sm font-bold text-white cursor-pointer" style={{ background: "#E84C3D" }}>{editingMeal ? "Update" : "Create"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ MENU BUILDER TAB ═══ */}
          {tab === "builder" && (
            <div>
              <h2 className="text-sm font-semibold text-[#1C1C1E] mb-4">Categories & Items</h2>

              {/* Add category */}
              <div className="flex gap-2 mb-6">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name..." className="h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm flex-1 focus:outline-none" />
                <select value={newCatRule} onChange={e => setNewCatRule(e.target.value)} className="h-9 px-2 rounded-lg border border-[#E5E7EB] text-xs focus:outline-none">
                  <option value="PICK_ONE">Pick one</option>
                  <option value="PICK_ONE_OR_MORE">Pick 1+</option>
                  <option value="PICK_ANY">Pick any</option>
                </select>
                <button onClick={addCategory} className="h-9 px-4 rounded-lg text-xs font-bold text-white cursor-pointer" style={{ background: "#E84C3D" }}>Add</button>
              </div>

              {catLoading ? (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">No categories yet. Add one above.</div>
              ) : (
                <div className="space-y-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
                      {/* Category header — editable */}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#FAFAFA] border-b border-[#E5E7EB]">
                        {editingCatId === cat.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="h-7 px-2 rounded border border-[#E5E7EB] text-sm flex-1 focus:outline-none" autoFocus onKeyDown={e => e.key === "Enter" && updateCategoryName(cat.id)} />
                            <button onClick={() => updateCategoryName(cat.id)} className="text-xs font-bold text-white px-3 h-7 rounded cursor-pointer" style={{ background: "#1C1C1E" }}>Save</button>
                            <button onClick={() => setEditingCatId(null)} className="text-xs text-[#9CA3AF] cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#1C1C1E]">{cat.name}</span>
                            <span className="text-[10px] font-medium text-[#9CA3AF]">{cat.selectionRule.replace(/_/g, " ").toLowerCase()} · {cat.items.length} items</span>
                            <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }} className="text-[10px] text-[#6B7280] cursor-pointer hover:underline">Edit</button>
                          </div>
                        )}
                        <button onClick={() => deleteCategory(cat.id)} className="text-xs text-[#E84C3D] cursor-pointer hover:underline ml-2 shrink-0">Delete</button>
                      </div>

                      {/* Items — click to edit */}
                      {cat.items.map(item => (
                        <div key={item.id} className="border-b border-[#F3F4F6] last:border-0">
                          {editingItemId === item.id ? (
                            <div className="px-4 py-2.5 bg-[#FFFBF5] space-y-2">
                              <div className="flex gap-2">
                                <input value={editItemForm.name} onChange={e => setEditItemForm({ ...editItemForm, name: e.target.value })} className="flex-1 h-7 px-2 rounded border border-[#E5E7EB] text-sm focus:outline-none" placeholder="Name" />
                                <input type="number" value={editItemForm.price} onChange={e => setEditItemForm({ ...editItemForm, price: e.target.value })} className="w-20 h-7 px-2 rounded border border-[#E5E7EB] text-sm focus:outline-none" placeholder="₦" />
                              </div>
                              <input value={editItemForm.description} onChange={e => setEditItemForm({ ...editItemForm, description: e.target.value })} className="w-full h-7 px-2 rounded border border-[#E5E7EB] text-xs focus:outline-none" placeholder="Description" />
                              <div className="flex gap-2">
                                <button onClick={() => updateItem(item.id)} className="text-xs font-bold text-white px-3 h-7 rounded cursor-pointer" style={{ background: "#1C1C1E" }}>Save</button>
                                <button onClick={() => setEditingItemId(null)} className="text-xs text-[#9CA3AF] cursor-pointer">Cancel</button>
                                <button onClick={() => { deleteItem(item.id); setEditingItemId(null); }} className="text-xs text-[#E84C3D] cursor-pointer ml-auto">Delete</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#FAFAFA]" onClick={() => { setEditingItemId(item.id); setEditItemForm({ name: item.name, price: String(item.price / 100), description: item.description || "" }); }}>
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              ) : <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-[#1C1C1E]">{item.name}</span>
                                {item.description && <p className="text-[10px] text-[#9CA3AF] truncate">{item.description}</p>}
                              </div>
                              <span className="text-xs tabular-nums text-[#6B7280] shrink-0">{fp(item.price)}</span>
                              <span className="text-[10px] text-[#9CA3AF]">Edit</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add item form */}
                      <div className="px-4 py-3 bg-[#FAFAFA] space-y-2">
                        <div className="flex gap-2 items-end">
                          <input
                            value={getItemForm(cat.id).name}
                            onChange={e => setItemForms(prev => ({ ...prev, [cat.id]: { ...getItemForm(cat.id), name: e.target.value } }))}
                            placeholder="Item name"
                            className="h-8 px-2 rounded-md border border-[#E5E7EB] text-xs flex-1 focus:outline-none"
                          />
                          <input
                            type="number"
                            value={getItemForm(cat.id).price}
                            onChange={e => setItemForms(prev => ({ ...prev, [cat.id]: { ...getItemForm(cat.id), price: e.target.value } }))}
                            placeholder="₦"
                            className="h-8 w-20 px-2 rounded-md border border-[#E5E7EB] text-xs focus:outline-none"
                          />
                          <label className="h-8 px-2 rounded-md border border-[#E5E7EB] text-[10px] font-medium flex items-center cursor-pointer hover:bg-white">
                            Img
                            <input type="file" accept="image/*" className="hidden" onChange={async e => {
                              const f = e.target.files?.[0];
                              if (f) { const url = await uploadImage(f, "chopdrop/items"); if (url) setItemForms(prev => ({ ...prev, [cat.id]: { ...getItemForm(cat.id), imageUrl: url } })); }
                            }} />
                          </label>
                          <button onClick={() => addItem(cat.id)} className="h-8 px-3 rounded-md text-[10px] font-bold text-white cursor-pointer" style={{ background: "#1C1C1E" }}>Add</button>
                        </div>
                        <input
                          value={getItemForm(cat.id).description}
                          onChange={e => setItemForms(prev => ({ ...prev, [cat.id]: { ...getItemForm(cat.id), description: e.target.value } }))}
                          placeholder="Description (optional)"
                          className="h-8 px-2 rounded-md border border-[#E5E7EB] text-xs w-full focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PRODUCTS TAB ═══ */}
          {tab === "products" && (() => {
            const grouped = storeProducts.reduce<Record<string, typeof storeProducts>>((g, p) => {
              const key = p.subcategory || p.category || "Other";
              if (!g[key]) g[key] = [];
              g[key].push(p);
              return g;
            }, {});
            return (
            <div>
              {/* Add product form */}
              <div className="mb-4 p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]">
                <p className="text-xs font-bold text-[#1C1C1E] mb-2">Add product to this store</p>
                <div className="flex gap-2 items-end flex-wrap">
                  <input id="prod-name" placeholder="Product name" className="flex-1 min-w-[150px] h-8 px-2 rounded-md border border-[#E5E7EB] text-xs focus:outline-none" />
                  <input id="prod-retail" type="number" placeholder="Retail ₦" className="w-24 h-8 px-2 rounded-md border border-[#E5E7EB] text-xs focus:outline-none" />
                  <input id="prod-group" type="number" placeholder="Group ₦ (opt)" className="w-24 h-8 px-2 rounded-md border border-[#E5E7EB] text-xs focus:outline-none" />
                  <input id="prod-sub" placeholder="Subcategory" className="w-28 h-8 px-2 rounded-md border border-[#E5E7EB] text-xs focus:outline-none" list="subcategory-list" />
                  <datalist id="subcategory-list">
                    {Object.keys(grouped).map(s => <option key={s} value={s} />)}
                  </datalist>
                  <button onClick={async () => {
                    const name = (document.getElementById("prod-name") as HTMLInputElement).value.trim();
                    const retail = parseFloat((document.getElementById("prod-retail") as HTMLInputElement).value) || 0;
                    const group = parseFloat((document.getElementById("prod-group") as HTMLInputElement).value) || retail;
                    const sub = (document.getElementById("prod-sub") as HTMLInputElement).value.trim();
                    if (!name || !retail) return;
                    await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId: selectedRestaurant, name, retailPrice: retail, groupPrice: group, subcategory: sub || null, category: storeProducts[0]?.category || "Food", minPoolSize: 5 }) });
                    // Reload
                    const res = await fetch(`/api/admin/products?vendorId=${selectedRestaurant}`);
                    const d = await res.json();
                    if (d.success) setStoreProducts(d.data);
                    (document.getElementById("prod-name") as HTMLInputElement).value = "";
                    (document.getElementById("prod-retail") as HTMLInputElement).value = "";
                    (document.getElementById("prod-group") as HTMLInputElement).value = "";
                  }} className="h-8 px-3 rounded-md text-[10px] font-bold text-white cursor-pointer" style={{ background: "#1C1C1E" }}>Add</button>
                </div>
              </div>

              {/* Product groups */}
              {Object.keys(grouped).length === 0 ? (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">No products yet. Add one above.</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grouped).map(([sub, items]) => (
                    <div key={sub} className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#FAFAFA] border-b border-[#E5E7EB]">
                        <span className="text-sm font-bold text-[#1C1C1E]">{sub}</span>
                        <span className="text-[10px] text-[#9CA3AF]">{items.length} items</span>
                      </div>
                      {items.map(p => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F3F4F6] last:border-0">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          ) : <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-[#1C1C1E] block truncate">{p.name}</span>
                            {p.description && <span className="text-[10px] text-[#9CA3AF] block truncate">{p.description}</span>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-[#E84C3D] tabular-nums block">{fp(p.groupPrice)}</span>
                            {p.groupPrice < p.retailPrice && <span className="text-[10px] text-[#9CA3AF] tabular-nums line-through">{fp(p.retailPrice)}</span>}
                          </div>
                          <a href="/ops/products" className="text-[10px] text-[#6B7280] hover:underline shrink-0">Edit</a>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
