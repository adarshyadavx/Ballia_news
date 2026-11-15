import { requireTeam } from "@/lib/auth";
import { NewsForm } from "@/components/admin/news-form";

export default async function NewNews() {
  const { supabase, profile } = await requireTeam();
  const { data: cats } = await supabase.from("categories").select("id,name").order("display_order");
  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">नई खबर</h1>
      <NewsForm isAdmin={profile.role === "admin"} categories={cats ?? []}
        initial={{ headline: "", summary: "", content: "", main_image: "", image_caption: "", category_id: "", area: "",
          tags: "", youtube_url: "", writer_name: "", is_breaking: false, is_featured: false, status: "draft" }} />
    </div>
  );
}
