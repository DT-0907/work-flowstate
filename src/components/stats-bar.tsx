"use client";

import { useEffect, useState } from "react";
import { Flame, CheckCircle2, Calendar } from "lucide-react";

interface Stats {
  activeStreaks: number;
  completionRate: number;
  dueThisWeek: number;
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats>({ activeStreaks: 0, completionRate: 0, dueThisWeek: 0 });

  useEffect(() => {
    async function load() {
      const [habitsRes, assignmentsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch("/api/assignments"),
      ]);
      if (!habitsRes.ok || !assignmentsRes.ok) return;

      const habits = await habitsRes.json();
      const assignments = await assignmentsRes.json();

      const activeStreaks = habits.filter((h: any) => h.streak > 0).length;
      const totalHabits = habits.length;
      const completedToday = habits.filter((h: any) => h.completed_today).length;
      const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const dueThisWeek = assignments.filter(
        (a: any) => new Date(a.due_date) <= weekFromNow
      ).length;

      setStats({ activeStreaks, completionRate, dueThisWeek });
    }
    load();
  }, []);

  const items = [
    { icon: Flame, label: "Streaks", value: stats.activeStreaks },
    { icon: CheckCircle2, label: "Today", value: `${stats.completionRate}%` },
    { icon: Calendar, label: "Due 7d", value: stats.dueThisWeek },
  ];

  return (
    <div className="border-2 border-white/20 rounded-lg p-6 flex items-center justify-around gap-8">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-white/60" />
          <div>
            <p className="text-lg font-bold text-white font-mono">{value}</p>
            <p className="text-xs text-white/30">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
