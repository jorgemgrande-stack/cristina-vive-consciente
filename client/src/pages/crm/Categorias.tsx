/**
 * CRM — Gestión de Categorías de Afiliados
 * CRUD completo: crear, editar, activar/desactivar, reordenar y eliminar categorías.
 */

import { useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Tag, ToggleLeft, ToggleRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type CategoryForm = {
  name: string;
  description: string;
  sortOrder: number;
  status: "active" | "inactive";
};

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  sortOrder: 0,
  status: "active",
};

export default function Categorias() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const { data: categories = [], isLoading } = trpc.affiliates.listCategoriesAdmin.useQuery();

  const createMutation = trpc.affiliates.createCategory.useMutation({
    onSuccess: () => {
      utils.affiliates.listCategoriesAdmin.invalidate();
      utils.affiliates.listCategories.invalidate();
      toast.success("Categoría creada");
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.affiliates.updateCategory.useMutation({
    onSuccess: () => {
      utils.affiliates.listCategoriesAdmin.invalidate();
      utils.affiliates.listCategories.invalidate();
      toast.success("Categoría actualizada");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.affiliates.toggleCategoryStatus.useMutation({
    onSuccess: () => {
      utils.affiliates.listCategoriesAdmin.invalidate();
      utils.affiliates.listCategories.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.affiliates.deleteCategory.useMutation({
    onSuccess: () => {
      utils.affiliates.listCategoriesAdmin.invalidate();
      utils.affiliates.listCategories.invalidate();
      toast.success("Categoría eliminada");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const reorderMutation = trpc.affiliates.reorderCategories.useMutation({
    onSuccess: () => utils.affiliates.listCategoriesAdmin.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(cat: (typeof categories)[0]) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      sortOrder: cat.sortOrder ?? 0,
      status: cat.status as "active" | "inactive",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const data = {
      name: form.name.trim(),
      description: form.description || undefined,
      sortOrder: form.sortOrder,
      status: form.status,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function moveCategory(index: number, direction: "up" | "down") {
    const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updates = reordered.map((cat, i) => ({ id: cat.id, sortOrder: i }));
    reorderMutation.mutate(updates);
  }

  const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <CRMLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/crm/afiliados">
            <Button variant="ghost" size="sm" className="gap-1 text-stone-500">
              <ArrowLeft size={16} /> Afiliados
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif text-stone-800">Categorías de Afiliados</h1>
            <p className="text-sm text-stone-500 mt-1">
              {categories.length} categoría{categories.length !== 1 ? "s" : ""} ·{" "}
              {categories.filter((c) => c.status === "active").length} activas
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-[oklch(0.45_0.1_140)] hover:bg-[oklch(0.40_0.1_140)] text-white">
            <Plus size={16} /> Nueva categoría
          </Button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Sin categorías</p>
            <p className="text-sm mt-1">Crea la primera categoría para organizar tus productos afiliados.</p>
            <Button onClick={openCreate} className="mt-4 gap-2 bg-[oklch(0.45_0.1_140)] text-white">
              <Plus size={16} /> Crear categoría
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((cat, index) => (
              <div
                key={cat.id}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  cat.status === "active"
                    ? "bg-white border-stone-200"
                    : "bg-stone-50 border-stone-100 opacity-60"
                }`}
              >
                {/* Reordenar */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveCategory(index, "up")}
                    disabled={index === 0}
                    className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveCategory(index, "down")}
                    disabled={index === sorted.length - 1}
                    className="p-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Icono */}
                <div className="w-9 h-9 rounded-lg bg-[oklch(0.92_0.04_140)] flex items-center justify-center flex-shrink-0">
                  <Tag size={16} className="text-[oklch(0.45_0.1_140)]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-stone-400 truncate mt-0.5">{cat.description}</p>
                  )}
                </div>

                {/* Estado */}
                <Badge
                  variant="outline"
                  className={
                    cat.status === "active"
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                      : "border-stone-200 text-stone-400"
                  }
                >
                  {cat.status === "active" ? "Activa" : "Inactiva"}
                </Badge>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMutation.mutate({ id: cat.id })}
                    className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
                    title={cat.status === "active" ? "Desactivar" : "Activar"}
                  >
                    {cat.status === "active" ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(cat.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-stone-800">
              {editingId ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cat-name">Nombre *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Alimentación Ecológica"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cat-desc">Descripción (opcional)</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción de la categoría..."
                rows={2}
                className="mt-1 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cat-order">Orden</Label>
                <Input
                  id="cat-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cat-status">Estado</Label>
                <select
                  id="cat-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[oklch(0.45_0.1_140)] hover:bg-[oklch(0.40_0.1_140)] text-white"
            >
              {editingId ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert eliminar */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los productos asignados a esta categoría mantendrán
              su nombre de categoría pero ya no estarán vinculados a ella.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CRMLayout>
  );
}
