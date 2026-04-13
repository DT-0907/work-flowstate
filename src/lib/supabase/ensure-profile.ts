import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the authenticated user has a profile, life_area_scores, and user_settings rows.
 * Call this before any insert that has a FK to profiles(id).
 * Safe to call multiple times (uses ON CONFLICT DO NOTHING).
 */
export async function ensureProfile(supabase: SupabaseClient, userId: string, email?: string | null) {
  await supabase
    .from("profiles")
    .upsert({ id: userId, email: email || null }, { onConflict: "id" })
    .select()
    .single();

  // Also ensure life area scores and settings exist
  const areas = ["intellectual", "mental", "spiritual", "financial", "physical", "social"];
  for (const area of areas) {
    await supabase
      .from("life_area_scores")
      .upsert({ user_id: userId, area }, { onConflict: "user_id,area" });
  }

  await supabase
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  // Ensure default assignment grouping exists
  await supabase
    .from("assignment_groupings")
    .upsert({ user_id: userId, name: "Miscellaneous" }, { onConflict: "user_id,name" });
}
