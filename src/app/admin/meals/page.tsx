"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";
import { MealForm } from "./meal-form";
import { KanbanBoard } from "./kanban-board";

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

interface RestaurantData {
  id: string;
  name: string;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealData | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

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

  function handleEdit(meal: MealData) {
    setEditingMeal(meal);
    setShowForm(true);
  }

  async function handleToggle(meal: MealData) {
    await fetch(`/api/admin/meals/${meal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !meal.isAvailable }),
    });
    loadData();
  }

  function handleFormDone() {
    setShowForm(false);
    setEditingMeal(null);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Meals</h1>
          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("board")}
              className={`px-2.5 py-1.5 text-xs ${
                viewMode === "board"
                  ? "bg-charcoal text-white"
                  : "text-secondary hover:bg-sand"
              }`}
              title="Board view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="10" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1.5 text-xs ${
                viewMode === "list"
                  ? "bg-charcoal text-white"
                  : "text-secondary hover:bg-sand"
              }`}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" />
                <path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingMeal(null);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
        >
          {showForm ? "Cancel" : "+ Add Meal"}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <MealForm
          restaurants={restaurants}
          editingMeal={editingMeal}
          onSubmit={handleFormDone}
          onCancel={() => {
            setShowForm(false);
            setEditingMeal(null);
          }}
        />
      )}

      {/* Board View */}
      {viewMode === "board" && (
        <KanbanBoard
          meals={meals}
          restaurants={restaurants}
          onEditMeal={handleEdit}
          onToggleMeal={handleToggle}
          onDataChange={loadData}
        />
      )}

      {/* List View */}
      {viewMode === "list" && (
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
                  onClick={() => handleEdit(meal)}
                  className="px-3 py-1 border border-border text-sm rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(meal)}
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
      )}
    </div>
  );
}
