import { createServiceClient } from "@/lib/supabase/server";
import type { Recommendation, TimeOfDay } from "@/lib/types";

export async function getRecommendations(
  userId: string,
  timeOfDay: TimeOfDay
): Promise<Recommendation[]> {
  const supabase = await createServiceClient();

  const today = new Date().toISOString().split("T")[0];

  // Fetch incomplete habits + today's completions
  const [habitsRes, completionsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("id, name, description, time_of_day, streak, completion_count")
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("user_id", userId)
      .eq("completed_date", today),
    supabase
      .from("assignments")
      .select("id, name, description, course, due_date, estimated_minutes, priority")
      .eq("user_id", userId)
      .neq("status", "completed")
      .order("due_date"),
  ]);

  const habits = habitsRes.data || [];
  const completedIds = new Set((completionsRes.data || []).map((c) => c.habit_id));
  const assignments = assignmentsRes.data || [];

  // Filter to incomplete habits
  const availableHabits = habits.filter((h) => !completedIds.has(h.id));

  if (availableHabits.length === 0 && assignments.length === 0) return [];

  // Score habits: time_of_day match + streak preservation + newer habits bonus
  const scoredHabits = availableHabits.map((h) => {
    let score = 0;
    if (h.time_of_day === timeOfDay) score += 3;
    if (h.streak > 0) score += 2 + Math.min(h.streak * 0.1, 1); // protect streaks
    if (h.completion_count < 10) score += 1; // boost newer habits
    return { ...h, score };
  });
  scoredHabits.sort((a, b) => b.score - a.score);

  // Score assignments: urgency + priority
  const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const scoredAssignments = assignments.map((a) => {
    const hoursLeft = (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    const urgency = hoursLeft < 0 ? 5 : hoursLeft < 24 ? 4 : hoursLeft < 72 ? 3 : hoursLeft < 168 ? 1.5 : 0.5;
    return { ...a, score: urgency + (priorityWeight[a.priority] || 1) };
  });
  scoredAssignments.sort((a, b) => b.score - a.score);

  const results: Recommendation[] = [];

  // Always: top 2 habits
  for (const h of scoredHabits.slice(0, 2)) {
    results.push({
      id: h.id,
      name: h.name,
      type: "habit",
      description: h.description,
      time_of_day: h.time_of_day,
      streak: h.streak,
      reason: h.streak > 0
        ? `${h.streak} day streak — keep it going`
        : h.time_of_day === timeOfDay
          ? `Good ${timeOfDay} habit`
          : "Build a new streak",
    });
  }

  // Always: top 1 assignment
  for (const a of scoredAssignments.slice(0, 1)) {
    const hoursLeft = (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    results.push({
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

  // Fill remaining if we don't have 3
  if (results.length < 3) {
    const usedIds = new Set(results.map((r) => r.id));
    const remaining = 3 - results.length;
    const extras = [
      ...scoredHabits.filter((h) => !usedIds.has(h.id)),
      ...scoredAssignments.filter((a) => !usedIds.has(a.id)),
    ].sort((a, b) => b.score - a.score);

    for (const item of extras.slice(0, remaining)) {
      if ("time_of_day" in item) {
        results.push({
          id: item.id,
          name: item.name,
          type: "habit",
          description: item.description,
          time_of_day: item.time_of_day,
          streak: item.streak,
          reason: "Suggested for you",
        });
      } else {
        results.push({
          id: item.id,
          name: item.name,
          type: "assignment",
          description: item.description,
          course: item.course,
          due_date: item.due_date,
          estimated_minutes: item.estimated_minutes,
          priority: item.priority,
          reason: "Suggested for you",
        });
      }
    }
  }

  return results.slice(0, 3);
}
