"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatNaira } from "@/lib/utils";

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

interface MealCardProps {
  meal: MealData;
  onEdit: (meal: MealData) => void;
  onToggle: (meal: MealData) => void;
  isDragOverlay?: boolean;
}

export function MealCard({ meal, onEdit, onToggle, isDragOverlay }: MealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: meal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : meal.isAvailable ? 1 : 0.5,
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`bg-background border rounded-xl p-3 flex items-start gap-2 group ${
        isDragOverlay
          ? "border-primary scale-[1.02]"
          : "border-border"
      }`}
    >
      {/* Drag handle */}
      <button
        {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
        className="mt-0.5 cursor-grab active:cursor-grabbing text-muted hover:text-secondary shrink-0"
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4" cy="2" r="1.5" />
          <circle cx="10" cy="2" r="1.5" />
          <circle cx="4" cy="7" r="1.5" />
          <circle cx="10" cy="7" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-sm text-charcoal truncate">{meal.name}</p>
          <span className="text-base font-bold text-charcoal tabular-nums shrink-0">
            {formatNaira(meal.price)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {meal.tag === "DEAL" && (
            <span className="text-[11px] font-medium text-primary">Deal</span>
          )}
          {meal.type === "BUILD_YOUR_PLATE" && (
            <span className="text-[11px] font-medium text-forest">Build-a-plate</span>
          )}
          {!meal.isAvailable && (
            <span className="text-[11px] font-medium text-danger">Disabled</span>
          )}
        </div>
      </div>

      {/* Quick actions — visible on hover */}
      {!isDragOverlay && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(meal)}
            className="p-1 text-secondary hover:text-charcoal rounded"
            aria-label="Edit meal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
          <button
            onClick={() => onToggle(meal)}
            className={`p-1 rounded ${
              meal.isAvailable
                ? "text-danger hover:text-danger"
                : "text-success hover:text-success"
            }`}
            aria-label={meal.isAvailable ? "Disable meal" : "Enable meal"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {meal.isAvailable ? (
                <><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>
              ) : (
                <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>
              )}
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
