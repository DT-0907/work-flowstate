import { supabase } from "./supabase";
import type {
  Habit,
  Assignment,
  AssignmentGrouping,
  Recommendation,
  LifeAreaScore,
  JournalEntry,
  UserSettings,
  DayOverview,
  TimeOfDay,
  AssignmentPriority,
  HabitFrequency,
} from "./types";
import { getTimeOfDay, todayISO } from "./utils";

// ── Auth ──

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ── Profile ──

export async function ensureProfile(userId: string, email?: string | null) {
  await supabase
    .from("profiles")
    .upsert({ id: userId, email: email || null }, { onConflict: "id" });

  const areas = ["intellectual", "mental", "spiritual", "financial", "physical", "social"];
  for (const area of areas) {
    await supabase
      .from("life_area_scores")
      .upsert({ user_id: userId, area, score: 50 }, { onConflict: "user_id,area" });
  }

  await supabase
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  // Ensure default grouping
  await supabase
    .from("assignment_groupings")
    .upsert({ user_id: userId, name: "Miscellaneous" }, { onConflict: "user_id,name" });
}

// ── Habits ──

export async function fetchHabits(): Promise<Habit[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const today = todayISO();
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name");

  if (!habits) return [];

  const { data: completions } = await supabase
    .from("habit_completions")
    .select("habit_id")
    .eq("user_id", user.id)
    .eq("completed_date", today);

  const completedIds = new Set((completions || []).map((c) => c.habit_id));

  return habits.map((h) => ({
    ...h,
    completed_today: completedIds.has(h.id),
  }));
}

export async function createHabit(data: {
  name: string;
  description?: string;
  time_of_day: TimeOfDay;
  frequency: HabitFrequency;
  custom_days?: number[];
}): Promise<Habit | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: habit, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description || "",
      time_of_day: data.time_of_day,
      frequency: data.frequency,
      custom_days: data.custom_days || [],
    })
    .select()
    .single();

  if (error || !habit) return null;
  return habit;
}

export async function deleteHabit(id: string) {
  await supabase.from("habits").update({ is_active: false }).eq("id", id);
}

export async function completeHabit(habitId: string, date?: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const completedDate = date || todayISO();

  await supabase
    .from("habit_completions")
    .upsert(
      { habit_id: habitId, user_id: user.id, completed_date: completedDate },
      { onConflict: "habit_id,completed_date" }
    );

  await supabase.rpc("recalculate_streak", { p_habit_id: habitId });
}

export async function uncompleteHabit(habitId: string, date?: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const completedDate = date || todayISO();

  await supabase
    .from("habit_completions")
    .delete()
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .eq("completed_date", completedDate);
}

// ── Assignment Groupings ──

export async function fetchGroupings(): Promise<AssignmentGrouping[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  // Ensure default grouping exists
  await supabase
    .from("assignment_groupings")
    .upsert({ user_id: user.id, name: "Miscellaneous" }, { onConflict: "user_id,name" });

  const { data } = await supabase
    .from("assignment_groupings")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return data || [];
}

export async function createGrouping(name: string): Promise<AssignmentGrouping | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("assignment_groupings")
    .insert({ user_id: user.id, name })
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function deleteGrouping(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  // Delete all assignments in this grouping
  await supabase
    .from("assignments")
    .delete()
    .eq("group_id", id)
    .eq("user_id", user.id);

  await supabase.from("assignment_groupings").delete().eq("id", id);
}

// ── Assignments ──

export async function fetchAssignments(): Promise<Assignment[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const today = todayISO();

  // Pending assignments (always show)
  const { data: pending } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "completed")
    .order("due_date", { ascending: true });

  // Completed assignments still within due date (show with strikethrough)
  const { data: completed } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("due_date", `${today}T00:00:00`)
    .order("due_date", { ascending: true });

  return [...(pending || []), ...(completed || [])];
}

export async function createAssignment(data: {
  name: string;
  description?: string;
  course?: string;
  due_date: string;
  estimated_minutes?: number;
  priority: AssignmentPriority;
  group_id?: string;
  repeats_weekly?: boolean;
}): Promise<Assignment | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // Default to Miscellaneous if no group_id
  let groupId = data.group_id;
  if (!groupId) {
    const { data: misc } = await supabase
      .from("assignment_groupings")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", "Miscellaneous")
      .single();
    groupId = misc?.id;
  }

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      user_id: user.id,
      group_id: groupId,
      name: data.name,
      description: data.description || "",
      course: data.course || "",
      due_date: data.due_date,
      estimated_minutes: data.estimated_minutes || 30,
      priority: data.priority,
      repeats_weekly: data.repeats_weekly || false,
    })
    .select()
    .single();

  if (error || !assignment) return null;
  return assignment;
}

