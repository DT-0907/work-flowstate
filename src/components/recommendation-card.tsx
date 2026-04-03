"use client";

import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/types";
import { TimeBadge } from "./time-badge";
import { UrgencyIndicator } from "./urgency-indicator";
import { Check, SkipForward, BookOpen, Repeat } from "lucide-react";

interface Props {
  rec: Recommendation;
  onSkip: () => void;
  onComplete: () => void;
}

export function RecommendationCard({ rec, onSkip, onComplete }: Props) {
  const isHabit = rec.type === "habit";

  return (
    <div className="border-2 border-white/20 rounded-lg p-5 flex flex-col gap-3 min-w-[200px] flex-1 hover:border-white/40 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isHabit ? (
            <Repeat className="w-4 h-4 text-white/60 shrink-0" />
          ) : (
            <BookOpen className="w-4 h-4 text-white/60 shrink-0" />
          )}
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              "text-white/40"
            )}
          >
            {rec.type}
          </span>
        </div>
        {rec.time_of_day && <TimeBadge timeOfDay={rec.time_of_day} />}
      </div>

      <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
        {rec.name}
      </h3>

      <div className="flex items-center gap-2 text-xs text-white/40">
        {rec.course && (
          <span className="border border-white/20 px-2 py-0.5 rounded-md font-mono text-[11px]">
            {rec.course}
          </span>
        )}
        {rec.due_date && <UrgencyIndicator dueDate={rec.due_date} />}
        {isHabit && rec.streak !== undefined && rec.streak > 0 && (
          <span className="font-mono text-white/60">{rec.streak}d streak</span>
        )}
      </div>

      {rec.reason && (
        <p className="text-[11px] text-white/30 italic line-clamp-1">{rec.reason}</p>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={onComplete}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 border-white/30 text-white text-xs font-medium hover:bg-white hover:text-black transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Done
        </button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg border border-white/20 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
