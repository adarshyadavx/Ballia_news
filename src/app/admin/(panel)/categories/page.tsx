import { redirect } from "next/navigation";
import { requireTeam } from "@/lib/auth";
import { addCategory, deleteCategory, updateCategory } from "../../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export default async function CategoriesPage() {
  const { supabase, profile } = await requireTeam();
  if (profile.role !== "admin") redirect("/admin");
  const [{ data: cats }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("*").order("display_order"),
    supabase.from("news").select("category_id"),
  ]);
  const used = new Map<string, number>();
  (counts ?? []).forEach((r) => used.set(r.category_id, (used.get(r.category_id) ?? 0) + 1));
  const input = "rounded-lg border bg-background px-2 py-1.5 text-sm";

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">Categories</h1>
      <form action={addCategory} className="mb-5 flex flex-wrap gap-2 rounded-lg border bg-background p-3">
        <input name="name" required placeholder="नाम (Hindi)" className={input} />
        <input name="slug" required placeholder="slug-in-english" pattern="[a-z0-9-]+" className={input} />
        <button className="rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground">Add category</button>
      </form>
      <div className="space-y-2">
        {(cats ?? []).map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-2">
            <form action={updateCategory} className="flex flex-1 flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className={`${input} w-40`} />
              <span className="text-xs text-muted-foreground">/{c.slug}</span>
              <label className="text-sm">Order <input name="display_order" type="number" defaultValue={c.display_order} className={`${input} w-16`} /></label>
              <label className="text-sm"><input type="checkbox" name="show_on_home" defaultChecked={c.show_on_home} /> Show on Home</label>
              <label className="text-sm"><input type="checkbox" name="is_visible" defaultChecked={c.is_visible} /> Visible</label>
              <button className="rounded-lg border px-3 py-1 text-sm font-semibold">Save</button>
            </form>
            {used.get(c.id) ? (
              <span className="text-xs text-muted-foreground">{used.get(c.id)} stories (hide only)</span>
            ) : (
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmButton message="Delete this category?" className="text-sm text-red-700 dark:text-red-400 underline">Delete</ConfirmButton>
              </form>
            )}
          </div>
        ))}
        {!cats?.length && <p className="text-muted-foreground">No categories yet. Run the seed SQL.</p>}
      </div>
    </div>
  );
}
