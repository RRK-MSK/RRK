export type SiteMediaSection = "hero" | "gallery";
export type SiteMediaType = "image" | "video";

export type SiteMediaItem = {
  id: string;
  section: SiteMediaSection;
  mediaType: SiteMediaType;
  src: string;
  poster?: string;
  sortOrder: number;
};
