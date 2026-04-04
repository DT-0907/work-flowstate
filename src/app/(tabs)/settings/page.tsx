"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Sun, Moon, Timer, Trash2, Loader2, LogOut, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LIFE_AREAS, AREA_LABELS, type LifeArea, type Habit } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [pomWork, setPomWork] = useState(25);
  const [pomBreak, setPomBreak] = useState(5);
  const [saving, setSaving] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [habits, setHabits] = useState<(Habit & { mappings: { area: LifeArea; relevance: number }[] })[]>([]);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const s = await res.json();
      if (s) {
        setTheme(s.theme || "dark");
        setPomWork(s.pomodoro_work || 25);
        setPomBreak(s.pomodoro_break || 5);
      }
    }
  }, []);

  const fetchHabits = useCallback(async () => {
    const [habitsRes, mappingsRes] = await Promise.all([
      fetch("/api/habits"),
      fetch("/api/growth/mappings"),
    ]);
    if (!habitsRes.ok) return;
    const habitsData = await habitsRes.json();
    const mappingsData = mappingsRes.ok ? await mappingsRes.json() : [];
    setHabits(
      habitsData.map((h: Habit) => ({
        ...h,
        mappings: (mappingsData || []).filter((m: any) => m.habit_id === h.id),
      }))
    );
  }, []);

  useEffect(() => { fetchSettings(); fetchHabits(); }, [fetchSettings, fetchHabits]);

  const save = async (updates: Record<string, unknown>) => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
  };

  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    await save({ theme: next });
  };

  const updatePomodoro = async (work: number, brk: number) => {
    setPomWork(work);
    setPomBreak(brk);
    await save({ pomodoro_work: work, pomodoro_break: brk });
  };

  const toggleHabitArea = async (habitId: string, area: LifeArea, currentlyMapped: boolean) => {
    const supabase = createClient();
    if (currentlyMapped) {
      await supabase.from("habit_area_mappings").delete().eq("habit_id", habitId).eq("area", area);
    } else {
      await supabase.from("habit_area_mappings").upsert({ habit_id: habitId, area, relevance: 0.5 }, { onConflict: "habit_id,area" });
    }
    fetchHabits();
  };

  const wipeData = async () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    const endpoints = ["/api/habits", "/api/assignments"];
    for (const ep of endpoints) {
      const res = await fetch(ep);
      if (res.ok) {
        const items = await res.json();
        for (const item of items) {
          await fetch(`${ep}/${item.id}`, { method: "DELETE" });
        }
      }
    }
    setConfirmWipe(false);
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-white/60" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        {saving && <Loader2 className="w-3 h-3 animate-spin text-white/30" />}
      </div>

      {/* Theme */}
      <div className="border-2 border-white/20 rounded-lg p-4 space-y-3">
        <h3 className="text-base font-semibold text-white">Appearance</h3>
        <div className="flex gap-3">
          <button
            onClick={toggleTheme}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all",
              theme === "dark" ? "border-2 border-white text-white" : "border-2 border-white/20 text-white/30"
            )}
          >
            <Moon className="w-4 h-4" />
            <span className="text-sm">Dark</span>
          </button>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all",
              theme === "light" ? "border-2 border-white text-white" : "border-2 border-white/20 text-white/30"
            )}
          >
            <Sun className="w-4 h-4" />
            <span className="text-sm">Light</span>
          </button>
        </div>
      </div>

      {/* Habit Category Management */}
      {habits.length > 0 && (
        <div className="border-2 border-white/20 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-white/40" />
            <h3 className="text-base font-semibold text-white">Habit Categories</h3>
          </div>
          <p className="text-xs text-white/30">Tap areas to assign/unassign each habit.</p>
          <div className="space-y-4">
            {habits.map((habit) => {
              const mappedAreas = new Set(habit.mappings.map((m) => m.area));
              return (
                <div key={habit.id} className="space-y-2">
                  <p className="text-sm text-white/80">{habit.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LIFE_AREAS.map((area) => {
                      const isMapped = mappedAreas.has(area);
                      return (
                        <button
                          key={area}
                          onClick={() => toggleHabitArea(habit.id, area, isMapped)}
                          className={cn(
                            "text-[10px] px-2.5 py-1 rounded-lg border-2 transition-all",
                            isMapped
                              ? "border-white text-white bg-white/10"
                              : "border-white/15 text-white/25 hover:border-white/30 hover:text-white/40"
                          )}
                        >
                          {AREA_LABELS[area]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pomodoro */}
      <div className="border-2 border-white/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-white/40" />
          <h3 className="text-base font-semibold text-white">Pomodoro Timer</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Work (min)</label>
            <input
              type="number"
              value={pomWork}
              onChange={(e) => updatePomodoro(parseInt(e.target.value) || 25, pomBreak)}
              min={1}
              max={120}
              className="w-full bg-transparent text-sm text-white px-3 py-2 rounded-lg outline-none border-2 border-white/20 focus:border-white/50 mt-1 font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Break (min)</label>
            <input
              type="number"
              value={pomBreak}
              onChange={(e) => updatePomodoro(pomWork, parseInt(e.target.value) || 5)}
              min={1}
              max={60}
              className="w-full bg-transparent text-sm text-white px-3 py-2 rounded-lg outline-none border-2 border-white/20 focus:border-white/50 mt-1 font-mono"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          {[[25, 5], [50, 10], [90, 15]].map(([w, b]) => (
            <button
              key={`${w}-${b}`}
              onClick={() => updatePomodoro(w, b)}
              className={cn(
                "text-[10px] px-3 py-1 rounded-lg transition-all",
                pomWork === w && pomBreak === b
                  ? "border-2 border-white text-white"
                  : "text-white/30 hover:text-white/60 border border-white/20"
              )}
            >
              {w}/{b}
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="border-2 border-white/20 rounded-lg p-4 space-y-3">
        <h3 className="text-base font-semibold text-white">Account</h3>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg border-2 border-white/20 text-white/60 hover:bg-white hover:text-black transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log out
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-white/20 rounded-lg p-4 space-y-3">
        <h3 className="text-base font-semibold text-white">Danger Zone</h3>
        <p className="text-xs text-white/30">
          Wipe all habits, assignments, journal entries, and scores. This cannot be undone.
        </p>
        <button
          onClick={wipeData}
          className={cn(
            "flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all",
            confirmWipe
              ? "bg-white text-black border-2 border-white"
              : "border-2 border-white/20 text-white/40 hover:border-white/40 hover:text-white/60"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmWipe ? "Click again to confirm" : "Wipe everything"}
        </button>
      </div>
    </div>
  );
}
