import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("assignment_groupings")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureProfile(supabase, user.id, user.email);

  const body = await request.json();
  const { name, course } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  // Ensure default Miscellaneous group exists
  await supabase
    .from("assignment_groupings")
    .upsert({ user_id: user.id, name: "Miscellaneous" }, { onConflict: "user_id,name" });

  const { data, error } = await supabase
    .from("assignment_groupings")
    .insert({ user_id: user.id, name: name.trim(), course: course || "" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Don't allow deleting "Miscellaneous"
  const { data: grouping } = await supabase
    .from("assignment_groupings")
    .select("name")
    .eq("id", id)
    .single();

  if (grouping?.name === "Miscellaneous") {
    return NextResponse.json({ error: "Cannot delete default grouping" }, { status: 400 });
  }

  // Delete all assignments in this grouping
  await supabase
    .from("assignments")
    .delete()
    .eq("group_id", id)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("assignment_groupings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
