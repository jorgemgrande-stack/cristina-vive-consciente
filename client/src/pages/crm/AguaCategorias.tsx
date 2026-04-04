/**
 * CRM — Máquinas de Agua > Categorías
 * Gestión de categorías de sistemas de agua
 */

import { useState } from "react";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Droplets,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

// ─── FORMULARIO DE CATEGORÍA ──────────────────────────────────────────────────

interface CategoryFormData {
  name: string;
  slug: string;
  shortDescription: string;
  imageUrl: string;
  icon: string;
  sortOrder: number;
  visibleEnPublico: number;
  status: "active" | "inactive";
}

const EMPTY_FORM: CategoryFormData = {
  name: "",
  slug: "",
  shortDescription: "",
  imageUrl: "",
  icon: "",
  sortOrder: 0,
  visibleEnPublico: 1,
  status: "active",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface CategoryFormProps {
  initial?: CategoryFormData & { id?: number };
  onSave: (data: CategoryFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function CategoryForm({ initial, onSave, onCancel, isSaving }: CategoryFormProps) {
  const [form, setForm] = useState<CategoryFormData>(initial ?? EMPTY_FORM);

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: initial?.id ? f.slug : slugify(name),
    }));
  };

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-serif text-[#1A1208]">
        {initial?.id ? "Editar categoría" : "Nueva categoría"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Nombre *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            placeholder="Ej: Ósmosis inversa"
          />
        </div>
        <div>
          <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] font-mono"
            placeholder="osmosis-inversa"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Descripción corta</label>
        <textarea
          value={form.shortDescription}
          onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
          rows={2}
          className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
          placeholder="Descripción breve de la categoría"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Icono (emoji o texto)</label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            placeholder="💧 o 🌊"
          />
        </div>
        <div>
          <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Orden</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
            className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-2">Imagen de categoría</label>
        <ImageUploader
          value={form.imageUrl}
          onChange={(url: string) => setForm((f) => ({ ...f, imageUrl: url }))}
          label="Imagen de categoría"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.visibleEnPublico === 1}
            onChange={(e) => setForm((f) => ({ ...f, visibleEnPublico: e.target.checked ? 1 : 0 }))}
            className="rounded border-[#E8E4DC] text-[#3A5A3A] focus:ring-[#3A5A3A]"
          />
          <span className="text-sm text-[#5A4E3E]">Visible en público</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.status === "active"}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "active" : "inactive" }))}
            className="rounded border-[#E8E4DC] text-[#3A5A3A] focus:ring-[#3A5A3A]"
          />
          <span className="text-sm text-[#5A4E3E]">Activa</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={isSaving || !form.name || !form.slug}
          className="flex items-center gap-2 px-5 py-2 bg-[#3A5A3A] text-white rounded-lg text-sm hover:bg-[#2E4A2E] transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {initial?.id ? "Guardar cambios" : "Crear categoría"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-[#E8E4DC] text-[#5A4E3E] rounded-lg text-sm hover:bg-[#F5F2EC] transition-colors"
        >
          <X size={14} />
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function AguaCategorias() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.water.admin.listCategories.useQuery();

  const createMutation = trpc.water.admin.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoría creada correctamente");
      utils.water.admin.listCategories.invalidate();
      setShowForm(false);
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const updateMutation = trpc.water.admin.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoría actualizada");
      utils.water.admin.listCategories.invalidate();
      setEditingId(null);
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const deleteMutation = trpc.water.admin.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoría eliminada");
      utils.water.admin.listCategories.invalidate();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const handleSaveNew = (data: CategoryFormData) => {
    createMutation.mutate(data);
  };

  const handleSaveEdit = (id: number, data: CategoryFormData) => {
    updateMutation.mutate({ id, data });
  };

  const handleToggleVisible = (id: number, current: number) => {
    updateMutation.mutate({ id, data: { visibleEnPublico: current === 1 ? 0 : 1 } });
  };

  const handleToggleStatus = (id: number, current: string) => {
    updateMutation.mutate({ id, data: { status: current === "active" ? "inactive" : "active" } });
  };

  const handleReorder = (id: number, direction: "up" | "down") => {
    if (!categories) return;
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const current = categories[idx];
    const swap = categories[swapIdx];
    updateMutation.mutate({ id: current.id, data: { sortOrder: swap.sortOrder } });
    updateMutation.mutate({ id: swap.id, data: { sortOrder: current.sortOrder } });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"? Esta acción no se puede deshacer.`)) return;
    deleteMutation.mutate({ id });
  };

  return (
    <CRMLayout title="Máquinas de Agua — Categorías">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-[#1A1208] flex items-center gap-2">
              <Droplets size={22} className="text-[#3A5A3A]" />
              Categorías de Sistemas de Agua
            </h1>
            <p className="text-sm text-[#7A6E5E] mt-1">
              Organiza los sistemas de agua por tipo. El orden aquí determina el orden en la web pública.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3A5A3A] text-white rounded-lg text-sm hover:bg-[#2E4A2E] transition-colors"
            >
              <Plus size={14} />
              Nueva categoría
            </button>
          )}
        </div>

        {/* Formulario de nueva categoría */}
        {showForm && (
          <CategoryForm
            onSave={handleSaveNew}
            onCancel={() => setShowForm(false)}
            isSaving={createMutation.isPending}
          />
        )}

        {/* Listado */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[#F5F2EC] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-center py-16 bg-[#FAFAF7] rounded-xl border border-dashed border-[#E8E4DC]">
            <Droplets size={36} className="mx-auto text-[#C0B8A8] mb-3" />
            <p className="text-[#7A6E5E] font-medium">No hay categorías todavía</p>
            <p className="text-sm text-[#A09080] mt-1">Crea la primera categoría para organizar los sistemas de agua</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat, idx) => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <CategoryForm
                    initial={{ ...cat, shortDescription: cat.shortDescription ?? "", imageUrl: cat.imageUrl ?? "", icon: cat.icon ?? "" }}
                    onSave={(data) => handleSaveEdit(cat.id, data)}
                    onCancel={() => setEditingId(null)}
                    isSaving={updateMutation.isPending}
                  />
                ) : (
                  <div className="flex items-center gap-4 bg-white border border-[#E8E4DC] rounded-xl p-4 hover:border-[#C8C0B0] transition-colors">
                    {/* Imagen */}
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#F0F4F0] flex items-center justify-center flex-shrink-0 text-xl">
                        {cat.icon || "💧"}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#1A1208] truncate">{cat.name}</p>
                        <span className="text-xs text-[#A09080] font-mono">{cat.slug}</span>
                      </div>
                      {cat.shortDescription && (
                        <p className="text-xs text-[#7A6E5E] mt-0.5 truncate">{cat.shortDescription}</p>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                        {cat.status === "active" ? "Activa" : "Inactiva"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cat.visibleEnPublico === 1 ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"}`}>
                        {cat.visibleEnPublico === 1 ? "Visible" : "Oculta"}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleReorder(cat.id, "up")}
                        disabled={idx === 0}
                        className="p-1.5 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded transition-colors disabled:opacity-30"
                        title="Subir"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReorder(cat.id, "down")}
                        disabled={idx === (categories?.length ?? 0) - 1}
                        className="p-1.5 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded transition-colors disabled:opacity-30"
                        title="Bajar"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleVisible(cat.id, cat.visibleEnPublico)}
                        className="p-1.5 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded transition-colors"
                        title={cat.visibleEnPublico === 1 ? "Ocultar" : "Mostrar"}
                      >
                        {cat.visibleEnPublico === 1 ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="p-1.5 text-[#A09080] hover:text-[#3A5A3A] hover:bg-[#F0F4F0] rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-[#A09080] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-[#F5F2EC] rounded-lg p-4 text-xs text-[#7A6E5E]">
          <p className="font-medium text-[#5A4E3E] mb-1">💡 Sobre las categorías</p>
          <p>El orden de aparición aquí determina el orden en la web pública. Usa las flechas ↑↓ para reordenar. Las categorías inactivas u ocultas no aparecen en la web.</p>
        </div>

      </div>
    </CRMLayout>
  );
}
