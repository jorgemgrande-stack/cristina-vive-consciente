/** Categorías de la ficha: varias a la vez, se guardan al marcar o desmarcar. */
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CLIENT_CATEGORIES } from "@shared/clientCategories";

export default function ClientCategoryEditor({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data: current = [] } = trpc.crm.clients.categories.useQuery({ clientId });
  const save = trpc.crm.clients.setCategories.useMutation({
    onSuccess: () => {
      utils.crm.clients.categories.invalidate({ clientId });
      utils.crm.clients.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const toggle = (key: string) => {
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    save.mutate({ clientId, categories: next });
  };
  return (
    <div className="bg-white border border-[oklch(0.92_0.01_80)] p-4 lg:p-5">
      <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest mb-3" style={{ fontWeight: 500 }}>
        Categorías
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías del cliente">
        {CLIENT_CATEGORIES.map((c) => {
          const on = current.includes(c.key);
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              disabled={save.isPending}
              onClick={() => toggle(c.key)}
              className={`min-h-[36px] px-3 text-xs font-body border transition-colors ${
                on
                  ? "bg-[oklch(0.52_0.08_148)] border-[oklch(0.52_0.08_148)] text-white"
                  : "bg-white border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] hover:border-[oklch(0.52_0.08_148)]"
              }`}
            >
              {on ? "✓ " : ""}
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
