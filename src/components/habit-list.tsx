"use client";

import { useCallback, useEffect, useState } from "react";
import type { Habit, TimeOfDay } from "@/lib/types";
import { HabitCheckbox } from "./habit-checkbox";
import { TimeBadge } from "./time-badge";
import { Plus, X, Repeat } from "lucide-react";

export function HabitList() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");

  const fetchHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (res.ok) setHabits(await res.json());
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), time_of_day: timeOfDay }),
    });
    setName("");
    setShowForm(false);
    fetchHabits();
  };

  const toggleHabit = async (habit: Habit) => {
    if (habit.completed_today) {
      await fetch(`/api/habits/${habit.id}/complete`, { method: "DELETE" });
    } else {
      await fetch(`/api/habits/${habit.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    }
    fetchHabits();
  };

  const deleteHabit = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    fetchHabits();
  };

  const grouped = {
    morning: habits.filter((h) => h.time_of_day === "morning"),
    midday: habits.filter((h) => h.time_of_day === "midday"),
    night: habits.filter((h) => h.time_of_day === "night"),
  };

  return (
    <section className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-white/60" />
          <h2 className="text-base font-semibold text-white">Habits</h2>
          <span className="text-xs text-white/30 font-mono">
            {habits.filter((h) => h.completed_today).length}/{habits.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-white/20 rounded-lg">
          <form onSubmit={addHabit} className="p-3 space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Habit name..."
              autoFocus
              className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
            />
            <div className="flex items-center gap-2">
              {(["morning", "midday", "night"] as TimeOfDay[]).map((tod) => (
                <button
                  key={tod}
                  type="button"
                  onClick={() => setTimeOfDay(tod)}
                  className={timeOfDay === tod ? "opacity-100" : "opacity-40 hover:opacity-70"}
                >
                  <TimeBadge timeOfDay={tod} />
                </button>
              ))}
              <button
                type="submit"
                className="ml-auto text-xs border-2 border-white/30 text-white px-3 py-1 rounded-lg hover:bg-white hover:text-black transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border-2 border-white/20 rounded-lg flex-1">
        <div className="divide-y divide-white/10 h-full">
          {(["morning", "midday", "night"] as TimeOfDay[]).map((tod) =>
            grouped[tod].length > 0 ? (
              <div key={tod} className="p-4 space-y-0.5">
                <TimeBadge timeOfDay={tod} className="mb-1.5" />
                {grouped[tod].map((habit) => (
                  <HabitCheckbox
                    key={habit.id}
                    habit={habit}
                    onToggle={() => toggleHabit(habit)}
                    onDelete={() => deleteHabit(habit.id)}
                  />
                ))}
              </div>
            ) : null
          )}
          {habits.length === 0 && (
            <div className="p-8 text-center text-white/30 text-sm min-h-[120px] flex items-center justify-center">
              No habits yet. Add your first one above.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
