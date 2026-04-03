import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const area = url.searchParams.get("area");

  if (area) {
    // Get habits mapped to a specific area
    const { data } = await supabase
      .from("habit_area_mappings")
      .select("habit_id, relevance, habits(id, name, streak, time_of_day, completion_count)")
      .eq("area", area);

    const habits = (data || []).map((m: any) => ({
      ...m.habits,
      relevance: m.relevance,
    }));

    return NextResponse.json(habits);
  }

  // Get all mappings
  const { data } = await supabase
    .from("habit_area_mappings")
    .select("habit_id, area, relevance");

  return NextResponse.json(data || []);
}
