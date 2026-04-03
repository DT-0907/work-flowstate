"use client";

import { useState, useEffect, useCallback } from "react";
import RadialOrbitalTimeline from "@/components/radial-orbital-timeline";
import { JournalEntryForm } from "@/components/journal-entry";
import { JournalCalendar } from "@/components/journal-calendar";
import { Calendar as CalendarIcon, Brain, Heart, Sparkles, DollarSign, Dumbbell, Users } from "lucide-react";
import type { LifeArea, LifeAreaScore } from "@/lib/types";

const AREA_ICONS: Record<LifeArea, React.ElementType> = {
  intellectual: Brain,
  mental: Heart,
  spiritual: Sparkles,
  financial: DollarSign,
  physical: Dumbbell,
  social: Users,
};

const AREA_LABELS: Record<LifeArea, string> = {
  intellectual: "Intellectual",
  mental: "Mental",
  spiritual: "Spiritual",
  financial: "Financial",
  physical: "Physical",
  social: "Social",
};

export default function GrowthPage() {
  const [scores, setScores] = useState<LifeAreaScore[]>([]);
  const [journalDate, setJournalDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchScores = useCallback(async () => {
    const res = await fetch("/api/growth/scores");
    if (res.ok) setScores(await res.json());
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const timelineData = (["intellectual", "mental", "spiritual", "financial", "physical", "social"] as LifeArea[]).map(
    (area, i) => {
      const score = scores.find((s) => s.area === area)?.score ?? 50;
      return {
        id: i + 1,
        title: AREA_LABELS[area],
        content: `Score: ${Math.round(score)}/100. Click to see habits contributing to your ${area} growth.`,
        icon: AREA_ICONS[area],
        relatedIds: i === 0 ? [2, 6] : i === 5 ? [1, 5] : [i, i + 2],
        status: (score >= 70 ? "completed" : score >= 40 ? "in-progress" : "pending") as "completed" | "in-progress" | "pending",
        energy: Math.round(score),
      };
    }
  );

  return (
    <div className="max-w-full mx-auto">
      {/* Radial orbital growth map */}
      <div className="pt-10 relative">
        <RadialOrbitalTimeline timelineData={timelineData} />
      </div>

      {/* Journal section */}
      <div className="px-4 pb-8 space-y-4 mt-2">
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Journal</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold text-zinc-300">Daily Reflection</h2>
          <button
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-primary transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Past entries
          </button>
        </div>

        <JournalEntryForm date={journalDate} />

        <JournalCalendar
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          onSelectDate={setJournalDate}
          selectedDate={journalDate}
        />
      </div>
    </div>
  );
}
