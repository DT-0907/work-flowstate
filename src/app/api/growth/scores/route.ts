import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LIFE_AREAS, AREA_KEYWORDS, type LifeArea } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure scores exist
  const { data: scores } = await supabase
    .from("life_area_scores")
    .select("area, score, updated_at")
    .eq("user_id", user.id);

  if (!scores || scores.length < 6) {
    // Init missing scores
    for (const area of LIFE_AREAS) {
      if (!scores?.find((s) => s.area === area)) {
        await supabase.from("life_area_scores").insert({ user_id: user.id, area, score: 50 });
      }
    }
    const { data: fresh } = await supabase.from("life_area_scores").select("area, score, updated_at").eq("user_id", user.id);
    return NextResponse.json(fresh);
  }

  return NextResponse.json(scores);
}

// Recalculate: called after habit completion or manually
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { habit_id, action } = body; // action: "complete" | "miss"

  if (!habit_id) return NextResponse.json({ error: "habit_id required" }, { status: 400 });

  // Get habit and its mappings
  const { data: habit } = await supabase.from("habits").select("*").eq("id", habit_id).single();
  if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

  let mappings = await getMappings(supabase, habit_id, habit.name, habit.description);

  const completionCount = habit.completion_count || 0;
  const diminishing = Math.max(0.2, 1 - completionCount / 40);

  for (const mapping of mappings) {
    let change: number;
    if (action === "complete") {
      change = 0.5 * mapping.relevance * diminishing;
    } else {
      change = -0.3 * mapping.relevance;
    }

    // Update score, clamped 0-100
    await supabase.rpc("update_area_score_clamped", {
      p_user_id: user.id,
      p_area: mapping.area,
      p_change: change,
    }).then(async (res) => {
      // Fallback if RPC doesn't exist yet
      if (res.error) {
        const { data: current } = await supabase
          .from("life_area_scores").select("score").eq("user_id", user.id).eq("area", mapping.area).single();
        const newScore = Math.max(0, Math.min(100, (current?.score || 50) + change));
        await supabase.from("life_area_scores").update({ score: newScore }).eq("user_id", user.id).eq("area", mapping.area);
      }
    });

    await supabase.from("score_changes").insert({
      user_id: user.id,
      area: mapping.area,
      change,
      reason: `${action === "complete" ? "Completed" : "Missed"}: ${habit.name}`,
    });
  }

  // Increment completion count on complete
  if (action === "complete") {
    await supabase.from("habits").update({ completion_count: completionCount + 1 }).eq("id", habit_id);
  }

  return NextResponse.json({ success: true });
}

async function getMappings(supabase: any, habitId: string, name: string, description: string) {
  const { data: existing } = await supabase
    .from("habit_area_mappings")
    .select("area, relevance")
    .eq("habit_id", habitId);

  if (existing && existing.length > 0) return existing;

  // Auto-generate mappings from keywords
  const text = `${name} ${description}`.toLowerCase();
  const mappings: { area: LifeArea; relevance: number }[] = [];

  for (const area of LIFE_AREAS) {
    const keywords = AREA_KEYWORDS[area];
    const matches = keywords.filter((k) => text.includes(k)).length;
    if (matches > 0) {
      const relevance = Math.min(1, matches * 0.3);
      mappings.push({ area, relevance });
      await supabase.from("habit_area_mappings").insert({ habit_id: habitId, area, relevance }).catch(() => {});
    }
  }

  // Default to intellectual if no matches
  if (mappings.length === 0) {
    const defaultMapping = { area: "intellectual" as LifeArea, relevance: 0.3 };
    await supabase.from("habit_area_mappings").insert({ habit_id: habitId, ...defaultMapping }).catch(() => {});
    mappings.push(defaultMapping);
  }

  return mappings;
}