export async function updateAssignment(id: string, updates: Partial<Assignment>) {
  await supabase.from("assignments").update(updates).eq("id", id);
}

export async function deleteAssignment(id: string) {
  await supabase.from("assignments").delete().eq("id", id);
}

export async function completeAssignment(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  // Get existing to check if it repeats
  const { data: existing } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) return;

  // Don't allow unchecking
  if (existing.status === "completed") return;

  await supabase
    .from("assignments")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);

  // If repeats weekly, create next week's copy
  if (existing.repeats_weekly) {
    const nextDueDate = new Date(existing.due_date);
    nextDueDate.setDate(nextDueDate.getDate() + 7);

    await supabase.from("assignments").insert({
      user_id: user.id,
      group_id: existing.group_id,
      name: existing.name,
      description: existing.description,
      course: existing.course,
      due_date: nextDueDate.toISOString(),
      estimated_minutes: existing.estimated_minutes,
      priority: existing.priority,
      repeats_weekly: true,
    });
  }
}

// ── Recommendations (algorithm-based, no AI) ──

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const tod = getTimeOfDay();
  const today = todayISO();

  // Fetch skipped
  const { data: skipped } = await supabase
    .from("skipped_recommendations")
    .select("task_id, task_type")
    .eq("user_id", user.id)
    .eq("skipped_date", today);

  const skippedHabitIds = new Set(
    (skipped || []).filter((s) => s.task_type === "habit").map((s) => s.task_id)
  );
  const skippedAssignmentIds = new Set(
    (skipped || []).filter((s) => s.task_type === "assignment").map((s) => s.task_id)
  );

  // Fetch available habits (not completed, not skipped)
  const habits = await fetchHabits();
  const availableHabits = habits.filter(
    (h) => !h.completed_today && !skippedHabitIds.has(h.id)
  );

  // Fetch available assignments (not skipped, not completed)
  const allAssignments = await fetchAssignments();
  const availableAssignments = allAssignments.filter(
    (a) => a.status !== "completed" && !skippedAssignmentIds.has(a.id)
  );

  if (availableHabits.length === 0 && availableAssignments.length === 0) return [];

  // Score habits: time_of_day match + streak preservation + newer habits bonus
  const scoredHabits = availableHabits.map((h) => {
    let score = 0;
    if (h.time_of_day === tod) score += 3;
    if (h.streak > 0) score += 2 + Math.min(h.streak * 0.1, 1);
    if (h.completion_count < 10) score += 1;
    return { ...h, score };
  });
  scoredHabits.sort((a, b) => b.score - a.score);

  // Score assignments: urgency + priority
  const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const scoredAssignments = availableAssignments.map((a) => {
    const hoursLeft = (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    const urgency = hoursLeft < 0 ? 5 : hoursLeft < 24 ? 4 : hoursLeft < 72 ? 3 : hoursLeft < 168 ? 1.5 : 0.5;
    return { ...a, score: urgency + (priorityWeight[a.priority] || 1) };
  });
  scoredAssignments.sort((a, b) => b.score - a.score);

  const recs: Recommendation[] = [];

  // Top 2 habits
  for (const h of scoredHabits.slice(0, 2)) {
    recs.push({
      id: h.id,
      name: h.name,
      type: "habit",
      description: h.description,
      time_of_day: h.time_of_day,
      streak: h.streak,
      reason: h.streak > 0
        ? `${h.streak} day streak — keep it going`
        : h.time_of_day === tod
          ? `Good ${tod} habit`
          : "Build a new streak",
    });
  }

  // Top 1 assignment
  for (const a of scoredAssignments.slice(0, 1)) {
    const hoursLeft = (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    recs.push({
      id: a.id,
      name: a.name,
      type: "assignment",
      description: a.description,
      course: a.course,
      due_date: a.due_date,
      estimated_minutes: a.estimated_minutes,
      priority: a.priority,
      reason: hoursLeft < 0
        ? "Overdue!"
        : hoursLeft < 24
          ? "Due today"
          : `Due ${new Date(a.due_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
    });
  }

  // Fill remaining slots to 3
  if (recs.length < 3) {
    const usedIds = new Set(recs.map((r) => r.id));
    const remaining = 3 - recs.length;
    const extras = [
      ...scoredHabits.filter((h) => !usedIds.has(h.id)),
      ...scoredAssignments.filter((a) => !usedIds.has(a.id)),
    ].sort((a, b) => b.score - a.score);

    for (const item of extras.slice(0, remaining)) {
      if ("time_of_day" in item) {
        recs.push({
          id: item.id, name: item.name, type: "habit",
          streak: (item as any).streak,
          reason: "Suggested for you",
        });
      } else {
        recs.push({
          id: item.id, name: item.name, type: "assignment",
          course: (item as any).course, due_date: (item as any).due_date,
          priority: (item as any).priority,
          reason: "Suggested for you",
        });
      }
    }
  }

  return recs.slice(0, 3);
}

export async function skipRecommendation(taskId: string, taskType: "habit" | "assignment") {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.from("skipped_recommendations").insert({
    user_id: user.id,
    task_id: taskId,
    task_type: taskType,
    skipped_date: todayISO(),
  });
}

// ── Life Area Scores ──

export async function fetchScores(): Promise<LifeAreaScore[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from("life_area_scores")
    .select("area, score, updated_at")
    .eq("user_id", user.id);

  return data || [];
}

// ── Journal ──

export async function fetchJournalEntry(date?: string): Promise<JournalEntry | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const entryDate = date || todayISO();
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)
    .single();

  return data || null;
}

export async function saveJournalEntry(entry: {
  date: string;
  goals: string[];
  appreciation: string;
  learned: string;
  improve: string;
}) {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.from("journal_entries").upsert(
    {
      user_id: user.id,
      entry_date: entry.date,
      goals: entry.goals,
      appreciation: entry.appreciation,
      learned: entry.learned,
      improve: entry.improve,
    },
    { onConflict: "user_id,entry_date" }
  );
}

export async function fetchJournalDates(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from("journal_entries")
    .select("entry_date")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  return (data || []).map((d) => d.entry_date);
}

// ── Settings ──

export async function fetchSettings(): Promise<UserSettings> {
  const user = await getCurrentUser();
  if (!user) return { theme: "dark", pomodoro_work: 25, pomodoro_break: 5 };

  const { data } = await supabase
    .from("user_settings")
    .select("theme, pomodoro_work, pomodoro_break")
    .eq("user_id", user.id)
    .single();

  return data || { theme: "dark", pomodoro_work: 25, pomodoro_break: 5 };
}

export async function updateSettings(updates: Partial<UserSettings>) {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.from("user_settings").update(updates).eq("user_id", user.id);
}

// ── Week Overview ──

export async function fetchWeekOverview(): Promise<DayOverview[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days: DayOverview[] = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const { data: completions } = await supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("user_id", user.id)
      .eq("completed_date", dateStr);

    const { data: habits } = await supabase
      .from("habits")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const { data: assignments } = await supabase
      .from("assignments")
      .select("*")
      .eq("user_id", user.id)
      .gte("due_date", `${dateStr}T00:00:00`)
      .lte("due_date", `${dateStr}T23:59:59`);

    days.push({
      date: dateStr,
      dayName: dayNames[i],
      habits: {
        total: habits?.length || 0,
        completed: completions?.length || 0,
      },
      assignments: assignments || [],
    });
  }

  return days;
}

// ── Stats ──

export async function fetchStats() {
  const user = await getCurrentUser();
  if (!user) return { activeStreaks: 0, completionRate: 0, assignmentsDueThisWeek: 0 };

  const habits = await fetchHabits();
  const activeStreaks = habits.filter((h) => h.streak > 0).length;

  const total = habits.length;
  const completed = habits.filter((h) => h.completed_today).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  const { data: dueAssignments } = await supabase
    .from("assignments")
    .select("id")
    .eq("user_id", user.id)
    .neq("status", "completed")
    .lte("due_date", endOfWeek.toISOString());

  return {
    activeStreaks,
    completionRate,
    assignmentsDueThisWeek: dueAssignments?.length || 0,
  };
}
