"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { RestaurantColumn } from "./restaurant-column";
import { MealCard } from "./meal-card";

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

interface KanbanBoardProps {
  meals: MealData[];
  restaurants: RestaurantData[];
  onEditMeal: (meal: MealData) => void;
  onToggleMeal: (meal: MealData) => void;
  onDataChange: () => void;
}

type ColumnMap = Record<string, MealData[]>;

function groupByRestaurant(meals: MealData[], restaurants: RestaurantData[]): ColumnMap {
  const map: ColumnMap = {};
  for (const r of restaurants) {
    map[r.id] = [];
  }
  for (const meal of meals) {
    if (!map[meal.restaurant.id]) {
      map[meal.restaurant.id] = [];
    }
    map[meal.restaurant.id].push(meal);
  }
  // Sort each column by sortOrder
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return map;
}

function findColumnOfMeal(columns: ColumnMap, mealId: string): string | null {
  for (const [colId, meals] of Object.entries(columns)) {
    if (meals.some((m) => m.id === mealId)) return colId;
  }
  return null;
}

export function KanbanBoard({
  meals,
  restaurants,
  onEditMeal,
  onToggleMeal,
  onDataChange,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnMap>(() =>
    groupByRestaurant(meals, restaurants)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const prevColumnsRef = useRef<ColumnMap | null>(null);

  // Re-sync when meals prop changes (after refetch)
  const mealsKey = meals.map((m) => `${m.id}:${m.sortOrder}:${m.restaurant.id}`).join(",");
  const lastSyncRef = useRef(mealsKey);
  if (lastSyncRef.current !== mealsKey && !activeId) {
    lastSyncRef.current = mealsKey;
    setColumns(groupByRestaurant(meals, restaurants));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const activeMeal = activeId
    ? meals.find((m) => m.id === activeId) ?? null
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setColumns((prev) => {
      prevColumnsRef.current = prev;
      return prev;
    });
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    setColumns((prev) => {
      const fromCol = findColumnOfMeal(prev, activeIdStr);
      if (!fromCol) return prev;

      // Over a column directly (empty drop zone)
      let toCol = prev[overIdStr] ? overIdStr : findColumnOfMeal(prev, overIdStr);
      if (!toCol) return prev;

      if (fromCol === toCol) return prev; // same column, handled by DragEnd

      const fromMeals = [...prev[fromCol]];
      const toMeals = [...prev[toCol]];
      const mealIdx = fromMeals.findIndex((m) => m.id === activeIdStr);
      if (mealIdx === -1) return prev;

      const [movedMeal] = fromMeals.splice(mealIdx, 1);

      // Find insertion index
      const overIdx = toMeals.findIndex((m) => m.id === overIdStr);
      const insertIdx = overIdx >= 0 ? overIdx : toMeals.length;

      // Update the meal's restaurant reference
      const restaurant = restaurants.find((r) => r.id === toCol);
      const updatedMeal = {
        ...movedMeal,
        restaurant: { id: toCol!, name: restaurant?.name ?? "" },
      };

      toMeals.splice(insertIdx, 0, updatedMeal);

      return { ...prev, [fromCol]: fromMeals, [toCol!]: toMeals };
    });
  }, [restaurants]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) {
        // Cancelled drag — restore
        if (prevColumnsRef.current) setColumns(prevColumnsRef.current);
        return;
      }

      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      setColumns((prev) => {
        const col = findColumnOfMeal(prev, activeIdStr);
        if (!col) return prev;

        const colMeals = [...prev[col]];
        const oldIdx = colMeals.findIndex((m) => m.id === activeIdStr);
        let newIdx = colMeals.findIndex((m) => m.id === overIdStr);

        if (oldIdx === -1) return prev;
        if (newIdx === -1) newIdx = colMeals.length - 1;
        if (oldIdx === newIdx) return prev;

        const reordered = arrayMove(colMeals, oldIdx, newIdx);
        const updated = { ...prev, [col]: reordered };

        // Persist to API
        persistReorder(updated);

        return updated;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function persistReorder(cols: ColumnMap) {
    const items: { id: string; sortOrder: number; restaurantId: string }[] = [];

    for (const [restaurantId, colMeals] of Object.entries(cols)) {
      colMeals.forEach((meal, idx) => {
        // Only include meals whose position or restaurant actually changed
        const original = meals.find((m) => m.id === meal.id);
        if (
          !original ||
          original.sortOrder !== idx ||
          original.restaurant.id !== restaurantId
        ) {
          items.push({ id: meal.id, sortOrder: idx, restaurantId });
        }
      });
    }

    if (items.length === 0) return;

    try {
      const res = await fetch("/api/admin/meals/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Reorder failed");
      onDataChange();
    } catch {
      // Rollback to previous state
      if (prevColumnsRef.current) {
        setColumns(prevColumnsRef.current);
      }
      onDataChange();
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {restaurants.map((restaurant) => (
          <RestaurantColumn
            key={restaurant.id}
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            meals={columns[restaurant.id] ?? []}
            onEditMeal={onEditMeal}
            onToggleMeal={onToggleMeal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeMeal ? (
          <MealCard
            meal={activeMeal}
            onEdit={() => {}}
            onToggle={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
