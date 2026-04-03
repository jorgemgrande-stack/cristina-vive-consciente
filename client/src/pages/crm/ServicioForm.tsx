/**
 * CRM — Formulario de Servicio (crear / editar)
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormData = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  durationMinutes: number;
  durationLabel: string;
  type: "consulta" | "masaje" | "otro";
  modality: "online" | "presencial" | "ambos";
  imageUrl: string;
  featured: boolean;
  status: "active" | "inactive";
  sortOrder: number;
};

const EMPTY: FormData = {
  slug: "",
  name: "",
  shortDescription: "",
  description: "",
  price: "",
  durationMinutes: 60,
  durationLabel: "",
  type: "consulta",
  modality: "ambos",
  imageUrl: "",
  featured: false,
  status: "active",
  sortOrder: 0,
};

export default function ServicioForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEdit = !!params.id && params.id !== "nuevo";
  const serviceId = isEdit ? parseInt(params.id!) : null;

  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const utils = trpc.useUtils();

  // Cargar datos si es edición
  const { data: existing, isLoading: loadingExisting } = trpc.services.get.useQuery(
    { id: serviceId! },
    { enabled: isEdit && !!serviceId }
  );

  useEffect(() => {
    if (existing) {
      setForm({
        slug: existing.slug,
        name: existing.name,
        shortDescription: existing.shortDescription ?? "",
        description: existing.description ?? "",
        price: existing.price ?? "",
        durationMinutes: existing.durationMinutes ?? 60,
        durationLabel: existing.durationLabel ?? "",
        type: existing.type as FormData["type"],
        modality: existing.modality as FormData["modality"],
        imageUrl: existing.imageUrl ?? "",
        featured: existing.featured === 1,
        status: existing.status as FormData["status"],
        sortOrder: existing.sortOrder,
      });
    }
  }, [existing]);

  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => {
      utils.services.listAdmin.invalidate();
      toast.success("Servicio creado correctamente");
      navigate("/crm/servicios");
    },
    onError: (err) => toast.error(err.message || "Error al crear el servicio"),
  });

  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => {
      utils.services.listAdmin.invalidate();
      toast.success("Servicio actualizado correctamente");
      navigate("/crm/servicios");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar el servicio"),
  });

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.slug.trim()) e.slug = "El slug es obligatorio";
    if (!/^[a-z0-9_]+$/.test(form.slug)) e.slug = "Solo letras minúsculas, números y guiones bajos";
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (form.price && !/^\d+(\.\d{1,2})?$/.test(form.price)) e.price = "Formato inválido (ej: 90 o 90.00)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      description: form.description.trim() || undefined,
      price: form.price.trim() || null,
      durationMinutes: form.durationMinutes,
      durationLabel: form.durationLabel.trim() || undefined,
      type: form.type,
      modality: form.modality,
      imageUrl: form.imageUrl.trim() || null,
      featured: form.featured,
      status: form.status,
      sortOrder: form.sortOrder,
    };

    if (isEdit && serviceId) {
      updateMutation.mutate({ id: serviceId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingExisting) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
          <Loader2 size={20} className="animate-spin mr-2" /> Cargando servicio...
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/crm/servicios")}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-stone-800">
              {isEdit ? "Editar servicio" : "Nuevo servicio"}
            </h1>
            <p className="text-xs text-stone-400">
              {isEdit ? "Modifica los datos del servicio" : "Añade un nuevo servicio a la web"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-stone-100 p-6">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del servicio *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Consulta Naturópata"
              className={errors.name ? "border-red-300" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug">
              Slug (identificador interno) *
              <span className="text-xs text-stone-400 ml-2 font-normal">
                Conecta con el sistema de reservas
              </span>
            </Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
              placeholder="consulta_naturopata"
              className={`font-mono text-sm ${errors.slug ? "border-red-300" : ""}`}
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
            <p className="text-xs text-stone-400">
              Slugs existentes: consulta_acompanamiento, consulta_naturopata, consulta_breve, consulta_express, biohabitabilidad, kinesiologia, masaje, otro
            </p>
          </div>

          {/* Descripción corta */}
          <div className="space-y-1.5">
            <Label htmlFor="shortDesc">Descripción corta</Label>
            <Input
              id="shortDesc"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="Breve descripción visible en la tarjeta (máx. 500 caracteres)"
              maxLength={500}
            />
          </div>

          {/* Descripción larga */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Descripción completa</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descripción detallada del servicio..."
              rows={5}
            />
          </div>

          {/* Precio y duración */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (€)</Label>
              <Input
                id="price"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="90 (vacío = a consultar)"
                className={errors.price ? "border-red-300" : ""}
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationMin">Duración (minutos)</Label>
              <Input
                id="durationMin"
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", parseInt(e.target.value) || 60)}
              />
            </div>
          </div>

          {/* Etiqueta de duración */}
          <div className="space-y-1.5">
            <Label htmlFor="durationLabel">
              Etiqueta de duración
              <span className="text-xs text-stone-400 ml-2 font-normal">
                Texto visible (ej: "Mínimo 60 min", "Consulta inicial + 21 días")
              </span>
            </Label>
            <Input
              id="durationLabel"
              value={form.durationLabel}
              onChange={(e) => set("durationLabel", e.target.value)}
              placeholder="60 min"
            />
          </div>

          {/* Tipo y modalidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as FormData["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="masaje">Masaje</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select value={form.modality} onValueChange={(v) => set("modality", v as FormData["modality"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambos">Presencial / Online</SelectItem>
                  <SelectItem value="online">Solo Online</SelectItem>
                  <SelectItem value="presencial">Solo Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Imagen */}
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">URL de imagen</Label>
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://..."
            />
            {form.imageUrl && (
              <div className="mt-2 w-24 h-16 rounded-lg overflow-hidden border border-stone-100">
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Estado, orden y destacado */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as FormData["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Orden</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Destacado</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="w-4 h-4 accent-[oklch(0.45_0.1_140)]"
                />
                <label htmlFor="featured" className="text-sm text-stone-600 cursor-pointer">
                  Mostrar como destacado
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-[oklch(0.45_0.1_140)] hover:bg-[oklch(0.38_0.1_140)] text-white"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEdit ? "Guardar cambios" : "Crear servicio"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/crm/servicios")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}
