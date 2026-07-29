import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DayOverview } from "@/lib/types";
import { startOfWeekPT, addDaysPT, dayStartISO, dayEndISO, weekdayShort, toPacificDate } from "@/lib/date";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startOfWeek = startOfWeekPT(); // Monday, Pacific
  const endOfWeek = addDaysPT(startOfWeek, 6); // Sunday

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
      .gte("due_date", dayStartISO(startOfWeek))
      .lt("due_date", dayEndISO(endOfWeek))
      .order("due_date"),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", startOfWeek)
      .lte("completed_date", endOfWeek),
  ]);

  const habits = habitsRes.data || [];
  const assignments = assignmentsRes.data || [];
  const completions = completionsRes.data || [];

  const days: DayOverview[] = [];
  for (let i = 0; i < 7; i++) {
    const dateStr = addDaysPT(startOfWeek, i);
    const dayName = weekdayShort(dateStr);

    const dayCompletions = completions.filter((c) => c.completed_date === dateStr);
    const dayAssignments = assignments.filter(
      (a) => toPacificDate(new Date(a.due_date)) === dateStr
    );

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
