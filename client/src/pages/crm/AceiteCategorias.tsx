/**
 * AceiteCategorias.tsx — Gestor de categorías de aceites esenciales
 * CRM Cristina Vive Consciente
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  icon: "",
  sortOrder: 0,
  status: "active" as "active" | "inactive",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AceiteCategorias() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.oils.admin.listCategories.useQuery();

  const createMutation = trpc.oils.admin.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoría creada correctamente");
      resetForm();
      utils.oils.admin.listCategories.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.oils.admin.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoría actualizada");
      resetForm();
      utils.oils.admin.listCategories.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.oils.admin.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoría eliminada");
      utils.oils.admin.listCategories.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(cat: typeof categories[0]) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
      icon: cat.icon ?? "",
      sortOrder: cat.sortOrder,
      status: cat.status,
    });
    setEditingId(cat.id);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.slug.trim()) { toast.error("El slug es obligatorio"); return; }

    const data = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl || undefined,
      icon: form.icon.trim() || undefined,
      sortOrder: form.sortOrder,
      status: form.status,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function moveOrder(id: number, direction: "up" | "down") {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((c) => c.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = sorted[idx];
    const swap = sorted[swapIdx];
    updateMutation.mutate({ id: current.id, data: { sortOrder: swap.sortOrder } });
    updateMutation.mutate({ id: swap.id, data: { sortOrder: current.sortOrder } });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <CRMLayout title="Aceites Esenciales — Categorías">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-[oklch(0.18_0.018_55)]">Categorías de Aceites</h2>
            <p className="text-sm text-[oklch(0.52_0.04_80)] font-body mt-0.5">
              Organiza los aceites esenciales por tipo o uso terapéutico.
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
              className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white text-xs tracking-wider uppercase font-body gap-2"
              style={{ borderRadius: 0 }}
            >
              <Plus size={14} /> Nueva categoría
            </Button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white border border-[oklch(0.92_0.01_80)] p-6 space-y-4">
            <h3 className="font-display text-base text-[oklch(0.18_0.018_55)]">
              {editingId !== null ? "Editar categoría" : "Nueva categoría"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Nombre *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editingId ? f.slug : slugify(e.target.value) }))}
                  placeholder="Aceites esenciales"
                  className="font-body text-sm"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="aceites-esenciales"
                  className="font-body text-sm font-mono"
                  style={{ borderRadius: 0 }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Descripción</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción de la categoría..."
                className="font-body text-sm resize-none"
                rows={2}
                style={{ borderRadius: 0 }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Icono (emoji o código)</label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🌿"
                  className="font-body text-sm"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Orden</label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="font-body text-sm"
                  style={{ borderRadius: 0 }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Imagen de categoría</label>
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                label="Imagen de categoría"
                hint="JPG, PNG, WEBP hasta 20 MB"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Estado:</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                className="text-xs font-body border border-[oklch(0.88_0.01_80)] px-2 py-1 bg-white text-[oklch(0.18_0.018_55)]"
                style={{ borderRadius: 0 }}
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white text-xs tracking-wider uppercase font-body gap-2"
                style={{ borderRadius: 0 }}
              >
                {isSaving && <Loader2 size={13} className="animate-spin" />}
                {editingId !== null ? "Guardar cambios" : "Crear categoría"}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                className="text-xs tracking-wider uppercase font-body border-[oklch(0.88_0.01_80)] text-[oklch(0.38_0.02_55)]"
                style={{ borderRadius: 0 }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Listado */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[oklch(0.52_0.08_148)]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-[oklch(0.52_0.04_80)] font-body text-sm">
            No hay categorías todavía. Crea la primera.
          </div>
        ) : (
          <div className="space-y-2">
            {[...categories].sort((a, b) => a.sortOrder - b.sortOrder).map((cat, idx, arr) => (
              <div
                key={cat.id}
                className="bg-white border border-[oklch(0.92_0.01_80)] flex items-center gap-4 px-4 py-3"
              >
                {/* Imagen */}
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-[oklch(0.95_0.01_80)] flex items-center justify-center text-xl flex-shrink-0">
                    {cat.icon ?? "🌿"}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-[oklch(0.18_0.018_55)] truncate">{cat.name}</p>
                  <p className="font-mono text-xs text-[oklch(0.52_0.04_80)] truncate">{cat.slug}</p>
                </div>

                {/* Estado */}
                <span className={`text-[0.65rem] font-body uppercase tracking-wider px-2 py-0.5 ${
                  cat.status === "active"
                    ? "bg-[oklch(0.92_0.06_148)] text-[oklch(0.38_0.08_148)]"
                    : "bg-[oklch(0.94_0.01_80)] text-[oklch(0.52_0.04_80)]"
                }`}>
                  {cat.status === "active" ? "Activa" : "Inactiva"}
                </span>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveOrder(cat.id, "up")}
                    disabled={idx === 0}
                    className="p-1.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] disabled:opacity-30 transition-colors"
                    title="Subir"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveOrder(cat.id, "down")}
                    disabled={idx === arr.length - 1}
                    className="p-1.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] disabled:opacity-30 transition-colors"
                    title="Bajar"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: cat.id, data: { status: cat.status === "active" ? "inactive" : "active" } })}
                    className="p-1.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] transition-colors"
                    title={cat.status === "active" ? "Desactivar" : "Activar"}
                  >
                    {cat.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la categoría "${cat.name}"?`)) {
                        deleteMutation.mutate({ id: cat.id });
                      }
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
