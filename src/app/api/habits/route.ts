import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { generateEmbedding, buildHabitEmbeddingText } from "@/lib/ai/embeddings";
import { LIFE_AREAS, AREA_KEYWORDS, type LifeArea } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  const [habitsRes, completionsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("time_of_day")
      .order("name"),
    supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("user_id", user.id)
      .eq("completed_date", today),
  ]);

  const completedIds = new Set((completionsRes.data || []).map((c) => c.habit_id));
  const habits = (habitsRes.data || []).map((h) => ({
    ...h,
    completed_today: completedIds.has(h.id),
  }));

  return NextResponse.json(habits);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(supabase, user.id, user.email);

  const body = await request.json();
  const { name, description, time_of_day, frequency, custom_days } = body;

  if (!name || !time_of_day) {
    return NextResponse.json({ error: "Name and time_of_day required" }, { status: 400 });
  }

  const habit = { name, description: description || "", time_of_day, frequency: frequency || "daily", custom_days: custom_days || [], user_id: user.id };

  // Generate embedding
  const embeddingText = buildHabitEmbeddingText({ ...habit, streak: 0 });
  const embedding = await generateEmbedding(embeddingText);

  const { data, error } = await supabase
    .from("habits")
    .insert({
      ...habit,
      embedding_text: embeddingText,
      ...(embedding.length > 0 ? { embedding: JSON.stringify(embedding) } : {}),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-map habit to life areas via keyword matching
  const text = `${name} ${description || ""}`.toLowerCase();
  for (const area of LIFE_AREAS) {
    const keywords = AREA_KEYWORDS[area];
    const matches = keywords.filter((k) => text.includes(k)).length;
    if (matches > 0) {
      const relevance = Math.min(1, matches * 0.3);
      await supabase
        .from("habit_area_mappings")
        .upsert({ habit_id: data.id, area, relevance }, { onConflict: "habit_id,area" });
    }
  }
  // Default to intellectual if no keywords matched
  const { count } = await supabase
    .from("habit_area_mappings")
    .select("id", { count: "exact", head: true })
    .eq("habit_id", data.id);
  if ((count || 0) === 0) {
    await supabase
      .from("habit_area_mappings")
      .insert({ habit_id: data.id, area: "intellectual" as LifeArea, relevance: 0.3 });
  }

  return NextResponse.json({ ...data, completed_today: false }, { status: 201 });
}
