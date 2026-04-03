import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { generateEmbedding, buildAssignmentEmbeddingText } from "@/lib/ai/embeddings";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "completed")
    .order("due_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(supabase, user.id, user.email);

  const body = await request.json();
  const { name, description, course, due_date, estimated_minutes, priority } = body;

  if (!name || !due_date) {
    return NextResponse.json({ error: "Name and due_date required" }, { status: 400 });
  }

  const assignment = {
    name,
    description: description || "",
    course: course || "",
    due_date,
    estimated_minutes: estimated_minutes || 60,
    priority: priority || "medium",
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
