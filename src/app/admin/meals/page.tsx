"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";

interface MealData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  tag: string;
  type: string;
  isAvailable: boolean;
  restaurant: { id: string; name: string };
}

interface RestaurantData {
  id: string;
  name: string;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [tag, setTag] = useState("REGULAR");
  const [type, setType] = useState("FIXED");

  async function loadData() {
    const [mealsRes, restRes] = await Promise.all([
      fetch("/api/admin/meals").then((r) => r.json()),
      fetch("/api/admin/restaurants").then((r) => r.json()),
    ]);
    if (mealsRes.success) setMeals(mealsRes.data);
    if (restRes.success) setRestaurants(restRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setRestaurantId("");
    setTag("REGULAR");
    setType("FIXED");
    setEditingId(null);
    setShowForm(false);
  }

  function editMeal(meal: MealData) {
    setName(meal.name);
    setDescription(meal.description || "");
    setPrice(String(meal.price / 100));
    setRestaurantId(meal.restaurant.id);
    setTag(meal.tag);
    setType(meal.type);
    setEditingId(meal.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = {
      name,
      description: description || undefined,
      price: Math.round(parseFloat(price) * 100), // Convert naira to kobo
      restaurantId,
      tag,
      type,
    };

    if (editingId) {
      await fetch(`/api/admin/meals/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    resetForm();
    loadData();
  }

  async function toggleAvailability(meal: MealData) {
    await fetch(`/api/admin/meals/${meal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !meal.isAvailable }),
    });
    loadData();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meals</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
        >
          {showForm ? "Cancel" : "+ Add Meal"}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Meal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jollof Rice + Chicken"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Restaurant
              </label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                required
              >
                <option value="">Select restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Price (Naira)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tag</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="REGULAR">Regular</option>
                <option value="DEAL">Deal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="FIXED">Fixed Combo</option>
                <option value="BUILD_YOUR_PLATE">Build Your Plate</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comes with plantain and coleslaw"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
          >
            {editingId ? "Update Meal" : "Add Meal"}
          </button>
        </form>
      )}

      {/* Meals List */}
      <div className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className={`bg-card border border-border rounded-xl p-4 flex items-center justify-between ${
              !meal.isAvailable ? "opacity-50" : ""
            }`}
          >
            <div>
              <h3 className="font-semibold">{meal.name}</h3>
              <p className="text-sm text-muted">
                {meal.restaurant.name} &middot; {formatNaira(meal.price)}
                {meal.tag === "DEAL" && (
                  <span className="ml-2 text-accent font-medium">Deal</span>
                )}
                {meal.type === "BUILD_YOUR_PLATE" && (
                  <span className="ml-2 text-primary font-medium">
                    Build-a-plate
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => editMeal(meal)}
                className="px-3 py-1 border border-border text-sm rounded-lg hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => toggleAvailability(meal)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  meal.isAvailable
                    ? "bg-danger/10 text-danger hover:bg-danger/20"
                    : "bg-success/10 text-success hover:bg-success/20"
                }`}
              >
                {meal.isAvailable ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
