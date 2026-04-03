/**
 * CRM — Formulario de Ebook (crear / editar)
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, BookOpen, Image, Tag, CreditCard, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface FormData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  priceCents: number;
  currency: string;
  stripePriceId: string;
  pdfUrl: string;
  coverImage: string;
  galleryImages: string; // JSON array string
  downloadExpiryHours: number;
  crmTag: string;
  includesSession: boolean;
  status: "active" | "inactive";
  sortOrder: number;
}

const defaultForm: FormData = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  price: "",
  priceCents: 0,
  currency: "EUR",
  stripePriceId: "",
  pdfUrl: "",
  coverImage: "",
  galleryImages: "",
  downloadExpiryHours: 72,
  crmTag: "",
  includesSession: false,
  status: "active",
  sortOrder: 0,
};

export default function EbookForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!params.id;
  const ebookId = params.id ? parseInt(params.id) : undefined;

  const [form, setForm] = useState<FormData>(defaultForm);
  const [galleryList, setGalleryList] = useState<string[]>(["", "", ""]);

  const { data: existing, isLoading } = trpc.ebooksAdmin.get.useQuery(
    { id: ebookId! },
    { enabled: isEditing && !!ebookId }
  );

  useEffect(() => {
    if (existing) {
      let gallery: string[] = ["", "", ""];
      try {
        const parsed = JSON.parse(existing.galleryImages ?? "[]");
        if (Array.isArray(parsed)) {
          gallery = [...parsed, "", "", ""].slice(0, 3);
        }
      } catch {}
      setGalleryList(gallery);
      setForm({
        slug: existing.slug,
        title: existing.title,
        subtitle: existing.subtitle ?? "",
        description: existing.description ?? "",
        price: existing.price,
        priceCents: existing.priceCents,
        currency: existing.currency,
        stripePriceId: existing.stripePriceId ?? "",
        pdfUrl: existing.pdfUrl ?? "",
        coverImage: existing.coverImage ?? "",
        galleryImages: existing.galleryImages ?? "",
        downloadExpiryHours: existing.downloadExpiryHours,
        crmTag: existing.crmTag ?? "",
        includesSession: existing.includesSession === 1,
        status: existing.status,
        sortOrder: existing.sortOrder,
      });
    }
  }, [existing]);

  const utils = trpc.useUtils();

  const createMutation = trpc.ebooksAdmin.create.useMutation({
    onSuccess: () => {
      utils.ebooksAdmin.listAdmin.invalidate();
      toast.success("Ebook creado correctamente");
      navigate("/crm/ebooks");
    },
    onError: (e) => toast.error(e.message ?? "Error al crear el ebook"),
  });

  const updateMutation = trpc.ebooksAdmin.update.useMutation({
    onSuccess: () => {
      utils.ebooksAdmin.listAdmin.invalidate();
      toast.success("Ebook actualizado correctamente");
      navigate("/crm/ebooks");
    },
    onError: (e) => toast.error(e.message ?? "Error al actualizar el ebook"),
  });

  const handlePriceChange = (value: string) => {
    const cleaned = value.replace(",", ".");
    const cents = Math.round(parseFloat(cleaned || "0") * 100);
    setForm((f) => ({ ...f, price: cleaned, priceCents: isNaN(cents) ? 0 : cents }));
  };

  const handleGalleryChange = (idx: number, value: string) => {
    const updated = [...galleryList];
    updated[idx] = value;
    setGalleryList(updated);
    const filtered = updated.filter((u) => u.trim() !== "");
    setForm((f) => ({ ...f, galleryImages: JSON.stringify(filtered) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("El título es obligatorio");
    if (!form.slug.trim()) return toast.error("El slug es obligatorio");
    if (!form.price || parseFloat(form.price) <= 0) return toast.error("El precio debe ser mayor que 0");

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      price: form.price,
      priceCents: form.priceCents,
      currency: form.currency,
      stripePriceId: form.stripePriceId.trim() || null,
      pdfUrl: form.pdfUrl.trim() || null,
      coverImage: form.coverImage.trim() || null,
      galleryImages: form.galleryImages || null,
      downloadExpiryHours: form.downloadExpiryHours,
      crmTag: form.crmTag.trim() || null,
      includesSession: form.includesSession,
      status: form.status,
      sortOrder: form.sortOrder,
    };

    if (isEditing && ebookId) {
      updateMutation.mutate({ id: ebookId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoading) {
    return (
      <CRMLayout>
        <div className="p-8 text-center text-gray-400">Cargando ebook...</div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/crm/ebooks")} className="p-2 text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Editar ebook" : "Nuevo ebook"}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? `Editando: ${existing?.title}` : "Completa los datos del ebook"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <section className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen size={15} />
              Información básica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Título <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Guía Digital del Agua"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">
                  Slug <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(identificador único)</span>
                </Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))}
                  placeholder="agua"
                  disabled={isEditing}
                  className={isEditing ? "bg-gray-50 text-gray-400" : ""}
                />
                {isEditing && (
                  <p className="text-[0.65rem] text-amber-600">El slug no se puede cambiar si ya hay compras asociadas.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Transforma el agua que bebes"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descripción completa del ebook..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="status"
                checked={form.status === "active"}
                onCheckedChange={(v) => setForm((f) => ({ ...f, status: v ? "active" : "inactive" }))}
              />
              <Label htmlFor="status" className="cursor-pointer">
                {form.status === "active" ? "Activo (visible en la web)" : "Inactivo (oculto)"}
              </Label>
            </div>
          </section>

          {/* Precio y Stripe */}
          <section className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard size={15} />
              Precio y pago
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Precio (€) <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="12.00"
                />
                {form.priceCents > 0 && (
                  <p className="text-[0.65rem] text-gray-400">{form.priceCents} céntimos para Stripe</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                <Input
                  id="stripePriceId"
                  value={form.stripePriceId}
                  onChange={(e) => setForm((f) => ({ ...f, stripePriceId: e.target.value }))}
                  placeholder="price_1ABC..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="downloadExpiry">Expiración descarga (horas)</Label>
                <Input
                  id="downloadExpiry"
                  type="number"
                  min="1"
                  value={form.downloadExpiryHours}
                  onChange={(e) => setForm((f) => ({ ...f, downloadExpiryHours: parseInt(e.target.value) || 72 }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="includesSession"
                checked={form.includesSession}
                onCheckedChange={(v) => setForm((f) => ({ ...f, includesSession: v }))}
              />
              <Label htmlFor="includesSession" className="cursor-pointer">
                Incluye sesión de 30 minutos con Cristina
              </Label>
            </div>
          </section>

          {/* Imágenes */}
          <section className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Image size={15} />
              Imágenes
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="coverImage">Imagen de portada (URL)</Label>
              <Input
                id="coverImage"
                value={form.coverImage}
                onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                placeholder="https://..."
              />
              {form.coverImage && (
                <img src={form.coverImage} alt="Preview portada" className="mt-2 h-24 w-auto rounded-lg object-cover border border-gray-100" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Imágenes del carrusel (máximo 3)</Label>
              {galleryList.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                  <Input
                    value={url}
                    onChange={(e) => handleGalleryChange(idx, e.target.value)}
                    placeholder={`URL imagen ${idx + 1}...`}
                    className="flex-1"
                  />
                  {url && (
                    <img src={url} alt={`Gallery ${idx + 1}`} className="h-10 w-10 rounded object-cover border border-gray-100 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Archivo PDF y CRM */}
          <section className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={15} />
              Archivo y CRM
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="pdfUrl">URL del PDF (S3/CDN)</Label>
              <Input
                id="pdfUrl"
                value={form.pdfUrl}
                onChange={(e) => setForm((f) => ({ ...f, pdfUrl: e.target.value }))}
                placeholder="https://cdn.../ebook.pdf"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="crmTag">Tag CRM (tras compra)</Label>
                <Input
                  id="crmTag"
                  value={form.crmTag}
                  onChange={(e) => setForm((f) => ({ ...f, crmTag: e.target.value }))}
                  placeholder="comprador_ebook_agua"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sortOrder">Orden de aparición</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </section>

          {/* Botones */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/crm/ebooks")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {isEditing ? "Guardar cambios" : "Crear ebook"}
            </Button>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}
