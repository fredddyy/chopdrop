"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";

interface MealOption {
  id: string;
  name: string;
  price: number;
  restaurant: { name: string };
}

interface TimeSlotOption {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffTime: string;
}

interface DailyMenuItem {
  id: string;
  date: string;
  maxOrders: number;
  currentOrders: number;
  meal: { id: string; name: string; price: number; restaurant: { name: string } };
  timeSlot: { label: string; startTime: string; endTime: string };
}

export default function DailyMenuPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [menus, setMenus] = useState<DailyMenuItem[]>([]);
  const [meals, setMeals] = useState<MealOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMeal, setSelectedMeal] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [maxOrders, setMaxOrders] = useState("30");
  const [showForm, setShowForm] = useState(false);

  async function loadMenus() {
    const res = await fetch(`/api/admin/daily-menu?date=${date}`);
    const data = await res.json();
    if (data.success) setMenus(data.data);
  }

  async function loadOptions() {
    const [mealsRes, slotsRes] = await Promise.all([
      fetch("/api/admin/meals").then((r) => r.json()),
      fetch("/api/menu?date=" + date).then((r) => r.json()),
    ]);
    if (mealsRes.success)
      setMeals(
        mealsRes.data.filter((m: MealOption & { isAvailable: boolean }) => m.isAvailable)
      );

    // We need time slots from somewhere — fetch from API or use defaults
    // For now we'll use a simple approach
    setLoading(false);
  }

  useEffect(() => {
    Promise.all([loadMenus(), loadOptions()]).then(() => setLoading(false));
  }, [date]);

  // Load time slots
  useEffect(() => {
    fetch("/api/menu?date=" + date)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          const slots = data.data.map(
            (d: { timeSlot: TimeSlotOption }) => d.timeSlot
          );
          const unique = slots.filter(
            (s: TimeSlotOption, i: number, arr: TimeSlotOption[]) =>
              arr.findIndex((t: TimeSlotOption) => t.id === s.id) === i
          );
          setTimeSlots(unique);
          if (unique.length > 0 && !selectedSlot) {
            setSelectedSlot(unique[0].id);
          }
        }
      });
  }, [date]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSlot) {
      return;
    }

    await fetch("/api/admin/daily-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        mealId: selectedMeal,
        timeSlotId: selectedSlot,
        maxOrders: parseInt(maxOrders),
      }),
    });

    setShowForm(false);
    loadMenus();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/admin/daily-menu/${id}`, { method: "DELETE" });
    loadMenus();
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
        <h1 className="text-2xl font-bold">Daily Menu</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
        >
          {showForm ? "Cancel" : "+ Add to Menu"}
        </button>
      </div>

      {/* Date Picker */}
      <div className="mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        />
      </div>

      {/* Add Form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Meal</label>
              <select
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                required
              >
                <option value="">Select meal</option>
                {meals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.restaurant.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Time Slot
              </label>
              {timeSlots.length > 0 ? (
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  required
                >
                  {timeSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.startTime} – {s.endTime})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted py-2">
                  No time slots. Seed data first.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Orders
              </label>
              <input
                type="number"
                value={maxOrders}
                onChange={(e) => setMaxOrders(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                min="1"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
          >
            Add to Menu
          </button>
        </form>
      )}

      {/* Today's Menu */}
      {menus.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No meals on the menu for this date.</p>
          <p className="text-sm mt-1">
            Click &quot;Add to Menu&quot; to assign meals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold">{item.meal.name}</h3>
                <p className="text-sm text-muted">
                  {item.meal.restaurant.name} &middot;{" "}
                  {formatNaira(item.meal.price)}
                </p>
                <p className="text-xs text-muted mt-1">
                  {item.timeSlot.label}: {item.timeSlot.startTime} –{" "}
                  {item.timeSlot.endTime}
                </p>
                <p className="text-xs mt-1">
                  <span className="font-medium">{item.currentOrders}</span> /{" "}
                  {item.maxOrders} orders
                </p>
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="px-3 py-1 bg-danger/10 text-danger text-sm rounded-lg hover:bg-danger/20"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
