import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const date = body.date || new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("habit_completions")
    .insert({ habit_id: id, user_id: user.id, completed_date: date });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already completed" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate streak
  await supabase.rpc("recalculate_streak", { p_habit_id: id });

  // Update growth scores (fire-and-forget)
  fetch(new URL("/api/growth/scores", request.url).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "" },
    body: JSON.stringify({ habit_id: id, action: "complete" }),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("habit_completions")
    .delete()
    .eq("habit_id", id)
    .eq("user_id", user.id)
    .eq("completed_date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("recalculate_streak", { p_habit_id: id });

  return NextResponse.json({ success: true });
}
