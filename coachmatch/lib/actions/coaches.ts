"use server";

import { createClient } from "@/lib/supabase/server";

export type CoachFilters = {
  sport?: string;
  location?: string;
  maxRate?: number;
};

/**
 * Fetches verified coaches, joined with their public profile info,
 * optionally filtered by sport, training location, and max session rate.
 */
export async function getVerifiedCoaches(filters: CoachFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("coaches")
    .select(
      `id, bio, sports, session_rate, package_8_rate, training_locations,
       is_available_today, rating, total_reviews,
       profiles:profiles!coaches_id_fkey ( full_name, avatar_url )`
    )
    .eq("is_verified", true)
    .order("rating", { ascending: false });

  if (filters.sport) {
    query = query.contains("sports", [filters.sport]);
  }
  if (filters.location) {
    query = query.contains("training_locations", [filters.location]);
  }
  if (filters.maxRate) {
    query = query.lte("session_rate", filters.maxRate);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getCoachById(coachId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select(
      `id, bio, sports, session_rate, package_8_rate, training_locations,
       is_available_today, is_verified, rating, total_reviews, instapay_address,
       profiles:profiles!coaches_id_fkey ( full_name, avatar_url, phone )`
    )
    .eq("id", coachId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
