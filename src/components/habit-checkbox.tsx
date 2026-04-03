"use client";

import { cn } from "@/lib/utils";
import type { Habit } from "@/lib/types";
import { Check, Trash2 } from "lucide-react";

interface Props {
  habit: Habit;
  onToggle: () => void;
  onDelete: () => void;
}

export function HabitCheckbox({ habit, onToggle, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 group py-1.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0",
          habit.completed_today
            ? "bg-white border-white text-black"
            : "border-white/40 hover:border-white/60"
        )}
      >
        {habit.completed_today && <Check className="w-3 h-3" />}
      </button>

      <span
        className={cn(
          "text-sm flex-1 transition-all duration-200",
          habit.completed_today ? "text-white/30 line-through" : "text-white"
        )}
      >
        {habit.name}
      </span>

      {habit.streak > 0 && (
        <span className="text-[11px] font-mono text-white/30">
          {habit.streak}d
        </span>
      )}

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/60"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
