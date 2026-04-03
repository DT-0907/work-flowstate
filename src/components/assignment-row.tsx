"use client";

import { cn } from "@/lib/utils";
import type { Assignment } from "@/lib/types";
import { UrgencyIndicator } from "./urgency-indicator";
import { Trash2, Check } from "lucide-react";

interface Props {
  assignment: Assignment;
  onComplete: () => void;
  onDelete: () => void;
}

export function AssignmentRow({ assignment, onComplete, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 group py-2 px-1">
      <button
        onClick={onComplete}
        className="w-5 h-5 rounded-md border-2 border-white/40 hover:border-white/60 flex items-center justify-center transition-all shrink-0"
      >
        <Check className="w-3 h-3 opacity-0 group-hover:opacity-50 text-white/50 transition-opacity" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{assignment.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {assignment.course && (
            <span className="text-[10px] font-mono text-white/40 border border-white/20 px-1.5 py-0.5 rounded">
              {assignment.course}
            </span>
          )}
          <span className="text-[10px] font-mono text-white/30">
            {assignment.estimated_minutes}min
          </span>
          <span
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded",
              assignment.priority === "urgent" && "text-white/50 bg-white/[0.04]",
              assignment.priority === "high" && "text-white/50 bg-white/[0.04]",
              assignment.priority === "medium" && "text-white/50 bg-white/[0.04]",
              assignment.priority === "low" && "text-white/50 bg-white/[0.04]"
            )}
          >
            {assignment.priority}
          </span>
        </div>
      </div>

      <UrgencyIndicator dueDate={assignment.due_date} />

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/60 shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
