/**
 * CRM — Máquinas de Agua > Productos
 * Gestión completa de productos de sistemas de agua
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ArrowUp,
  ArrowDown,
  Droplets,
  X,
  Save,
  Loader2,
  ExternalLink,
  Star,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface ProductFormData {
  title: string;
  slug: string;
  subtitle: string;
  categoryId: number | null;
  shortDescription: string;
  longDescription: string;
  claimsHighlighted: string;   // JSON array de strings
  benefits: string;            // JSON array de strings
  forWhom: string;
  priceVisible: string;
  priceFrom: string;
  priceOrientative: string;
  mainImage: string;
  galleryImages: string;       // JSON array de URLs
  badge: string;
  badgeColor: string;
  technicalSpecs: string;      // JSON [{key,value}]
  installationText: string;
  maintenanceText: string;
  warrantyText: string;
  bulletAdvantages: string;    // JSON array
  whyChooseBlock: string;
  expertBlock: string;
  faqBlock: string;            // JSON [{q,a}]
  testimonialsBlock: string;   // JSON [{name,text,rating}]
  trustBlock: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  visibleEnPublico: number;
  destacadoEnHome: number;
  productoPrincipal: number;
  status: "active" | "inactive";
}

const EMPTY_FORM: ProductFormData = {
  title: "",
  slug: "",
  subtitle: "",
  categoryId: null,
  shortDescription: "",
  longDescription: "",
  claimsHighlighted: "[]",
  benefits: "[]",
  forWhom: "",
  priceVisible: "",
  priceFrom: "",
  priceOrientative: "",
  mainImage: "",
  galleryImages: "[]",
  badge: "",
  badgeColor: "",
  technicalSpecs: "[]",
  installationText: "",
  maintenanceText: "",
  warrantyText: "",
  bulletAdvantages: "[]",
  whyChooseBlock: "",
  expertBlock: "",
  faqBlock: "[]",
  testimonialsBlock: "[]",
  trustBlock: "",
  ctaPrimaryLabel: "Reservar sistema",
  ctaSecondaryLabel: "Conocer más detalles",
  seoTitle: "",
  seoDescription: "",
  sortOrder: 0,
  visibleEnPublico: 1,
  destacadoEnHome: 0,
  productoPrincipal: 0,
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

// ─── EDITOR DE ARRAY JSON (bullets, claims, beneficios) ──────────────────────

function ArrayEditor({
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
  const items: string[] = useMemo(() => {
    try { return JSON.parse(value) as string[]; } catch { return []; }
  }, [value]);

  const update = (newItems: string[]) => onChange(JSON.stringify(newItems));

  return (
    <div>
      <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                update(next);
              }}
              className="flex-1 border border-[#E8E4DC] rounded px-3 py-1.5 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => update(items.filter((_, j) => j !== i))}
              className="p-1.5 text-[#A09080] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...items, ""])}
          className="flex items-center gap-1.5 text-xs text-[#3A5A3A] hover:text-[#2E4A2E] transition-colors"
        >
          <Plus size={12} />
          Añadir elemento
        </button>
      </div>
    </div>
  );
}

// ─── EDITOR DE FAQ ────────────────────────────────────────────────────────────

function FaqEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items: { q: string; a: string }[] = useMemo(() => {
    try { return JSON.parse(value); } catch { return []; }
  }, [value]);

  const update = (newItems: { q: string; a: string }[]) => onChange(JSON.stringify(newItems));

  return (
    <div>
      <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-2">Preguntas frecuentes</label>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-[#FAFAF7] border border-[#E8E4DC] rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs text-[#A09080]">Pregunta {i + 1}</span>
              <button
                type="button"
                onClick={() => update(items.filter((_, j) => j !== i))}
                className="p-1 text-[#A09080] hover:text-red-500 rounded transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <input
              type="text"
              value={item.q}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], q: e.target.value };
                update(next);
              }}
              placeholder="¿Cuál es la pregunta?"
              className="w-full border border-[#E8E4DC] rounded px-3 py-1.5 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            />
            <textarea
              value={item.a}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], a: e.target.value };
                update(next);
              }}
              placeholder="Respuesta..."
              rows={2}
              className="w-full border border-[#E8E4DC] rounded px-3 py-1.5 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...items, { q: "", a: "" }])}
          className="flex items-center gap-1.5 text-xs text-[#3A5A3A] hover:text-[#2E4A2E] transition-colors"
        >
          <Plus size={12} />
          Añadir pregunta
        </button>
      </div>
    </div>
  );
}

// ─── EDITOR DE ESPECIFICACIONES TÉCNICAS ─────────────────────────────────────

function SpecsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items: { key: string; value: string }[] = useMemo(() => {
    try { return JSON.parse(value); } catch { return []; }
  }, [value]);

  const update = (newItems: { key: string; value: string }[]) => onChange(JSON.stringify(newItems));

  return (
    <div>
      <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-2">Especificaciones técnicas</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item.key}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], key: e.target.value };
                update(next);
              }}
              placeholder="Característica"
              className="w-2/5 border border-[#E8E4DC] rounded px-3 py-1.5 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], value: e.target.value };
                update(next);
              }}
              placeholder="Valor"
              className="flex-1 border border-[#E8E4DC] rounded px-3 py-1.5 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            />
            <button
              type="button"
              onClick={() => update(items.filter((_, j) => j !== i))}
              className="p-1.5 text-[#A09080] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...items, { key: "", value: "" }])}
          className="flex items-center gap-1.5 text-xs text-[#3A5A3A] hover:text-[#2E4A2E] transition-colors"
        >
          <Plus size={12} />
          Añadir especificación
        </button>
      </div>
    </div>
  );
}

// ─── FORMULARIO COMPLETO DE PRODUCTO ─────────────────────────────────────────

interface ProductFormProps {
  initial?: Partial<ProductFormData> & { id?: number };
  categories: { id: number; name: string }[];
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function ProductForm({ initial, categories, onSave, onCancel, isSaving }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM, ...initial });
  const [section, setSection] = useState<"basic" | "content" | "technical" | "blocks" | "seo">("basic");

  const set = (key: keyof ProductFormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: initial?.id ? f.slug : slugify(title),
      seoTitle: initial?.id ? f.seoTitle : (f.seoTitle || title),
    }));
  };

  const SECTIONS = [
    { id: "basic", label: "Información básica" },
    { id: "content", label: "Contenido comercial" },
    { id: "technical", label: "Ficha técnica" },
    { id: "blocks", label: "Bloques dinámicos" },
    { id: "seo", label: "SEO y configuración" },
  ] as const;

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#F5F2EC] px-6 py-4 border-b border-[#E8E4DC]">
        <h3 className="text-lg font-serif text-[#1A1208]">
          {initial?.id ? `Editar: ${initial.title}` : "Nuevo producto"}
        </h3>
        {/* Tabs de sección */}
        <div className="flex gap-1 mt-3 flex-wrap">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                section === s.id
                  ? "bg-[#3A5A3A] text-white"
                  : "text-[#7A6E5E] hover:bg-[#E8E4DC]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── SECCIÓN: INFORMACIÓN BÁSICA ── */}
        {section === "basic" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                  placeholder="Awaes Direct Premium"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] font-mono"
                  placeholder="awaes-direct-premium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Subtítulo comercial</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="Agua pura directa del grifo, sin depósito"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Categoría principal</label>
                <select
                  value={form.categoryId ?? ""}
                  onChange={(e) => set("categoryId", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Badge comercial</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                  placeholder="Premium, Recomendado, Más vendido..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Precio visible</label>
                <input
                  type="text"
                  value={form.priceVisible}
                  onChange={(e) => set("priceVisible", e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                  placeholder="1.995,00 €"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Precio desde</label>
                <input
                  type="text"
                  value={form.priceFrom}
                  onChange={(e) => set("priceFrom", e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                  placeholder="Desde 1.995 €"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Precio orientativo</label>
                <input
                  type="text"
                  value={form.priceOrientative}
                  onChange={(e) => set("priceOrientative", e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                  placeholder="Precio orientativo, consultar"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-2">Imagen principal</label>
              <ImageUploader
                value={form.mainImage}
                onChange={(url: string) => set("mainImage", url)}
                label="Imagen principal del producto"
              />
            </div>

            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Orden de aparición</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
                className="w-32 border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-5">
              {[
                { key: "visibleEnPublico", label: "Visible en público" },
                { key: "destacadoEnHome", label: "Destacado en home" },
                { key: "productoPrincipal", label: "Producto principal" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form[key as keyof ProductFormData] as number) === 1}
                    onChange={(e) => set(key as keyof ProductFormData, e.target.checked ? 1 : 0)}
                    className="rounded border-[#E8E4DC] text-[#3A5A3A] focus:ring-[#3A5A3A]"
                  />
                  <span className="text-sm text-[#5A4E3E]">{label}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status === "active"}
                  onChange={(e) => set("status", e.target.checked ? "active" : "inactive")}
                  className="rounded border-[#E8E4DC] text-[#3A5A3A] focus:ring-[#3A5A3A]"
                />
                <span className="text-sm text-[#5A4E3E]">Activo</span>
              </label>
            </div>
          </>
        )}

        {/* ── SECCIÓN: CONTENIDO COMERCIAL ── */}
        {section === "content" && (
          <>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Descripción corta</label>
              <textarea
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                rows={3}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Descripción breve para tarjetas de producto (máx. 200 caracteres)"
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Descripción larga</label>
              <textarea
                value={form.longDescription}
                onChange={(e) => set("longDescription", e.target.value)}
                rows={6}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Descripción completa del producto para la ficha de detalle"
              />
            </div>
            <ArrayEditor
              label="Claims destacados"
              value={form.claimsHighlighted}
              onChange={(v) => set("claimsHighlighted", v)}
              placeholder="Ej: Membrana de ósmosis de alto rendimiento"
            />
            <ArrayEditor
              label="Beneficios principales"
              value={form.benefits}
              onChange={(v) => set("benefits", v)}
              placeholder="Ej: Elimina el 99% de contaminantes"
            />
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Para quién es ideal</label>
              <textarea
                value={form.forWhom}
                onChange={(e) => set("forWhom", e.target.value)}
                rows={3}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Familias con niños, personas con sensibilidad al cloro..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">CTA principal</label>
                <input
                  type="text"
                  value={form.ctaPrimaryLabel}
                  onChange={(e) => set("ctaPrimaryLabel", e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">CTA secundario</label>
                <input
                  type="text"
                  value={form.ctaSecondaryLabel}
                  onChange={(e) => set("ctaSecondaryLabel", e.target.value)}
                  className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                />
              </div>
            </div>
          </>
        )}

        {/* ── SECCIÓN: FICHA TÉCNICA ── */}
        {section === "technical" && (
          <>
            <SpecsEditor value={form.technicalSpecs} onChange={(v) => set("technicalSpecs", v)} />
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Instalación</label>
              <textarea
                value={form.installationText}
                onChange={(e) => set("installationText", e.target.value)}
                rows={3}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Instalación incluida / profesional / por el usuario..."
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Mantenimiento</label>
              <textarea
                value={form.maintenanceText}
                onChange={(e) => set("maintenanceText", e.target.value)}
                rows={3}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Cambio de filtros cada 12 meses..."
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Garantía</label>
              <textarea
                value={form.warrantyText}
                onChange={(e) => set("warrantyText", e.target.value)}
                rows={2}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="2 años de garantía oficial..."
              />
            </div>
          </>
        )}

        {/* ── SECCIÓN: BLOQUES DINÁMICOS ── */}
        {section === "blocks" && (
          <>
            <ArrayEditor
              label="Bullets de ventajas"
              value={form.bulletAdvantages}
              onChange={(v) => set("bulletAdvantages", v)}
              placeholder="Ej: Sin depósito, agua siempre fresca"
            />
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Bloque "Por qué elegir este sistema"</label>
              <textarea
                value={form.whyChooseBlock}
                onChange={(e) => set("whyChooseBlock", e.target.value)}
                rows={4}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Texto del bloque de argumentación..."
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Bloque acompañamiento experto</label>
              <textarea
                value={form.expertBlock}
                onChange={(e) => set("expertBlock", e.target.value)}
                rows={3}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Cristina te acompaña en la elección..."
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">Bloque de confianza / autoridad</label>
              <textarea
                value={form.trustBlock}
                onChange={(e) => set("trustBlock", e.target.value)}
                rows={3}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Texto de confianza, certificaciones, años de experiencia..."
              />
            </div>
            <FaqEditor value={form.faqBlock} onChange={(v) => set("faqBlock", v)} />
          </>
        )}

        {/* ── SECCIÓN: SEO Y CONFIGURACIÓN ── */}
        {section === "seo" && (
          <>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">SEO Title</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="Awaes Direct Premium — Sistema de ósmosis directa"
                maxLength={200}
              />
              <p className="text-xs text-[#A09080] mt-0.5">{form.seoTitle.length}/200 caracteres</p>
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] uppercase tracking-wide mb-1">SEO Description</label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                rows={3}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
                placeholder="Meta descripción para buscadores (máx. 160 caracteres)"
                maxLength={400}
              />
              <p className="text-xs text-[#A09080] mt-0.5">{form.seoDescription.length}/400 caracteres</p>
            </div>
          </>
        )}

      </div>

      {/* Footer con acciones */}
      <div className="bg-[#FAFAF7] px-6 py-4 border-t border-[#E8E4DC] flex gap-3">
        <button
          onClick={() => onSave(form)}
          disabled={isSaving || !form.title || !form.slug}
          className="flex items-center gap-2 px-5 py-2 bg-[#3A5A3A] text-white rounded-lg text-sm hover:bg-[#2E4A2E] transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {initial?.id ? "Guardar cambios" : "Crear producto"}
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

export default function AguaProductos() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState<"all" | "visible" | "hidden">("all");
  const [filterDestacado, setFilterDestacado] = useState(false);
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: categories } = trpc.water.admin.listCategories.useQuery();
  const { data: products, isLoading } = trpc.water.admin.listProducts.useQuery({
    categoryId: filterCategory ?? undefined,
    onlyVisible: filterVisible === "visible" ? true : undefined,
    onlyDestacados: filterDestacado || undefined,
  });

  const createMutation = trpc.water.admin.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Producto creado correctamente");
      utils.water.admin.listProducts.invalidate();
      setShowForm(false);
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const updateMutation = trpc.water.admin.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("Producto actualizado");
      utils.water.admin.listProducts.invalidate();
      setEditingId(null);
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const deleteMutation = trpc.water.admin.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("Producto eliminado");
      utils.water.admin.listProducts.invalidate();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const duplicateMutation = trpc.water.admin.duplicateProduct.useMutation({
    onSuccess: () => {
      toast.success("Producto duplicado como borrador");
      utils.water.admin.listProducts.invalidate();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  // Filtro de búsqueda local
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (filterVisible === "visible" && p.visibleEnPublico !== 1) return false;
      if (filterVisible === "hidden" && p.visibleEnPublico !== 0) return false;
      return true;
    });
  }, [products, search, filterVisible]);

  const handleReorder = (id: number, direction: "up" | "down") => {
    if (!filteredProducts) return;
    const idx = filteredProducts.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filteredProducts.length) return;
    const current = filteredProducts[idx];
    const swap = filteredProducts[swapIdx];
    updateMutation.mutate({ id: current.id, data: { sortOrder: swap.sortOrder } });
    updateMutation.mutate({ id: swap.id, data: { sortOrder: current.sortOrder } });
  };

  const editingProduct = editingId ? products?.find((p) => p.id === editingId) : null;

  return (
    <CRMLayout title="Máquinas de Agua — Productos">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-[#1A1208] flex items-center gap-2">
              <Droplets size={22} className="text-[#3A5A3A]" />
              Productos de Sistemas de Agua
            </h1>
            <p className="text-sm text-[#7A6E5E] mt-1">
              Gestiona el catálogo de sistemas de agua. Sin carrito ni checkout.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/crm/agua/categorias">
              <a className="flex items-center gap-2 px-3 py-2 border border-[#E8E4DC] text-[#5A4E3E] rounded-lg text-sm hover:bg-[#F5F2EC] transition-colors">
                Categorías
              </a>
            </Link>
            <Link href="/crm/agua/solicitudes">
              <a className="flex items-center gap-2 px-3 py-2 border border-[#E8E4DC] text-[#5A4E3E] rounded-lg text-sm hover:bg-[#F5F2EC] transition-colors">
                Solicitudes
              </a>
            </Link>
            {!showForm && !editingId && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#3A5A3A] text-white rounded-lg text-sm hover:bg-[#2E4A2E] transition-colors"
              >
                <Plus size={14} />
                Nuevo producto
              </button>
            )}
          </div>
        </div>

        {/* Formulario nuevo producto */}
        {showForm && (
          <ProductForm
            categories={categories ?? []}
            onSave={(data) => createMutation.mutate({ ...data, categoryId: data.categoryId ?? undefined })}
            onCancel={() => setShowForm(false)}
            isSaving={createMutation.isPending}
          />
        )}

        {/* Formulario edición */}
        {editingId && editingProduct && (
          <ProductForm
            initial={editingProduct as Partial<ProductFormData> & { id: number }}
            categories={categories ?? []}
            onSave={(data) => updateMutation.mutate({ id: editingId, data: { ...data, categoryId: data.categoryId ?? undefined } })}
            onCancel={() => setEditingId(null)}
            isSaving={updateMutation.isPending}
          />
        )}

        {/* Filtros */}
        {!showForm && !editingId && (
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A09080]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-3 py-2 border border-[#E8E4DC] rounded-lg text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
              />
            </div>
            <select
              value={filterCategory ?? ""}
              onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#5A4E3E] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            >
              <option value="">Todas las categorías</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterVisible}
              onChange={(e) => setFilterVisible(e.target.value as "all" | "visible" | "hidden")}
              className="border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#5A4E3E] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            >
              <option value="all">Todos</option>
              <option value="visible">Visibles</option>
              <option value="hidden">Ocultos</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#5A4E3E]">
              <input
                type="checkbox"
                checked={filterDestacado}
                onChange={(e) => setFilterDestacado(e.target.checked)}
                className="rounded border-[#E8E4DC] text-[#3A5A3A]"
              />
              Solo destacados
            </label>
          </div>
        )}

        {/* Listado */}
        {!showForm && !editingId && (
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-[#F5F2EC] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-[#FAFAF7] rounded-xl border border-dashed border-[#E8E4DC]">
                <Droplets size={36} className="mx-auto text-[#C0B8A8] mb-3" />
                <p className="text-[#7A6E5E] font-medium">No hay productos todavía</p>
                <p className="text-sm text-[#A09080] mt-1">Crea el primer producto para empezar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product, idx) => {
                  const catName = categories?.find((c) => c.id === product.categoryId)?.name;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 bg-white border border-[#E8E4DC] rounded-xl p-4 hover:border-[#C8C0B0] transition-colors"
                    >
                      {/* Imagen */}
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.title}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-[#F0F4F0] flex items-center justify-center flex-shrink-0">
                          <Droplets size={20} className="text-[#A0B8A0]" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-[#1A1208] truncate">{product.title}</p>
                          {product.badge && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              {product.badge}
                            </span>
                          )}
                          {product.destacadoEnHome === 1 && (
                            <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {catName && (
                            <span className="text-xs text-[#7A6E5E]">{catName}</span>
                          )}
                          {product.priceVisible && (
                            <span className="text-xs font-medium text-[#3A5A3A]">{product.priceVisible}</span>
                          )}
                          <span className="text-xs text-[#A09080] font-mono">{product.slug}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                          {product.status === "active" ? "Activo" : "Inactivo"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.visibleEnPublico === 1 ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"}`}>
                          {product.visibleEnPublico === 1 ? "Visible" : "Oculto"}
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleReorder(product.id, "up")}
                          disabled={idx === 0}
                          className="p-1.5 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded transition-colors disabled:opacity-30"
                          title="Subir"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleReorder(product.id, "down")}
                          disabled={idx === filteredProducts.length - 1}
                          className="p-1.5 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded transition-colors disabled:opacity-30"
                          title="Bajar"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <a
                          href={`/sistemas-agua/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#A09080] hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Previsualizar"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => duplicateMutation.mutate({ id: product.id })}
                          className="p-1.5 text-[#A09080] hover:text-[#5A4E3E] hover:bg-[#F5F2EC] rounded transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: product.id, data: { visibleEnPublico: product.visibleEnPublico === 1 ? 0 : 1 } })}
                          className="p-1.5 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded transition-colors"
                          title={product.visibleEnPublico === 1 ? "Ocultar" : "Mostrar"}
                        >
                          {product.visibleEnPublico === 1 ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => setEditingId(product.id)}
                          className="p-1.5 text-[#A09080] hover:text-[#3A5A3A] hover:bg-[#F0F4F0] rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`¿Eliminar "${product.title}"?`)) return;
                            deleteMutation.mutate({ id: product.id });
                          }}
                          className="p-1.5 text-[#A09080] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </CRMLayout>
  );
}
