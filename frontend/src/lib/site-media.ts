import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { SiteMediaItem, SiteMediaSection, SiteMediaType } from "@/lib/site-media-types";

export type { SiteMediaItem, SiteMediaSection, SiteMediaType } from "@/lib/site-media-types";

export const SITE_CONTENT_BUCKET = "site-content";

type SiteMediaRow = {
  id: string;
  section: SiteMediaSection;
  media_type: SiteMediaType;
  storage_path: string;
  poster_path: string | null;
  sort_order: number;
};

export function getSiteMediaPublicUrl(path: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !path) {
    return "";
  }

  const { data } = supabase.storage.from(SITE_CONTENT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSiteMediaItems(section?: SiteMediaSection) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [] as SiteMediaItem[];
  }

  let query = supabase
    .from("site_media")
    .select("id, section, media_type, storage_path, poster_path, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (section) {
    query = query.eq("section", section);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load site media", error);
    return [] as SiteMediaItem[];
  }

  return ((data ?? []) as SiteMediaRow[]).map((row) => ({
    id: row.id,
    section: row.section,
    mediaType: row.media_type,
    src: getSiteMediaPublicUrl(row.storage_path),
    poster: row.poster_path ? getSiteMediaPublicUrl(row.poster_path) : undefined,
    sortOrder: row.sort_order,
  }));
}

export async function ensureSiteContentBucket() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Failed to list storage buckets", error);
    return;
  }

  if (buckets?.some((bucket) => bucket.id === SITE_CONTENT_BUCKET || bucket.name === SITE_CONTENT_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(SITE_CONTENT_BUCKET, {
    public: true,
    fileSizeLimit: 41943040,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    console.error("Failed to create site-content bucket", createError);
  }
}
