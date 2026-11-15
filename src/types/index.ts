export type Role = "admin" | "editor";
export type NewsStatus = "draft" | "pending_review" | "published";

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  show_on_home: boolean;
  is_visible: boolean;
}

export interface News {
  id: string;
  headline: string;
  slug: string;
  summary: string;
  content: string;
  main_image: string;
  image_caption: string | null;
  category_id: string;
  area: string | null;
  tags: string[];
  youtube_url: string | null;
  writer_name: string | null;
  author_id: string | null;
  is_breaking: boolean;
  breaking_set_at: string | null;
  is_featured: boolean;
  featured_at: string | null;
  status: NewsStatus;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Automatic news (set only after supabase/migrations/0002_auto_news.sql is run)
  is_auto?: boolean;
  source_names?: string[];
  source_urls?: string[];
  image_type?: "library" | "stock" | "default" | "upload" | null;
  image_credit?: string | null;
  ai_confidence?: number | null;
  review_status?: "published" | "held" | "rejected";
  hold_reason?: string | null;
}

export interface Message {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: "new" | "read" | "done";
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}
