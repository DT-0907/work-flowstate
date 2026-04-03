"use client";

import { useCallback, useEffect, useState } from "react";
import { WeekStrip } from "@/components/week-strip";
import { DayDetail } from "@/components/day-detail";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeekOverview } from "@/lib/types";
import { Calendar } from "lucide-react";

export default function WeekPage() {
  const [week, setWeek] = useState<WeekOverview | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/calendar/week");
    if (res.ok) setWeek(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const selectedDay = week?.days.find((d) => d.date === selectedDate);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-zinc-100">This Week</h1>
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-24 w-16 rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl bg-white/[0.04]" />
        </div>
      ) : week ? (
        <>
          <WeekStrip
            days={week.days}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
          {selectedDay && <DayDetail day={selectedDay} />}
        </>
      ) : (
        <p className="text-zinc-500 text-sm text-center py-8">
          Failed to load week overview.
        </p>
      )}
    </div>
  );
}
