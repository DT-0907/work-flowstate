import { createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding, buildContextEmbeddingText } from "./embeddings";
import type { Recommendation, TimeOfDay } from "@/lib/types";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

interface SlotDistribution {
  habits: number;
  assignments: number;
}

function getSlotDistribution(timeOfDay: TimeOfDay): SlotDistribution {
  switch (timeOfDay) {
    case "morning":
      return { habits: 2, assignments: 1 };
    case "midday":
      return { habits: 1, assignments: 2 };
    case "night":
      return { habits: 1, assignments: 2 };
  }
}

async function embedWithTimeout(text: string, ms = 15000): Promise<number[]> {
  try {
    return await Promise.race([
      generateEmbedding(text),
      new Promise<number[]>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);
  } catch {
    return [];
  }
}

export async function getRecommendations(
  userId: string,
  timeOfDay: TimeOfDay
): Promise<Recommendation[]> {
  const supabase = await createServiceClient();

  // Quick check: if user has no tasks, return empty immediately
  const [hCount, aCount] = await Promise.all([
    supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_active", true),
    supabase.from("assignments").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("status", "completed"),
  ]);
  if ((hCount.count || 0) === 0 && (aCount.count || 0) === 0) return [];

  // Gather context for embedding
  const [habitsRes, assignmentsRes, completionsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("name, streak")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("streak", 3),
    supabase
      .from("assignments")
      .select("name, due_date")
      .eq("user_id", userId)
      .neq("status", "completed")
      .lte("due_date", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())
      .order("due_date"),
    supabase
      .from("habit_completions")
      .select("habit_id, habits(name)")
      .eq("user_id", userId)
      .eq("completed_date", new Date().toISOString().split("T")[0]),
  ]);

  const upcomingAssignments = (assignmentsRes.data || []).map(
    (a) => `${a.name} (due ${new Date(a.due_date).toLocaleDateString("en-US", { weekday: "short" })})`
  );
  const activeStreaks = (habitsRes.data || []).map((h) => `${h.name} (${h.streak}d streak)`);
  const completedToday = (completionsRes.data || []).map(
    (c: any) => c.habits?.name || "unknown"
  );

  // Build context embedding
  const contextText = buildContextEmbeddingText(timeOfDay, upcomingAssignments, activeStreaks, completedToday);
  const contextEmbedding = await embedWithTimeout(contextText);

  // If embedding failed, use Claude fallback directly
  if (contextEmbedding.length === 0) {
    return claudeFallback(userId, timeOfDay, supabase);
  }

  const distribution = getSlotDistribution(timeOfDay);

  // Query habits and assignments via RPC
  const [habitMatches, assignmentMatches] = await Promise.all([
    supabase.rpc("match_habits", {
      query_embedding: JSON.stringify(contextEmbedding),
      match_threshold: 0.1,
      match_count: distribution.habits + 3,
      p_user_id: userId,
      p_time_of_day: timeOfDay,
    }),
    supabase.rpc("match_assignments", {
      query_embedding: JSON.stringify(contextEmbedding),
      match_threshold: 0.1,
      match_count: distribution.assignments + 3,
      p_user_id: userId,
    }),
  ]);

  const habits: Recommendation[] = (habitMatches.data || []).map((h: any) => ({
    id: h.id,
    name: h.name,
    type: "habit" as const,
    description: h.description,
    time_of_day: h.time_of_day,
    streak: h.streak,
    similarity: h.similarity,
    final_score:
      0.35 * (h.similarity || 0) +
      0.3 * 0.5 +
      0.2 * Math.min((h.streak || 0) / 30, 1) +
      0.15 * 0.5,
  }));

  const assignments: Recommendation[] = (assignmentMatches.data || []).map((a: any) => {
    const urgencyNormalized = Math.min((a.urgency_score || 0) / 2, 1);
    return {
      id: a.id,
      name: a.name,
      type: "assignment" as const,
      description: a.description,
      course: a.course,
      due_date: a.due_date,
      estimated_minutes: a.estimated_minutes,
      priority: a.priority,
      similarity: a.similarity,
      urgency_score: a.urgency_score,
      final_score:
        0.35 * (a.similarity || 0) +
        0.3 * urgencyNormalized +
        0.2 * 0 +
        0.15 * 0.5,
    };
  });

  // Sort each by final score
  habits.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  assignments.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  // Fill slots by distribution
  const results: Recommendation[] = [];
  const habitSlots = habits.slice(0, distribution.habits);
  const assignmentSlots = assignments.slice(0, distribution.assignments);
  results.push(...habitSlots, ...assignmentSlots);

  // If we don't have 3, fill from the other type
  if (results.length < 3) {
    const remaining = 3 - results.length;
    const extraHabits = habits.slice(distribution.habits);
    const extraAssignments = assignments.slice(distribution.assignments);
    const extras = [...extraHabits, ...extraAssignments]
      .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
      .slice(0, remaining);
    results.push(...extras);
  }

  // If still under 3, try Claude fallback
  if (results.length < 3) {
    const fallback = await claudeFallback(userId, timeOfDay, supabase);
    // Merge without duplicates
    for (const fb of fallback) {
      if (results.length >= 3) break;
      if (!results.find((r) => r.id === fb.id)) {
        results.push(fb);
      }
    }
  }

  return results.slice(0, 3);
}

async function claudeFallback(
  userId: string,
  timeOfDay: TimeOfDay,
  supabase: any
): Promise<Recommendation[]> {
  try {
    // Fetch all active habits and pending assignments
    const [habitsRes, assignmentsRes] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, description, time_of_day, streak")
        .eq("user_id", userId)
        .eq("is_active", true),
      supabase
        .from("assignments")
        .select("id, name, description, course, due_date, estimated_minutes, priority")
        .eq("user_id", userId)
        .neq("status", "completed")
        .order("due_date"),
    ]);

    const habits = habitsRes.data || [];
    const assignments = assignmentsRes.data || [];

    if (habits.length === 0 && assignments.length === 0) return [];

    const now = new Date();
    const prompt = `You are a productivity assistant for a busy college student. It's currently ${timeOfDay} on ${now.toLocaleDateString("en-US", { weekday: "long" })}.

Here are their active habits:
${habits.map((h: any) => `- [${h.id}] "${h.name}" (${h.time_of_day}, streak: ${h.streak}d)`).join("\n")}

Here are their pending assignments:
${assignments.map((a: any) => `- [${a.id}] "${a.name}" for ${a.course} (due: ${a.due_date}, est: ${a.estimated_minutes}min, priority: ${a.priority})`).join("\n")}

Pick exactly 3 tasks they should do right now. Return ONLY a JSON array of objects with "id", "type" ("habit" or "assignment"), and "reason" (one short sentence). No other text.`;

    const result = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      prompt,
      maxOutputTokens: 300,
    });

    const parsed = JSON.parse(result.text);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 3).map((item: any) => {
      const habit = habits.find((h: any) => h.id === item.id);
      const assignment = assignments.find((a: any) => a.id === item.id);
      const source = habit || assignment;
      return {
        id: item.id,
        name: source?.name || "Unknown",
        type: item.type,
        description: source?.description,
        course: assignment?.course,
        due_date: assignment?.due_date,
        estimated_minutes: assignment?.estimated_minutes,
        priority: assignment?.priority,
        time_of_day: habit?.time_of_day,
        streak: habit?.streak,
        reason: item.reason,
      };
    });
  } catch (error) {
    console.error("Claude fallback failed:", error);
    return [];
  }
}
