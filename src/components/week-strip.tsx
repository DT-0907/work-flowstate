"use client";

import { cn } from "@/lib/utils";
import type { DayOverview } from "@/lib/types";

interface Props {
  days: DayOverview[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function WeekStrip({ days, selectedDate, onSelect }: Props) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {days.map((day) => {
        const isToday = day.date === today;
        const isSelected = day.date === selectedDate;
        const completionRatio =
          day.habits.total > 0 ? day.habits.completed / day.habits.total : 0;

        return (
          <button
            key={day.date}
            onClick={() => onSelect(day.date)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg min-w-[64px] transition-all duration-300",
              isSelected
                ? "border-2 border-white scale-[1.02]"
                : "border border-white/15 hover:border-white/30"
            )}
          >
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                isToday ? "text-white" : "text-white/30"
              )}
            >
              {day.dayName}
            </span>
            <span
              className={cn(
                "text-lg font-bold",
                isSelected ? "text-white" : "text-white/40"
              )}
            >
              {new Date(day.date + "T12:00:00").getDate()}
            </span>

            {/* Habit completion ring */}
            <div className="relative w-5 h-5">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/10"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${completionRatio * 50.27} 50.27`}
                  className="text-white transition-all duration-500"
                />
              </svg>
              {day.assignments.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full text-[6px] font-bold text-black flex items-center justify-center">
                  {day.assignments.length}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
