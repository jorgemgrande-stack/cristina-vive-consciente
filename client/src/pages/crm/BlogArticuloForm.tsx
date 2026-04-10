/**
 * BlogArticuloForm — Formulario CRM para crear/editar artículos del blog
 * Cristina Vive Consciente
 */
import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { ImageUploader } from "@/components/ImageUploader";

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

interface FormData {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  content: string;
  coverImage: string;
  author: string;
  writtenAt: string; // ISO date string YYYY-MM-DD
  categoryId: string;
  readTimeMinutes: number;
  featured: number;
  status: "draft" | "published" | "archived";
  sortOrder: number;
}

const INITIAL: FormData = {
  title: "",
  slug: "",
  excerpt: "",
  featuredImage: "",
  content: "",
  coverImage: "",
  author: "",
  writtenAt: "",
  categoryId: "",
  readTimeMinutes: 5,
  featured: 0,
  status: "draft",
  sortOrder: 0,
};

export default function BlogArticuloForm() {
  const [, setLocation] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/crm/blog/articulos/:id/editar");
  const editId = matchEdit ? Number(paramsEdit?.id) : null;

  const [form, setForm] = useState<FormData>(INITIAL);
  const [slugManual, setSlugManual] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [saving, setSaving] = useState(false);
  // Prevent background refetches from overwriting user edits (e.g. after uploading an image)
  const formInitialized = useRef(false);

  const utils = trpc.useUtils();

  const { data: categories = [] } = trpc.blog.admin.listCategories.useQuery();
  const { data: existingSlugs = [] } = trpc.blog.admin.existingSlugs.useQuery({
    excludeId: editId ?? undefined,
  });

  const { data: existingPost } = trpc.blog.admin.getPost.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  // Reset the initialization flag when navigating between different articles
  useEffect(() => {
    formInitialized.current = false;
  }, [editId]);

  useEffect(() => {
    // Only initialize the form once — prevent background refetches from
    // overwriting user edits (e.g. a newly uploaded image).
    if (existingPost && !formInitialized.current) {
      formInitialized.current = true;
      setForm({
        title: existingPost.title,
        slug: existingPost.slug,
        excerpt: existingPost.excerpt ?? "",
        featuredImage: (existingPost as any).featuredImage ?? "",
        content: existingPost.content ?? "",
        coverImage: existingPost.coverImage ?? "",
        author: (existingPost as any).author ?? "",
        writtenAt: (existingPost as any).writtenAt
          ? new Date((existingPost as any).writtenAt).toISOString().split("T")[0]
          : "",
        categoryId: existingPost.categoryId ? String(existingPost.categoryId) : "",
        readTimeMinutes: existingPost.readTimeMinutes ?? 5,
        featured: existingPost.featured ?? 0,
        status: existingPost.status,
        sortOrder: existingPost.sortOrder ?? 0,
      });
      setSlugManual(true);
    }
  }, [existingPost]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && form.title) {
      const generated = toSlug(form.title);
      setForm((f) => ({ ...f, slug: generated }));
    }
  }, [form.title, slugManual]);

  // Validate slug uniqueness
  useEffect(() => {
    if (form.slug && existingSlugs.includes(form.slug)) {
      setSlugError("Este slug ya está en uso por otro artículo");
    } else {
      setSlugError("");
    }
  }, [form.slug, existingSlugs]);

  const createMutation = trpc.blog.admin.createPost.useMutation({
    onSuccess: () => {
      utils.blog.admin.listPosts.invalidate();
      toast.success("Artículo creado correctamente");
      setLocation("/crm/blog/articulos");
    },
    onError: (e) => {
      toast.error("Error al crear el artículo: " + e.message);
      setSaving(false);
    },
  });

  const updateMutation = trpc.blog.admin.updatePost.useMutation({
    onSuccess: () => {
      utils.blog.admin.listPosts.invalidate();
      toast.success("Artículo actualizado correctamente");
      setLocation("/crm/blog/articulos");
    },
    onError: (e) => {
      toast.error("Error al actualizar: " + e.message);
      setSaving(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugError) {
      toast.error("Corrige el slug antes de guardar");
      return;
    }
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || toSlug(form.title),
      excerpt: form.excerpt.trim() || undefined,
      // Send null (not undefined) so the server can distinguish "user cleared"
      // from "field absent" — prevents accidental image preservation on delete.
      featuredImage: form.featuredImage.trim() || null,
      content: form.content.trim() || undefined,
      coverImage: form.coverImage.trim() || null,
      author: form.author.trim() || undefined,
      writtenAt: form.writtenAt ? new Date(form.writtenAt) : undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      readTimeMinutes: form.readTimeMinutes,
      featured: form.featured,
      status: form.status,
      sortOrder: form.sortOrder,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function set(field: keyof FormData, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <CRMLayout title={editId ? "Editar artículo" : "Nuevo artículo"}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Back */}
        <button
          type="button"
          onClick={() => setLocation("/crm/blog/articulos")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-body transition-colors"
        >
          <ArrowLeft size={15} />
          Volver a artículos
        </button>

        <h1 className="text-2xl font-heading text-[oklch(0.35_0.05_148)]">
          {editId ? "Editar artículo" : "Nuevo artículo"}
        </h1>

        {/* Cover image */}
        <div>
          <ImageUploader
            value={form.coverImage}
            onChange={(url) => set("coverImage", url)}
            label="Imagen de portada"
            hint="JPG, PNG, WEBP hasta 20 MB. Recomendado: 1200×630 px"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
            style={{ borderRadius: 0 }}
            placeholder="Título del artículo"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">Slug (URL)</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true);
              set("slug", e.target.value);
            }}
            className={`w-full px-3 py-2 border text-sm font-body focus:outline-none ${
              slugError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-[oklch(0.52_0.08_148)]"
            }`}
            style={{ borderRadius: 0 }}
            placeholder="slug-del-articulo"
          />
          {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
          <p className="text-xs text-gray-400 mt-1">/blog/{form.slug || "slug-del-articulo"}</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">Extracto / Resumen</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)] resize-none"
            style={{ borderRadius: 0 }}
            placeholder="Breve descripción del artículo (aparece en el listado del blog)"
          />
        </div>

        {/* Featured Image (after excerpt) */}
        <div>
          <ImageUploader
            value={form.featuredImage}
            onChange={(url) => set("featuredImage", url)}
            label="Imagen destacada del artículo"
            hint="Aparece centrada después del extracto. JPG, PNG, WEBP hasta 20 MB."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">Contenido completo</label>
          <textarea
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            rows={16}
            className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)] resize-y"
            style={{ borderRadius: 0 }}
            placeholder="Escribe el contenido completo del artículo aquí. Puedes usar Markdown: **negrita**, *cursiva*, ## Título, etc."
          />
          <p className="text-xs text-gray-400 mt-1">Soporta Markdown básico: **negrita**, *cursiva*, ## Título, [enlace](url)</p>
        </div>

        {/* Author + Written At */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">Autor</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
              style={{ borderRadius: 0 }}
              placeholder="Ej: Cristina Vive Consciente"
            />
            <p className="text-xs text-gray-400 mt-1">Aparece en el encabezado del artículo</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">Fecha de escritura</label>
            <input
              type="date"
              value={form.writtenAt}
              onChange={(e) => set("writtenAt", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
              style={{ borderRadius: 0 }}
            />
            <p className="text-xs text-gray-400 mt-1">Fecha real en que se escribió el artículo</p>
          </div>
        </div>

        {/* Category + Read time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">Categoría</label>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)] bg-white"
              style={{ borderRadius: 0 }}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">Tiempo de lectura (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={form.readTimeMinutes}
              onChange={(e) => set("readTimeMinutes", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
              style={{ borderRadius: 0 }}
            />
          </div>
        </div>

        {/* Status + Featured + sortOrder */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">Estado</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as FormData["status"])}
              className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)] bg-white"
              style={{ borderRadius: 0 }}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">Destacado</label>
            <select
              value={form.featured}
              onChange={(e) => set("featured", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)] bg-white"
              style={{ borderRadius: 0 }}
            >
              <option value={0}>No destacado</option>
              <option value={1}>Destacado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">Orden</label>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
              style={{ borderRadius: 0 }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !!slugError}
            className="flex items-center gap-2 px-6 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-sm font-body hover:bg-[oklch(0.45_0.08_148)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: 0 }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {editId ? "Guardar cambios" : "Crear artículo"}
          </button>
          <button
            type="button"
            onClick={() => setLocation("/crm/blog/articulos")}
            className="px-4 py-2.5 border border-gray-200 text-sm font-body text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ borderRadius: 0 }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </CRMLayout>
  );
}
