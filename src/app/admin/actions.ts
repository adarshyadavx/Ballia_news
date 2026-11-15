"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTeam } from "@/lib/auth";
import { cleanHtml } from "@/lib/sanitize";
import { makeSlug } from "@/lib/slug";
import type { NewsStatus } from "@/types";

export async function signOut() {
  await (await createClient()).auth.signOut();
  redirect("/admin/login");
}

export type NewsInput = {
  id?: string;
  headline: string; summary: string; content: string;
  main_image: string; image_caption: string;
  category_id: string; area: string; tags: string; youtube_url: string; writer_name: string;
  is_breaking: boolean; is_featured: boolean;
  status: NewsStatus;
};

export type SaveResult = { ok: true; id: string; slug: string; status: NewsStatus } | { ok: false; error: string };

export async function saveNews(input: NewsInput): Promise<SaveResult> {
  const { supabase, user, profile } = await requireTeam();
  const isAdmin = profile.role === "admin";

  const headline = input.headline.trim();
  const summary = input.summary.trim();
  const content = cleanHtml(input.content);
  if (!headline) return { ok: false, error: "Headline is required." };
  if (!summary) return { ok: false, error: "Short summary is required." };
  if (summary.length > 300) return { ok: false, error: "Summary is too long (max about 200 characters)." };
  if (!content.replace(/<[^>]*>/g, "").trim()) return { ok: false, error: "Full story is required." };
  if (!input.main_image) return { ok: false, error: "Main photo is required." };
  if (!input.category_id) return { ok: false, error: "Please choose a category." };

  // Editors can never publish.
  let status = input.status;
  if (!isAdmin && status === "published") status = "pending_review";

  const row = {
    headline, summary, content,
    main_image: input.main_image,
    image_caption: input.image_caption.trim() || null,
    category_id: input.category_id,
    area: input.area || null,
    tags: input.tags.split(",").map((t) => t.trim()).filter(Boolean),
    youtube_url: input.youtube_url.trim() || null,
    writer_name: input.writer_name.trim() || null,
    is_breaking: isAdmin ? input.is_breaking : false,
    is_featured: isAdmin ? input.is_featured : false,
    status,
  };

  if (input.id) {
    const { data, error } = await supabase.from("news").update(row).eq("id", input.id).select("id,slug,status").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true, id: data.id, slug: data.slug, status: data.status };
  }
  const { data, error } = await supabase.from("news")
    .insert({ ...row, slug: makeSlug(headline), author_id: user.id }).select("id,slug,status").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, id: data.id, slug: data.slug, status: data.status };
}

export async function setNewsStatus(formData: FormData) {
  const { supabase, profile } = await requireTeam();
  if (profile.role !== "admin") return;
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as NewsStatus;
  if (!["draft", "published"].includes(status)) return;
  await supabase.from("news").update({ status }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteNews(formData: FormData) {
  const { supabase, profile } = await requireTeam();
  if (profile.role !== "admin") return;
  await supabase.from("news").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

export async function addCategory(formData: FormData) {
  const { supabase, profile } = await requireTeam();
  if (profile.role !== "admin") return;
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (!name || !slug) return;
  const { data } = await supabase.from("categories").select("display_order").order("display_order", { ascending: false }).limit(1);
  await supabase.from("categories").insert({ name, slug, display_order: (data?.[0]?.display_order ?? 0) + 1, show_on_home: false });
  revalidatePath("/", "layout");
}

export async function updateCategory(formData: FormData) {
  const { supabase, profile } = await requireTeam();
  if (profile.role !== "admin") return;
  await supabase.from("categories").update({
    name: String(formData.get("name")).trim(),
    display_order: Number(formData.get("display_order")) || 0,
    show_on_home: formData.get("show_on_home") === "on",
    is_visible: formData.get("is_visible") === "on",
  }).eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

export async function deleteCategory(formData: FormData) {
  const { supabase, profile } = await requireTeam();
  if (profile.role !== "admin") return;
  const id = String(formData.get("id"));
  const { count } = await supabase.from("news").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) return; // categories with stories can only be hidden
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function setMessageStatus(formData: FormData) {
  const { supabase } = await requireTeam();
  const status = String(formData.get("status"));
  if (!["new", "read", "done"].includes(status)) return;
  await supabase.from("messages").update({ status }).eq("id", String(formData.get("id")));
  revalidatePath("/admin/messages");
}

// ---------- Auto News (admin only) ----------
async function adminOnly() {
  const ctx = await requireTeam();
  if (ctx.profile.role !== "admin") redirect("/admin");
  return ctx;
}

export async function setAutoSetting(formData: FormData) {
  const { supabase } = await adminOnly();
  const key = String(formData.get("key"));
  if (!["autoNews.enabled", "autoNews.autoPublish"].includes(key)) return;
  await supabase.from("app_settings").upsert({ key, value: formData.get("value") === "true", updated_at: new Date().toISOString() });
  revalidatePath("/admin/auto-news");
}

export async function publishHeld(formData: FormData) {
  const { supabase } = await adminOnly();
  await supabase.from("news").update({ status: "published", review_status: "published", hold_reason: null }).eq("id", String(formData.get("id"))).eq("is_auto", true);
  revalidatePath("/", "layout");
}

export async function deleteHeld(formData: FormData) {
  const { supabase } = await adminOnly();
  await supabase.from("news").delete().eq("id", String(formData.get("id"))).eq("is_auto", true).eq("status", "draft");
  revalidatePath("/admin/auto-news");
}

export async function addSource(formData: FormData) {
  const { supabase } = await adminOnly();
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const type = String(formData.get("type"));
  if (!name || !/^https?:\/\//.test(url) || !["google-news", "publisher", "official", "api"].includes(type)) return;
  await supabase.from("sources").insert({ name, url, type });
  revalidatePath("/admin/auto-news");
}

export async function toggleSource(formData: FormData) {
  const { supabase } = await adminOnly();
  await supabase.from("sources").update({ enabled: formData.get("enabled") === "true" }).eq("id", String(formData.get("id")));
  revalidatePath("/admin/auto-news");
}

export async function deleteSource(formData: FormData) {
  const { supabase } = await adminOnly();
  await supabase.from("sources").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/auto-news");
}

export async function addLibraryImage(input: { image_url: string; category_slug: string; area: string; keywords: string; credit: string }) {
  const { supabase } = await adminOnly();
  if (!input.image_url) return { ok: false as const, error: "Choose a photo first." };
  const { error } = await supabase.from("image_library").insert({
    image_url: input.image_url, category_slug: input.category_slug || null, area: input.area || null,
    keywords: input.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean),
    credit: input.credit.trim() || "बलिया न्यूज़",
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/auto-news");
  return { ok: true as const };
}

export async function deleteLibraryImage(formData: FormData) {
  const { supabase } = await adminOnly();
  await supabase.from("image_library").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/auto-news");
}
