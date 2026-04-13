import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, buildAssignmentEmbeddingText } from "@/lib/ai/embeddings";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Get existing assignment before updating
  const { data: existing } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent unchecking a completed assignment
  if (existing.status === "completed" && body.status && body.status !== "completed") {
    return NextResponse.json({ error: "Cannot uncheck a completed assignment" }, { status: 400 });
  }

  // Mark completed
  if (body.status === "completed" && existing.status !== "completed") {
    body.completed_at = new Date().toISOString();

    // If repeats weekly, create next week's copy
    if (existing.repeats_weekly) {
      const nextDueDate = new Date(existing.due_date);
      nextDueDate.setDate(nextDueDate.getDate() + 7);

      await supabase.from("assignments").insert({
        user_id: user.id,
        group_id: existing.group_id,
        name: existing.name,
        description: existing.description,
        course: existing.course,
        due_date: nextDueDate.toISOString(),
        estimated_minutes: existing.estimated_minutes,
        priority: existing.priority,
        repeats_weekly: true,
        embedding_text: existing.embedding_text,
        ...(existing.embedding ? { embedding: existing.embedding } : {}),
      });
    }
  }

  // Re-generate embedding if content changed
  if (body.name || body.description || body.course) {
    const merged = { ...existing, ...body };
    const embeddingText = buildAssignmentEmbeddingText(merged);
    const embedding = await generateEmbedding(embeddingText);
    if (embedding.length > 0) {
      body.embedding = JSON.stringify(embedding);
      body.embedding_text = embeddingText;
    }
  }

  const { data, error } = await supabase
    .from("assignments")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
