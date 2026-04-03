import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { task_id, task_type } = await request.json();
  if (!task_id || !task_type) {
    return NextResponse.json({ error: "task_id and task_type required" }, { status: 400 });
  }

  const { error } = await supabase.from("skipped_recommendations").insert({
    user_id: user.id,
    task_id,
    task_type,
    skipped_date: new Date().toISOString().split("T")[0],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
