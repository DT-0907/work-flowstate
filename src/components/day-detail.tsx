"use client";

import type { DayOverview, Assignment } from "@/lib/types";
import { UrgencyIndicator } from "./urgency-indicator";
import { CalendarCheck, BookOpen, Sparkles } from "lucide-react";

interface Props {
  day: DayOverview;
}

export function DayDetail({ day }: Props) {
  const isToday = day.date === new Date().toISOString().split("T")[0];
  const displayDate = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{displayDate}</h3>
        {isToday && (
          <span className="text-[10px] border border-white/40 text-white px-2 py-0.5 rounded-full font-medium">
            Today
          </span>
        )}
      </div>

      {/* AI Suggestion preview */}
      {day.aiSuggestions.length > 0 && (
        <div className="border-2 border-white/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Sparkles className="w-3.5 h-3.5 text-white/60" />
            <span>Suggested focus</span>
          </div>
          {day.aiSuggestions.map((s) => (
            <p key={s.id} className="text-sm text-white/80 pl-5">
              {s.name}
            </p>
          ))}
        </div>
      )}

      {/* Habits summary */}
      <div className="border-2 border-white/20 rounded-lg p-3">
        <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
          <CalendarCheck className="w-3.5 h-3.5 text-white/60" />
          <span>Habits</span>
          <span className="ml-auto font-mono text-white">
            {day.habits.completed}/{day.habits.total}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${day.habits.total > 0 ? (day.habits.completed / day.habits.total) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Assignments due */}
      {day.assignments.length > 0 && (
        <div className="border-2 border-white/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <BookOpen className="w-3.5 h-3.5 text-white/60" />
            <span>Due</span>
          </div>
          {day.assignments.map((a: Assignment) => (
            <div key={a.id} className="flex items-center justify-between pl-5">
              <div>
                <p className="text-sm text-white/80">{a.name}</p>
                {a.course && (
                  <span className="text-[10px] font-mono text-white/30">
                    {a.course}
                  </span>
                )}
              </div>
              <UrgencyIndicator dueDate={a.due_date} />
            </div>
          ))}
        </div>
      )}

      {day.assignments.length === 0 && day.habits.total === 0 && (
        <div className="text-center py-6 text-white/30 text-sm">
          Nothing scheduled for this day.
        </div>
      )}
    </div>
  );
}
