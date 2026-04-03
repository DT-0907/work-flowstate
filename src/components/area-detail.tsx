"use client";

import { useCallback, useEffect, useState } from "react";
import { AREA_LABELS, type LifeArea } from "@/lib/types";
import { X } from "lucide-react";

interface AreaHabit {
  id: string;
  name: string;
  streak: number;
  time_of_day: string;
  completion_count: number;
  relevance: number;
}

interface Props {
  area: LifeArea;
  onClose: () => void;
}

export function AreaDetail({ area, onClose }: Props) {
  const [habits, setHabits] = useState<AreaHabit[]>([]);

  const fetchHabits = useCallback(async () => {
    const res = await fetch(`/api/growth/mappings?area=${area}`);
    if (res.ok) setHabits(await res.json());
  }, [area]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  return (
    <div className="border-2 border-white/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {AREA_LABELS[area]} Habits
        </h3>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="text-xs text-white/30 py-2">
          No habits mapped to this area yet. Add habits with related keywords.
        </p>
      ) : (
        <div className="space-y-2">
          {habits.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-white/80">{h.name}</p>
                <p className="text-[10px] text-white/30 font-mono">
                  {h.streak}d streak / {h.completion_count} total / {Math.round(h.relevance * 100)}% relevance
                </p>
              </div>
              {h.completion_count >= 30 && (
                <span className="text-[9px] text-white/40 bg-white/5 border border-white/20 px-1.5 py-0.5 rounded">
                  diminishing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
