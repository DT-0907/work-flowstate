"use client";

import { useCallback, useEffect, useState } from "react";
import type { Assignment, AssignmentGrouping, AssignmentPriority } from "@/lib/types";
import { AssignmentRow } from "./assignment-row";
import { Plus, X, BookOpen, ChevronDown, ChevronRight, FolderPlus } from "lucide-react";

export function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groupings, setGroupings] = useState<AssignmentGrouping[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [priority, setPriority] = useState<AssignmentPriority>("medium");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [repeatsWeekly, setRepeatsWeekly] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/assignments");
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.assignments || []);
      const groups = data.groupings || [];
      setGroupings(groups);
      // Expand all groups by default
      setExpandedGroups((prev) => {
        if (prev.size === 0) return new Set(groups.map((g: AssignmentGrouping) => g.id));
        return prev;
      });
      // Default to first grouping (Miscellaneous) if none selected
      if (!selectedGroupId && groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    }
  }, [selectedGroupId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        group_id: selectedGroupId || undefined,
        repeats_weekly: repeatsWeekly,
      }),
    });
    setName("");
    setCourse("");
    setDueDate("");
    setEstimatedMinutes("60");
    setPriority("medium");
    setRepeatsWeekly(false);
    setShowForm(false);
    fetchData();
  };

  const completeAssignment = async (id: string) => {
    await fetch(`/api/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    fetchData();
  };

  const deleteAssignment = async (id: string) => {
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    fetchData();
  };

  const createGrouping = async () => {
    if (!newGroupName.trim()) return;
    await fetch("/api/assignment-groupings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    setNewGroupName("");
    setShowNewGroupForm(false);
    fetchData();
  };

  const deleteGrouping = async (id: string) => {
    await fetch(`/api/assignment-groupings?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  // Group assignments by group_id
  const assignmentsByGroup = new Map<string, Assignment[]>();
  const ungrouped: Assignment[] = [];
  for (const a of assignments) {
    if (a.group_id) {
      const list = assignmentsByGroup.get(a.group_id) || [];
      list.push(a);
      assignmentsByGroup.set(a.group_id, list);
    } else {
      ungrouped.push(a);
    }
  }

  return (
    <section className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-white/60" />
          <h2 className="text-base font-semibold text-white">Assignments</h2>
          <span className="text-xs text-white/30 font-mono">{assignments.filter(a => a.status !== "completed").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewGroupForm(!showNewGroupForm)}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
            title="New grouping"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancel" : "Add"}
          </button>
        </div>
      </div>

      {/* New grouping form */}
      {showNewGroupForm && (
        <div className="border-2 border-white/20 rounded-lg p-3 flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Grouping name (e.g. CS 61B)..."
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && createGrouping()}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
          />
          <button
            onClick={createGrouping}
            className="text-xs border-2 border-white/30 text-white px-3 py-1 rounded-lg hover:bg-white hover:text-black transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => { setShowNewGroupForm(false); setNewGroupName(""); }}
            className="text-xs text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add assignment form */}
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
            <div className="flex gap-2">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white px-2 py-1.5 rounded-lg outline-none border-2 border-white/20 focus:border-white/50 [color-scheme:dark]"
              >
                {groupings.map((g) => (
                  <option key={g.id} value={g.id} className="bg-black text-white">
                    {g.name}
                  </option>
                ))}
              </select>
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
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatsWeekly}
                  onChange={(e) => setRepeatsWeekly(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-white/40 bg-transparent accent-white"
                />
                <span className="text-xs text-white/60">Repeats weekly</span>
              </label>
              <button
                type="submit"
                className="text-xs border-2 border-white/30 text-white px-3 py-1 rounded-lg hover:bg-white hover:text-black transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grouped assignments */}
      <div className="border-2 border-white/20 rounded-lg flex-1 overflow-y-auto">
        {groupings.length === 0 && assignments.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm min-h-[120px] flex items-center justify-center">
            No assignments yet. Add your first one above.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {groupings.map((group) => {
              const groupAssignments = assignmentsByGroup.get(group.id) || [];
              const pendingCount = groupAssignments.filter(a => a.status !== "completed").length;
              const isExpanded = expandedGroups.has(group.id);

              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                    )}
                    <span className="text-sm font-medium text-white/80">{group.name}</span>
                    <span className="text-[10px] font-mono text-white/30">{pendingCount}</span>
                    {group.name !== "Miscellaneous" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteGrouping(group.id); }}
                        className="ml-auto text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-2">
                      {groupAssignments.length === 0 ? (
                        <p className="text-xs text-white/20 py-2 pl-6">No assignments</p>
                      ) : (
                        groupAssignments.map((a) => (
                          <AssignmentRow
                            key={a.id}
                            assignment={a}
                            onComplete={() => completeAssignment(a.id)}
                            onDelete={() => deleteAssignment(a.id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Ungrouped assignments (shouldn't happen normally) */}
            {ungrouped.length > 0 && (
              <div className="px-4 py-2">
                {ungrouped.map((a) => (
                  <AssignmentRow
                    key={a.id}
                    assignment={a}
                    onComplete={() => completeAssignment(a.id)}
                    onDelete={() => deleteAssignment(a.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
