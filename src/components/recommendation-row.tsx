"use client";

import { useCallback, useEffect, useState } from "react";
import { RecommendationCard } from "./recommendation-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Recommendation } from "@/lib/types";
import { Sparkles } from "lucide-react";

export function RecommendationRow() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations");
      if (res.ok) setRecs(await res.json());
    } catch (e) {
      console.error("Failed to fetch recommendations:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const handleSkip = async (rec: Recommendation) => {
    await fetch("/api/recommendations/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: rec.id, task_type: rec.type }),
    });
    fetchRecs();
  };

  const handleComplete = async (rec: Recommendation) => {
    if (rec.type === "habit") {
      await fetch(`/api/habits/${rec.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } else {
      await fetch(`/api/assignments/${rec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    }
    fetchRecs();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-white/40" />
          <h2 className="text-base font-semibold text-white/70">Do right now</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg border-2 border-white/10 bg-transparent" />
          ))}
        </div>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="border-2 border-white/20 rounded-lg p-8 text-center">
        <Sparkles className="w-8 h-8 text-white/40 mx-auto mb-3 opacity-60" />
        <p className="text-white/60 text-sm">You&apos;re all caught up!</p>
        <p className="text-white/30 text-xs mt-1">Add habits or assignments to get recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-white/40" />
        <h2 className="text-base font-semibold text-white/70">Do right now</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recs.map((rec) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            onSkip={() => handleSkip(rec)}
            onComplete={() => handleComplete(rec)}
          />
        ))}
      </div>
    </div>
  );
}
