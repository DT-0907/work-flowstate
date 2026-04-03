import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DayOverview } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

  const [habitsRes, assignmentsRes, completionsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("id, name, time_of_day")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("assignments")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .gte("due_date", startOfWeek.toISOString())
      .lte("due_date", endOfWeek.toISOString())
      .order("due_date"),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", startOfWeek.toISOString().split("T")[0])
      .lte("completed_date", endOfWeek.toISOString().split("T")[0]),
  ]);

  const habits = habitsRes.data || [];
  const assignments = assignmentsRes.data || [];
  const completions = completionsRes.data || [];

  const days: DayOverview[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    const dayCompletions = completions.filter((c) => c.completed_date === dateStr);
    const dayAssignments = assignments.filter((a) => {
      const dueDate = new Date(a.due_date).toISOString().split("T")[0];
      return dueDate === dateStr;
    });

    days.push({
      date: dateStr,
      dayName,
      habits: {
        total: habits.length,
        completed: dayCompletions.length,
      },
      assignments: dayAssignments,
      aiSuggestions: [], // Populated on demand when user clicks a day
    });
  }

  return NextResponse.json({ days });
}
