import { requireTeam } from "@/lib/auth";
import { hindiDateTime } from "@/lib/dates";
import { setMessageStatus } from "../../actions";

export default async function MessagesPage() {
  const { supabase } = await requireTeam();
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(200);

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">Messages</h1>
      <div className="space-y-3">
        {(data ?? []).map((m) => {
          const digits = m.phone.replace(/\D/g, "");
          const wa = digits.length === 10 ? `91${digits}` : digits;
          return (
            <div key={m.id} className="rounded-lg border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><b>{m.name}</b> · {m.phone} <span className="text-xs text-muted-foreground">{hindiDateTime(m.created_at)}</span></div>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${m.status === "new" ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300" : m.status === "read" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300" : "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"}`}>{m.status}</span>
              </div>
              <p className="my-2 whitespace-pre-wrap">{m.message}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a href={`tel:${m.phone}`} className="rounded-lg border px-3 py-1 font-semibold">📞 Call</a>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-3 py-1 font-semibold">💬 WhatsApp</a>
                {(["new", "read", "done"] as const).filter((s) => s !== m.status).map((s) => (
                  <form key={s} action={setMessageStatus}>
                    <input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value={s} />
                    <button className="underline">Mark {s}</button>
                  </form>
                ))}
              </div>
            </div>
          );
        })}
        {!data?.length && <p className="text-muted-foreground">No messages yet.</p>}
      </div>
    </div>
  );
}
