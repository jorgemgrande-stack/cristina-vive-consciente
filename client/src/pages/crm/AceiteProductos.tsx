/**
 * AceiteProductos.tsx — Gestor de productos de aceites esenciales
 * CRM Cristina Vive Consciente
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Star, StarOff,
  ExternalLink, ChevronUp, ChevronDown, Search, X
} from "lucide-react";

const TIPO_OPTS = [
  { value: "aceite", label: "Aceite esencial" },
  { value: "mezcla", label: "Mezcla terapéutica" },
  { value: "base", label: "Base y dilución" },
  { value: "pack", label: "Pack y guía" },
  { value: "accesorio", label: "Accesorio" },
];

const EMPTY_FORM = {
  name: "",
  slug: "",
  category: "aceites-esenciales",
  tipoProducto: "aceite" as "aceite" | "mezcla" | "base" | "pack" | "accesorio",
  descripcion: "",
  beneficios: "[]",
  indicaciones: "[]",
  usoGeneral: "",
  mensajeConsulta: "",
  imagen: "",
  tags: "[]",
  destacado: 0,
  sortOrder: 0,
  visibleEnPublico: 1,
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

function parseJsonArray(val: string | null | undefined): string[] {
  try { return JSON.parse(val ?? "[]") as string[]; } catch { return []; }
}

function JsonArrayEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const items = parseJsonArray(value);
  const [newItem, setNewItem] = useState("");

  function addItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onChange(JSON.stringify([...items, trimmed]));
    setNewItem("");
  }

  function removeItem(idx: number) {
    const updated = items.filter((_, i) => i !== idx);
    onChange(JSON.stringify(updated));
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">{label}</label>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-[oklch(0.97_0.006_85)] px-3 py-1.5">
            <span className="flex-1 text-sm font-body text-[oklch(0.18_0.018_55)]">{item}</span>
            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          placeholder={placeholder ?? "Añadir elemento..."}
          className="font-body text-sm"
          style={{ borderRadius: 0 }}
        />
        <Button
          type="button"
          onClick={addItem}
          variant="outline"
          className="text-xs font-body border-[oklch(0.88_0.01_80)] px-3"
          style={{ borderRadius: 0 }}
        >
          <Plus size={13} />
        </Button>
      </div>
    </div>
  );
}

export default function AceiteProductos() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTipo, setFilterTipo] = useState("");

  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.oils.admin.listCategories.useQuery();
  const { data: products = [], isLoading } = trpc.oils.admin.listProducts.useQuery({
    search: search || undefined,
    category: filterCategory || undefined,
    tipoProducto: filterTipo || undefined,
  });

  const createMutation = trpc.oils.admin.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Producto creado correctamente");
      resetForm();
      utils.oils.admin.listProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.oils.admin.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("Producto actualizado");
      resetForm();
      utils.oils.admin.listProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.oils.admin.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("Producto eliminado");
      utils.oils.admin.listProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reorderMutation = trpc.oils.admin.reorderProduct.useMutation({
    onSuccess: () => utils.oils.admin.listProducts.invalidate(),
    onError: (e) => toast.error("Error al reordenar: " + e.message),
  });

  function moveProduct(index: number, direction: "up" | "down") {
    const sorted = [...products].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[targetIndex];
    reorderMutation.mutate({
      idA: a.id,
      sortA: a.sortOrder,
      idB: b.id,
      sortB: b.sortOrder,
    });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(p: typeof products[0]) {
    setForm({
      name: p.name,
      slug: p.slug,
      category: p.category,
      tipoProducto: p.tipoProducto,
      descripcion: p.descripcion ?? "",
      beneficios: p.beneficios ?? "[]",
      indicaciones: p.indicaciones ?? "[]",
      usoGeneral: p.usoGeneral ?? "",
      mensajeConsulta: p.mensajeConsulta ?? "",
      imagen: p.imagen ?? "",
      tags: p.tags ?? "[]",
      destacado: p.destacado,
      sortOrder: p.sortOrder,
      visibleEnPublico: p.visibleEnPublico,
      status: p.status,
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.slug.trim()) { toast.error("El slug es obligatorio"); return; }

    const data = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      tipoProducto: form.tipoProducto,
      descripcion: form.descripcion.trim() || undefined,
      beneficios: form.beneficios || "[]",
      indicaciones: form.indicaciones || "[]",
      usoGeneral: form.usoGeneral.trim() || undefined,
      mensajeConsulta: form.mensajeConsulta.trim() || undefined,
      imagen: form.imagen || undefined,
      tags: form.tags || "[]",
      destacado: form.destacado,
      sortOrder: form.sortOrder,
      visibleEnPublico: form.visibleEnPublico,
      status: form.status,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <CRMLayout title="Aceites Esenciales — Productos">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl text-[oklch(0.18_0.018_55)]">Productos de Aceites</h2>
            <p className="text-sm text-[oklch(0.52_0.04_80)] font-body mt-0.5">
              {products.length} producto{products.length !== 1 ? "s" : ""} en total
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
              className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white text-xs tracking-wider uppercase font-body gap-2"
              style={{ borderRadius: 0 }}
            >
              <Plus size={14} /> Nuevo producto
            </Button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white border border-[oklch(0.92_0.01_80)] p-6 space-y-5">
            <h3 className="font-display text-base text-[oklch(0.18_0.018_55)]">
              {editingId !== null ? "Editar producto" : "Nuevo producto"}
            </h3>

            {/* Nombre + Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Nombre *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editingId ? f.slug : slugify(e.target.value) }))}
                  placeholder="Lavanda Angustifolia"
                  className="font-body text-sm"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="lavanda-angustifolia"
                  className="font-body text-sm font-mono"
                  style={{ borderRadius: 0 }}
                />
              </div>
            </div>

            {/* Categoría + Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full text-sm font-body border border-[oklch(0.88_0.01_80)] px-3 py-2 bg-white text-[oklch(0.18_0.018_55)]"
                  style={{ borderRadius: 0 }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                  <option value="aceites-esenciales">Aceites esenciales (general)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Tipo de producto</label>
                <select
                  value={form.tipoProducto}
                  onChange={(e) => setForm((f) => ({ ...f, tipoProducto: e.target.value as typeof form.tipoProducto }))}
                  className="w-full text-sm font-body border border-[oklch(0.88_0.01_80)] px-3 py-2 bg-white text-[oklch(0.18_0.018_55)]"
                  style={{ borderRadius: 0 }}
                >
                  {TIPO_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Descripción</label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción del aceite, origen, proceso de extracción..."
                className="font-body text-sm resize-none"
                rows={3}
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Beneficios + Indicaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <JsonArrayEditor
                label="Beneficios clave"
                value={form.beneficios}
                onChange={(v) => setForm((f) => ({ ...f, beneficios: v }))}
                placeholder="Ej: Calma el sistema nervioso"
              />
              <JsonArrayEditor
                label="Indicaciones de uso"
                value={form.indicaciones}
                onChange={(v) => setForm((f) => ({ ...f, indicaciones: v }))}
                placeholder="Ej: Difusión ambiental, 4-6 gotas"
              />
            </div>

            {/* Uso general */}
            <div className="space-y-1">
              <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Uso general</label>
              <Textarea
                value={form.usoGeneral}
                onChange={(e) => setForm((f) => ({ ...f, usoGeneral: e.target.value }))}
                placeholder="Instrucciones generales de uso, dilución, precauciones..."
                className="font-body text-sm resize-none"
                rows={2}
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Mensaje consulta */}
            <div className="space-y-1">
              <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Mensaje personalizado de consulta</label>
              <Textarea
                value={form.mensajeConsulta}
                onChange={(e) => setForm((f) => ({ ...f, mensajeConsulta: e.target.value }))}
                placeholder="Texto que aparece en la ficha invitando al usuario a consultar con Cristina..."
                className="font-body text-sm resize-none"
                rows={2}
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Tags */}
            <JsonArrayEditor
              label="Etiquetas (para filtrado)"
              value={form.tags}
              onChange={(v) => setForm((f) => ({ ...f, tags: v }))}
              placeholder="Ej: relajante, digestivo, inmunidad..."
            />

            {/* Imagen */}
            <div className="space-y-1">
              <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Imagen del producto</label>
              <ImageUploader
                value={form.imagen}
                onChange={(url) => setForm((f) => ({ ...f, imagen: url }))}
                label="Imagen del producto"
                hint="JPG, PNG, WEBP hasta 20 MB"
              />
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="space-y-1">
                <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                  className="w-full text-sm font-body border border-[oklch(0.88_0.01_80)] px-2 py-2 bg-white text-[oklch(0.18_0.018_55)]"
                  style={{ borderRadius: 0 }}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.visibleEnPublico === 1}
                    onChange={(e) => setForm((f) => ({ ...f, visibleEnPublico: e.target.checked ? 1 : 0 }))}
                    className="w-4 h-4 accent-[oklch(0.52_0.08_148)]"
                  />
                  <span className="text-xs font-body text-[oklch(0.38_0.02_55)]">Visible en público</span>
                </label>
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.destacado === 1}
                    onChange={(e) => setForm((f) => ({ ...f, destacado: e.target.checked ? 1 : 0 }))}
                    className="w-4 h-4 accent-[oklch(0.52_0.08_148)]"
                  />
                  <span className="text-xs font-body text-[oklch(0.38_0.02_55)]">Destacado</span>
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white text-xs tracking-wider uppercase font-body gap-2"
                style={{ borderRadius: 0 }}
              >
                {isSaving && <Loader2 size={13} className="animate-spin" />}
                {editingId !== null ? "Guardar cambios" : "Crear producto"}
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

        {/* Filtros */}
        {!showForm && (
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.52_0.04_80)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="pl-8 font-body text-sm"
                style={{ borderRadius: 0 }}
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm font-body border border-[oklch(0.88_0.01_80)] px-3 py-2 bg-white text-[oklch(0.38_0.02_55)]"
              style={{ borderRadius: 0 }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="text-sm font-body border border-[oklch(0.88_0.01_80)] px-3 py-2 bg-white text-[oklch(0.38_0.02_55)]"
              style={{ borderRadius: 0 }}
            >
              <option value="">Todos los tipos</option>
              {TIPO_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {/* Listado */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[oklch(0.52_0.08_148)]" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-[oklch(0.52_0.04_80)] font-body text-sm">
            {search || filterCategory || filterTipo ? "No hay productos con esos filtros." : "No hay productos todavía."}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Nota: los botones de orden solo funcionan sin filtros activos */}
            {(!search && !filterCategory && !filterTipo) && (
              <p className="text-xs text-[oklch(0.52_0.04_80)] font-body italic">
                Usa las flechas ↑↓ para cambiar el orden de aparición en la web.
              </p>
            )}
            {[...products]
              .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
              .map((p, idx, arr) => (
              <div
                key={p.id}
                className="bg-white border border-[oklch(0.92_0.01_80)] flex items-center gap-4 px-4 py-3"
              >
                {/* Imagen */}
                {p.imagen ? (
                  <img src={p.imagen} alt={p.name} className="w-12 h-12 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-[oklch(0.95_0.01_80)] flex items-center justify-center text-2xl flex-shrink-0">
                    🌿
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body text-sm font-medium text-[oklch(0.18_0.018_55)] truncate">{p.name}</p>
                    {p.destacado === 1 && (
                      <span className="text-[0.6rem] font-body uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-700">
                        Destacado
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-[oklch(0.52_0.04_80)] truncate">{p.slug}</p>
                  <p className="text-xs text-[oklch(0.52_0.04_80)] font-body">
                    {TIPO_OPTS.find((o) => o.value === p.tipoProducto)?.label ?? p.tipoProducto} · {p.category}
                  </p>
                </div>

                {/* Estado */}
                <span className={`text-[0.65rem] font-body uppercase tracking-wider px-2 py-0.5 hidden sm:inline ${
                  p.status === "active" && p.visibleEnPublico === 1
                    ? "bg-[oklch(0.92_0.06_148)] text-[oklch(0.38_0.08_148)]"
                    : "bg-[oklch(0.94_0.01_80)] text-[oklch(0.52_0.04_80)]"
                }`}>
                  {p.status === "active" && p.visibleEnPublico === 1 ? "Visible" : "Oculto"}
                </span>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  {/* Botones de reordenación — solo visibles sin filtros */}
                  {(!search && !filterCategory && !filterTipo) && (
                    <div className="flex flex-col gap-0.5 mr-1">
                      <button
                        onClick={() => moveProduct(idx, "up")}
                        disabled={idx === 0 || reorderMutation.isPending}
                        className="p-0.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Mover arriba"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => moveProduct(idx, "down")}
                        disabled={idx === arr.length - 1 || reorderMutation.isPending}
                        className="p-0.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Mover abajo"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => updateMutation.mutate({ id: p.id, data: { destacado: p.destacado === 1 ? 0 : 1 } })}
                    className="p-1.5 text-amber-400 hover:text-amber-600 transition-colors"
                    title={p.destacado === 1 ? "Quitar destacado" : "Destacar"}
                  >
                    {p.destacado === 1 ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: p.id, data: { visibleEnPublico: p.visibleEnPublico === 1 ? 0 : 1 } })}
                    className="p-1.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] transition-colors"
                    title={p.visibleEnPublico === 1 ? "Ocultar" : "Publicar"}
                  >
                    {p.visibleEnPublico === 1 ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <a
                    href={`/aceites-esenciales/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] transition-colors"
                    title="Ver en web"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1.5 text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.18_0.018_55)] transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar "${p.name}"?`)) deleteMutation.mutate({ id: p.id });
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
