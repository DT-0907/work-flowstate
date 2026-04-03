"use client";

import { useCallback, useEffect, useState } from "react";
import type { Assignment, AssignmentPriority } from "@/lib/types";
import { AssignmentRow } from "./assignment-row";
import { Plus, X, BookOpen } from "lucide-react";

export function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [priority, setPriority] = useState<AssignmentPriority>("medium");

  const fetchAssignments = useCallback(async () => {
    const res = await fetch("/api/assignments");
    if (res.ok) setAssignments(await res.json());
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dueDate) return;
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        course: course.trim(),
        due_date: new Date(dueDate).toISOString(),
        estimated_minutes: parseInt(estimatedMinutes) || 60,
        priority,
      }),
    });
    setName("");
    setCourse("");
    setDueDate("");
    setEstimatedMinutes("60");
    setPriority("medium");
    setShowForm(false);
    fetchAssignments();
  };

  const completeAssignment = async (id: string) => {
    await fetch(`/api/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    fetchAssignments();
  };

  const deleteAssignment = async (id: string) => {
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    fetchAssignments();
  };

  return (
    <section className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-white/60" />
          <h2 className="text-base font-semibold text-white">Assignments</h2>
          <span className="text-xs text-white/30 font-mono">{assignments.length}</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-white/20 rounded-lg">
          <form onSubmit={addAssignment} className="p-3 space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Assignment name..."
              autoFocus
              className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Course"
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 px-2 py-1.5 rounded-lg outline-none border-2 border-white/20 focus:border-white/50"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-xs text-white px-2 py-1.5 rounded-lg outline-none border-2 border-white/20 focus:border-white/50 [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="Min"
                className="w-16 bg-transparent text-xs text-white px-2 py-1.5 rounded-lg outline-none border-2 border-white/20 focus:border-white/50"
              />
              <span className="text-xs text-white/30">min</span>
              <div className="flex gap-1 ml-2">
                {(["low", "medium", "high", "urgent"] as AssignmentPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`text-[10px] px-2 py-1 rounded-md transition-all ${
                      priority === p
                        ? "border-2 border-white text-white"
                        : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="ml-auto text-xs border-2 border-white/30 text-white px-3 py-1 rounded-lg hover:bg-white hover:text-black transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border-2 border-white/20 rounded-lg flex-1">
        <div className="divide-y divide-white/10 h-full">
          <div className="p-4 h-full">
            {assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                onComplete={() => completeAssignment(a.id)}
                onDelete={() => deleteAssignment(a.id)}
              />
            ))}
            {assignments.length === 0 && (
              <div className="p-8 text-center text-white/30 text-sm min-h-[120px] flex items-center justify-center">
                No assignments yet. Add your first one above.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
