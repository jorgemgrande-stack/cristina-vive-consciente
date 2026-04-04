/**
 * CRM — Formulario de Producto Afiliado
 * Usado tanto para crear como para editar.
 */

import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
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
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

// Las categorías se cargan dinámicamente desde la base de datos

interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  affiliateUrl: string;
  provider: string;
  status: "active" | "inactive";
  sortOrder: number;
}

const emptyForm: FormData = {
  name: "",
  description: "",
  imageUrl: "",
  category: "",
  affiliateUrl: "",
  provider: "",
  status: "active",
  sortOrder: 0,
};

export default function AfiliadoForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEdit = !!params.id && params.id !== "nuevo";
  const productId = isEdit ? parseInt(params.id!) : null;

  const [form, setForm] = useState<FormData>(emptyForm);
  const utils = trpc.useUtils();

  // Cargar categorías dinámicas desde la base de datos
  const { data: categoriesData = [] } = trpc.affiliates.listCategoriesAdmin.useQuery();
  const activeCategories = categoriesData.filter((c) => c.status === "active");

  // Load existing product for edit
  const { data: existing, isLoading: loadingProduct } = trpc.affiliates.get.useQuery(
    { id: productId! },
    { enabled: !!productId }
  );

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description ?? "",
        imageUrl: existing.imageUrl ?? "",
        category: existing.category,
        affiliateUrl: existing.affiliateUrl,
        provider: existing.provider ?? "",
        status: existing.status,
        sortOrder: existing.sortOrder,
      });
    }
  }, [existing]);

  const createMutation = trpc.affiliates.create.useMutation({
    onSuccess: () => {
      utils.affiliates.listAdmin.invalidate();
      utils.affiliates.list.invalidate();
      toast.success("Producto creado correctamente");
      navigate("/crm/afiliados");
    },
    onError: (err) => toast.error(err.message || "Error al crear el producto"),
  });

  const updateMutation = trpc.affiliates.update.useMutation({
    onSuccess: () => {
      utils.affiliates.listAdmin.invalidate();
      utils.affiliates.list.invalidate();
      toast.success("Producto actualizado correctamente");
      navigate("/crm/afiliados");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar el producto"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    if (!form.category) return toast.error("La categoría es obligatoria");
    if (!form.affiliateUrl.trim()) return toast.error("El enlace afiliado es obligatorio");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      category: form.category,
      affiliateUrl: form.affiliateUrl.trim(),
      provider: form.provider.trim() || undefined,
      status: form.status,
      sortOrder: form.sortOrder,
    };

    if (isEdit && productId) {
      updateMutation.mutate({ id: productId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingProduct) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-stone-400" size={32} />
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/crm/afiliados")}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-stone-800">
              {isEdit ? "Editar producto" : "Nuevo producto afiliado"}
            </h1>
            <p className="text-sm text-stone-400">
              {isEdit ? "Modifica los datos del producto" : "Añade un nuevo producto a /recomendados"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-stone-200 p-6">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del producto *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Aceite de coco ecológico"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descripción del producto y por qué lo recomiendas..."
              rows={3}
            />
          </div>

          {/* Imagen */}
          <ImageUploader
            label="Imagen del producto"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            hint="JPG, PNG, WEBP hasta 20 MB"
          />

          {/* Categoría */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Categoría *</Label>
              <a
                href="/crm/categorias"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[oklch(0.45_0.1_140)] hover:underline"
              >
                + Gestionar categorías
              </a>
            </div>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {activeCategories.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-stone-400">
                    No hay categorías activas. <a href="/crm/categorias" target="_blank" className="text-[oklch(0.45_0.1_140)] underline">Crear una</a>
                  </div>
                ) : (
                  activeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Enlace afiliado */}
          <div className="space-y-1.5">
            <Label htmlFor="affiliateUrl">Enlace afiliado *</Label>
            <Input
              id="affiliateUrl"
              type="url"
              value={form.affiliateUrl}
              onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
              placeholder="https://..."
              required
            />
            <p className="text-xs text-stone-400">
              Se añadirá automáticamente rel="nofollow sponsored" al enlace en la web pública.
            </p>
          </div>

          {/* Proveedor */}
          <div className="space-y-1.5">
            <Label htmlFor="provider">Proveedor / Tienda</Label>
            <Input
              id="provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="Ej: Amazon, iHerb, Naturitas..."
            />
          </div>

          {/* Estado y orden */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo (visible)</SelectItem>
                  <SelectItem value="inactive">Inactivo (oculto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Orden de aparición</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[oklch(0.42_0.08_148)] hover:bg-[oklch(0.36_0.08_148)] text-white gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/crm/afiliados")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}
