"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LIFE_AREAS, AREA_LABELS, type LifeArea, type LifeAreaScore } from "@/lib/types";
import { TrendingUp, Brain, Heart, Sparkles, DollarSign, Dumbbell, Users } from "lucide-react";

const AREA_ICONS: Record<LifeArea, typeof Brain> = {
  intellectual: Brain,
  mental: Heart,
  spiritual: Sparkles,
  financial: DollarSign,
  physical: Dumbbell,
  social: Users,
};

interface Props {
  onSelectArea: (area: LifeArea) => void;
  selectedArea: LifeArea | null;
}

export function GrowthMap({ onSelectArea, selectedArea }: Props) {
  const [scores, setScores] = useState<LifeAreaScore[]>([]);

  const fetchScores = useCallback(async () => {
    const res = await fetch("/api/growth/scores");
    if (res.ok) setScores(await res.json());
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <TrendingUp className="w-4 h-4 text-white/60" />
        <h2 className="text-sm font-semibold text-white">Life Growth</h2>
      </div>

      {/* Hexagonal grid of 6 areas */}
      <div className="grid grid-cols-3 gap-3">
        {LIFE_AREAS.map((area) => {
          const score = scores.find((s) => s.area === area)?.score ?? 50;
          const Icon = AREA_ICONS[area];
          const isSelected = selectedArea === area;
          const pct = Math.round(score);

          return (
            <button
              key={area}
              onClick={() => onSelectArea(area)}
              className={cn(
                "border-2 rounded-lg p-3 flex flex-col items-center gap-2 transition-all duration-300",
                isSelected
                  ? "border-white scale-[1.03]"
                  : "border-white/20 hover:border-white/40"
              )}
            >
              <Icon className="w-5 h-5 text-white/60" />
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                {AREA_LABELS[area]}
              </span>

              {/* Score bar */}
              <div className="w-full">
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700 bg-white"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-white/60 text-center mt-1">{pct}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
