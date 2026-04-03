import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, buildAssignmentEmbeddingText } from "@/lib/ai/embeddings";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Mark completed
  if (body.status === "completed") {
    body.completed_at = new Date().toISOString();
  }

  // Re-generate embedding if content changed
  if (body.name || body.description || body.course) {
    const { data: existing } = await supabase.from("assignments").select("*").eq("id", id).single();
    if (existing) {
      const merged = { ...existing, ...body };
      const embeddingText = buildAssignmentEmbeddingText(merged);
      const embedding = await generateEmbedding(embeddingText);
      if (embedding.length > 0) {
        body.embedding = JSON.stringify(embedding);
        body.embedding_text = embeddingText;
      }
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
