import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateEmbedding,
  buildHabitEmbeddingText,
  buildAssignmentEmbeddingText,
} from "@/lib/ai/embeddings";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sync habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  let habitCount = 0;
  for (const habit of habits || []) {
    const text = buildHabitEmbeddingText(habit);
    const embedding = await generateEmbedding(text);
    if (embedding.length > 0) {
      await supabase
        .from("habits")
        .update({ embedding: JSON.stringify(embedding), embedding_text: text })
        .eq("id", habit.id);
      habitCount++;
    }
  }

  // Sync assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "completed");

  let assignmentCount = 0;
  for (const assignment of assignments || []) {
    const text = buildAssignmentEmbeddingText(assignment);
    const embedding = await generateEmbedding(text);
    if (embedding.length > 0) {
      await supabase
        .from("assignments")
        .update({ embedding: JSON.stringify(embedding), embedding_text: text })
        .eq("id", assignment.id);
      assignmentCount++;
    }
  }

  return NextResponse.json({
    synced: { habits: habitCount, assignments: assignmentCount },
  });
}
