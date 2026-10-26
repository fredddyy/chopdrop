"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
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

interface RestaurantColumnProps {
  restaurantId: string;
  restaurantName: string;
  meals: MealData[];
  onEditMeal: (meal: MealData) => void;
  onToggleMeal: (meal: MealData) => void;
}

export function RestaurantColumn({
  restaurantId,
  restaurantName,
  meals,
  onEditMeal,
  onToggleMeal,
}: RestaurantColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: restaurantId });

  return (
    <div
      className={`bg-card border rounded-2xl flex flex-col min-w-[280px] max-w-[320px] shrink-0 transition-colors ${
        isOver ? "border-primary" : "border-border"
      }`}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-border flex items-baseline justify-between">
        <h3 className="font-semibold text-sm text-charcoal">{restaurantName}</h3>
        <span className="text-[11px] text-muted tabular-nums">{meals.length} meals</span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 260px)" }}
      >
        <SortableContext items={meals.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={onEditMeal}
              onToggle={onToggleMeal}
            />
          ))}
        </SortableContext>

        {meals.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-[11px] text-muted">No meals yet</p>
            <p className="text-[11px] text-muted">Drag one here</p>
          </div>
        )}
      </div>
    </div>
  );
}
