import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("journal_entries")
    .select("entry_date")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  const dates = (data || []).map((d) => d.entry_date);
  return NextResponse.json(dates);
}
