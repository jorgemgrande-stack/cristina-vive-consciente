/**
 * BlogCategorias — Gestor CRM de categorías del blog
 * Cristina Vive Consciente
 */
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

const EMPTY: CategoryForm = { name: "", slug: "", description: "", sortOrder: 0 };

export default function BlogCategorias() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY);
  const [slugManual, setSlugManual] = useState(false);

  const utils = trpc.useUtils();

  const { data: categories = [], isLoading } = trpc.blog.admin.listCategories.useQuery();

  const createMutation = trpc.blog.admin.createCategory.useMutation({
    onSuccess: () => {
      utils.blog.admin.listCategories.invalidate();
      toast.success("Categoría creada");
      resetForm();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateMutation = trpc.blog.admin.updateCategory.useMutation({
    onSuccess: () => {
      utils.blog.admin.listCategories.invalidate();
      toast.success("Categoría actualizada");
      resetForm();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteMutation = trpc.blog.admin.deleteCategory.useMutation({
    onSuccess: () => {
      utils.blog.admin.listCategories.invalidate();
      toast.success("Categoría eliminada");
    },
    onError: () => toast.error("Error al eliminar la categoría"),
  });

  function resetForm() {
    setForm(EMPTY);
    setShowForm(false);
    setEditId(null);
    setSlugManual(false);
  }

  function handleEdit(cat: typeof categories[0]) {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      sortOrder: cat.sortOrder ?? 0,
    });
    setSlugManual(true);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const slug = form.slug.trim() || toSlug(form.name);
    const data = { ...form, slug };
    if (editId) {
      updateMutation.mutate({ id: editId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: slugManual ? f.slug : toSlug(name),
    }));
  }

  return (
    <CRMLayout title="Blog — Categorías">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading text-[oklch(0.35_0.05_148)]">Categorías del Blog</h1>
            <p className="text-sm text-gray-500 font-body mt-1">Organiza los artículos por temática</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); setSlugManual(false); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-sm font-body hover:bg-[oklch(0.45_0.08_148)] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Plus size={16} />
              Nueva categoría
            </button>
          )}
        </div>

        {/* Inline form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="border border-[oklch(0.52_0.08_148)] p-4 space-y-4 bg-[oklch(0.97_0.01_148)]">
            <h3 className="text-sm font-medium text-gray-700 font-body">
              {editId ? "Editar categoría" : "Nueva categoría"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 font-body mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
                  style={{ borderRadius: 0 }}
                  placeholder="Ej: Aceites Esenciales"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 font-body mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                  className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
                  style={{ borderRadius: 0 }}
                  placeholder="aceites-esenciales"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 font-body mb-1">Descripción</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
                style={{ borderRadius: 0 }}
                placeholder="Descripción breve de la categoría"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.52_0.08_148)] text-white text-sm font-body hover:bg-[oklch(0.45_0.08_148)] transition-colors"
                style={{ borderRadius: 0 }}
              >
                <Check size={14} />
                {editId ? "Guardar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-body text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ borderRadius: 0 }}
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-400 font-body text-sm">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200">
            <p className="text-gray-400 font-body text-sm">No hay categorías todavía</p>
          </div>
        ) : (
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Descripción</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell line-clamp-1">
                      {cat.description ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-[oklch(0.52_0.08_148)] transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
                            deleteMutation.mutate({ id: cat.id });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
