import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { generateEmbedding, buildAssignmentEmbeddingText } from "@/lib/ai/embeddings";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // Ensure default Miscellaneous grouping exists
  await supabase
    .from("assignment_groupings")
    .upsert({ user_id: user.id, name: "Miscellaneous" }, { onConflict: "user_id,name" });

  // Fetch groupings
  const { data: groupings } = await supabase
    .from("assignment_groupings")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  // Fetch assignments: show pending ones always, completed ones only until due date passes
  const { data: pending } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "completed")
    .order("due_date");

  const { data: completed } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("due_date", `${today}T00:00:00`)
    .order("due_date");

  const assignments = [...(pending || []), ...(completed || [])];

  return NextResponse.json({ groupings: groupings || [], assignments });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(supabase, user.id, user.email);

  const body = await request.json();
  const { name, description, course, due_date, estimated_minutes, priority, group_id, repeats_weekly } = body;

  if (!name || !due_date) {
    return NextResponse.json({ error: "Name and due_date required" }, { status: 400 });
  }

  // If no group_id provided, use Miscellaneous
  let finalGroupId = group_id;
  if (!finalGroupId) {
    const { data: misc } = await supabase
      .from("assignment_groupings")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", "Miscellaneous")
      .single();

    if (!misc) {
      // Create it
      const { data: newMisc } = await supabase
        .from("assignment_groupings")
        .insert({ user_id: user.id, name: "Miscellaneous" })
        .select()
        .single();
      finalGroupId = newMisc?.id;
    } else {
      finalGroupId = misc.id;
    }
  }

  const assignment = {
    name,
    description: description || "",
    course: course || "",
    due_date,
    estimated_minutes: estimated_minutes || 60,
    priority: priority || "medium",
    group_id: finalGroupId,
    repeats_weekly: repeats_weekly || false,
    user_id: user.id,
  };

  const embeddingText = buildAssignmentEmbeddingText(assignment);
  const embedding = await generateEmbedding(embeddingText);

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      ...assignment,
      embedding_text: embeddingText,
      ...(embedding.length > 0 ? { embedding: JSON.stringify(embedding) } : {}),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
