import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/auth";
import { NewsForm } from "@/components/admin/news-form";

export default async function EditNews({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireTeam();
  const [{ data: n }, { data: cats }] = await Promise.all([
    supabase.from("news").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name").order("display_order"),
  ]);
  if (!n) notFound();
  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">खबर संपादित करें</h1>
      <NewsForm isAdmin={profile.role === "admin"} categories={cats ?? []}
        initial={{
          id: n.id, slug: n.slug, headline: n.headline, summary: n.summary, content: n.content, main_image: n.main_image,
          image_caption: n.image_caption ?? "", category_id: n.category_id, area: n.area ?? "", tags: (n.tags ?? []).join(", "),
          youtube_url: n.youtube_url ?? "", writer_name: n.writer_name ?? "", is_breaking: n.is_breaking, is_featured: n.is_featured, status: n.status,
        }} />
    </div>
  );
}
