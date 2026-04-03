import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/lib/ai/recommendations";
import { getTimeOfDay } from "@/lib/utils";
import type { TimeOfDay } from "@/lib/types";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const timeOfDay = (url.searchParams.get("timeOfDay") as TimeOfDay) || getTimeOfDay();

  const recommendations = await getRecommendations(user.id, timeOfDay);
  return NextResponse.json(recommendations);
}
