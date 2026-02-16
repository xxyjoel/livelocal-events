export const SITE_NAME = "LiveLocal";
export const SITE_DESCRIPTION = "Discover local events and live music near you";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://livelocal.events";

export const DEFAULT_RADIUS_KM = 25;
export const MAX_RADIUS_KM = 100;

export const ITEMS_PER_PAGE = 20;

export const SERVICE_FEE_PERCENT = 5; // 5% service fee on native tickets

export const CATEGORIES = [
  { name: "Concert", slug: "concerts", icon: "🎵", color: "#8B5CF6" },
  { name: "Comedy", slug: "comedy", icon: "😂", color: "#F59E0B" },
  { name: "Theater", slug: "theater", icon: "🎭", color: "#EF4444" },
  { name: "Festival", slug: "festivals", icon: "🎪", color: "#10B981" },
  { name: "Sports", slug: "sports", icon: "⚽", color: "#3B82F6" },
  { name: "Nightlife", slug: "nightlife", icon: "🌙", color: "#EC4899" },
  { name: "Arts", slug: "arts", icon: "🎨", color: "#F97316" },
  { name: "Community", slug: "community", icon: "🤝", color: "#06B6D4" },
] as const;

export const EVENT_STATUSES = {
  draft: { label: "Draft", color: "secondary" },
  published: { label: "Published", color: "default" },
  cancelled: { label: "Cancelled", color: "destructive" },
  soldout: { label: "Sold Out", color: "outline" },
  completed: { label: "Completed", color: "secondary" },
} as const;

export const DISTANCE_OPTIONS = [
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
] as const;
