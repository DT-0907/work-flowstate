"use client";

import { useCallback, useEffect, useState } from "react";
import type { JournalEntry } from "@/lib/types";
import { BookHeart, Save, Loader2 } from "lucide-react";

interface Props {
  date: string;
}

export function JournalEntryForm({ date }: Props) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [goals, setGoals] = useState(["", "", ""]);
  const [appreciation, setAppreciation] = useState("");
  const [learned, setLearned] = useState("");
  const [improve, setImprove] = useState("");
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);

  const fetchEntry = useCallback(async () => {
    const res = await fetch(`/api/journal?date=${date}`);
    if (!res.ok) {
      console.error("Journal fetch failed:", res.status, await res.text());
      setExists(false);
      return;
    }
    const data = await res.json();
    if (data && data.id) {
      setEntry(data);
      setGoals(data.goals || ["", "", ""]);
      setAppreciation(data.appreciation || "");
      setLearned(data.learned || "");
      setImprove(data.improve || "");
      setExists(true);
    } else {
      setEntry(null);
      setGoals(["", "", ""]);
      setAppreciation("");
      setLearned("");
      setImprove("");
      setExists(false);
    }
  }, [date]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, goals, appreciation, learned, improve }),
    });
    if (!res.ok) {
      setSaving(false);
      return;
    }
    await fetchEntry();
    setSaving(false);
  };

  const createNew = async () => {
    setSaving(true);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, goals: ["", "", ""], appreciation: "", learned: "", improve: "" }),
    });
    if (!res.ok) {
      setSaving(false);
      return;
    }
    await fetchEntry();
    setSaving(false);
  };

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (!exists) {
    return (
      <div className="border-2 border-white/20 rounded-lg p-6 text-center space-y-3">
        <BookHeart className="w-8 h-8 text-white/60 mx-auto opacity-60" />
        <p className="text-sm text-white/40">No journal entry for {displayDate}</p>
        <button
          onClick={createNew}
          disabled={saving}
          className="text-xs border-2 border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Create Entry"}
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 border-white/20 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookHeart className="w-4 h-4 text-white/60" />
          <span className="text-xs text-white/40">{displayDate}</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      </div>

      {/* 3 Goals */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/30 uppercase tracking-wider font-medium">
          3 things I want to do today
        </label>
        {goals.map((goal, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-white/20 font-mono w-4">{i + 1}.</span>
            <input
              value={goal}
              onChange={(e) => {
                const g = [...goals];
                g[i] = e.target.value;
                setGoals(g);
              }}
              placeholder={`Goal ${i + 1}...`}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none border-b-2 border-white/20 py-1 focus:border-white/60 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Appreciation */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/30 uppercase tracking-wider font-medium">
          Something I appreciate today
        </label>
        <textarea
          value={appreciation}
          onChange={(e) => setAppreciation(e.target.value)}
          placeholder="What are you grateful for?"
          rows={2}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none border-2 border-white/20 rounded-lg p-2 focus:border-white/40 transition-colors resize-none"
        />
      </div>

      {/* Learned */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/30 uppercase tracking-wider font-medium">
          What I learned
        </label>
        <textarea
          value={learned}
          onChange={(e) => setLearned(e.target.value)}
          placeholder="Key takeaway from today..."
          rows={2}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none border-2 border-white/20 rounded-lg p-2 focus:border-white/40 transition-colors resize-none"
        />
      </div>

      {/* Improve */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/30 uppercase tracking-wider font-medium">
          What I could&apos;ve done better
        </label>
        <textarea
          value={improve}
          onChange={(e) => setImprove(e.target.value)}
          placeholder="Be honest with yourself..."
          rows={2}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none border-2 border-white/20 rounded-lg p-2 focus:border-white/40 transition-colors resize-none"
        />
      </div>
    </div>
  );
}
