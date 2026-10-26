"use client";

import { useState, useEffect } from "react";

interface RestaurantData {
  id: string;
  name: string;
}

interface MealData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  tag: string;
  type: string;
  isAvailable: boolean;
  sortOrder: number;
  restaurant: { id: string; name: string };
}

interface MealFormProps {
  restaurants: RestaurantData[];
  editingMeal: MealData | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export function MealForm({ restaurants, editingMeal, onSubmit, onCancel }: MealFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [tag, setTag] = useState("REGULAR");
  const [type, setType] = useState("FIXED");

  useEffect(() => {
    if (editingMeal) {
      setName(editingMeal.name);
      setDescription(editingMeal.description || "");
      setPrice(String(editingMeal.price / 100));
      setRestaurantId(editingMeal.restaurant.id);
      setTag(editingMeal.tag);
      setType(editingMeal.type);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setRestaurantId("");
      setTag("REGULAR");
      setType("FIXED");
    }
  }, [editingMeal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = {
      name,
      description: description || undefined,
      price: Math.round(parseFloat(price) * 100),
      restaurantId,
      tag,
      type,
    };

    if (editingMeal) {
      await fetch(`/api/admin/meals/${editingMeal.id}`, {
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

    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Meal Name</label>
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
          <label className="block text-sm font-medium mb-1">Restaurant</label>
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
          <label className="block text-sm font-medium mb-1">Price (Naira)</label>
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
        <label className="block text-sm font-medium mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Comes with plantain and coleslaw"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
        >
          {editingMeal ? "Update Meal" : "Add Meal"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-border text-sm rounded-lg hover:bg-sand"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
