"use client";

import { cn } from "@/lib/utils";
import type { Assignment } from "@/lib/types";
import { UrgencyIndicator } from "./urgency-indicator";
import { Trash2, Check, Repeat } from "lucide-react";

interface Props {
  assignment: Assignment;
  onComplete: () => void;
  onDelete: () => void;
}

export function AssignmentRow({ assignment, onComplete, onDelete }: Props) {
  const isCompleted = assignment.status === "completed";

  return (
    <div className="flex items-center gap-3 group py-2 px-1">
      {isCompleted ? (
        <div className="w-5 h-5 rounded-md border-2 border-white/40 bg-white/20 flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white/60" />
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="w-5 h-5 rounded-md border-2 border-white/40 hover:border-white/60 flex items-center justify-center transition-all shrink-0"
        >
          <Check className="w-3 h-3 opacity-0 group-hover:opacity-50 text-white/50 transition-opacity" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          isCompleted ? "text-white/40 line-through" : "text-white"
        )}>
          {assignment.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {assignment.course && (
            <span className={cn(
              "text-[10px] font-mono border px-1.5 py-0.5 rounded",
              isCompleted ? "text-white/20 border-white/10" : "text-white/40 border-white/20"
            )}>
              {assignment.course}
            </span>
          )}
          <span className={cn(
            "text-[10px] font-mono",
            isCompleted ? "text-white/20" : "text-white/30"
          )}>
            {assignment.estimated_minutes}min
          </span>
          <span
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded",
              isCompleted ? "text-white/20 bg-white/[0.02]" : "text-white/50 bg-white/[0.04]"
            )}
          >
            {assignment.priority}
          </span>
          {assignment.repeats_weekly && (
            <Repeat className={cn(
              "w-3 h-3",
              isCompleted ? "text-white/20" : "text-white/40"
            )} />
          )}
        </div>
      </div>

      {!isCompleted && <UrgencyIndicator dueDate={assignment.due_date} />}

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/60 shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
