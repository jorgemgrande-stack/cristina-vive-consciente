/**
 * CRM — Gestión de Productos Afiliados
 * CRUD completo: crear, editar, activar/desactivar, eliminar, reordenar.
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Tag,
  Globe,
} from "lucide-react";
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

const CATEGORIES = [
  "Alimentación",
  "Cocina saludable",
  "Limpieza ecológica",
  "Cosmética natural",
  "Textil consciente",
  "Microorganismos EM",
  "Terapia lumínica",
  "Sistemas de agua",
  "Otros",
];

export default function Afiliados() {
  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.affiliates.listAdmin.useQuery();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const toggleMutation = trpc.affiliates.toggleStatus.useMutation({
    onSuccess: (data, variables) => {
      utils.affiliates.listAdmin.invalidate();
      utils.affiliates.list.invalidate();
      toast.success(data.status === "active" ? "Producto activado" : "Producto desactivado");
    },
    onError: () => toast.error("Error al cambiar el estado"),
  });

  const deleteMutation = trpc.affiliates.delete.useMutation({
    onSuccess: () => {
      utils.affiliates.listAdmin.invalidate();
      utils.affiliates.list.invalidate();
      toast.success("Producto eliminado");
      setDeleteId(null);
    },
    onError: () => toast.error("Error al eliminar el producto"),
  });

  const reorderMutation = trpc.affiliates.reorder.useMutation({
    onSuccess: () => utils.affiliates.listAdmin.invalidate(),
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...products];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    reorderMutation.mutate(updated.map((p, i) => ({ id: p.id, sortOrder: i })));
  };

  const handleMoveDown = (index: number) => {
    if (index === products.length - 1) return;
    const updated = [...products];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    reorderMutation.mutate(updated.map((p, i) => ({ id: p.id, sortOrder: i })));
  };

  // Group by category for display
  const byCategory = products.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <CRMLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Productos Afiliados</h1>
            <p className="text-sm text-stone-500 mt-1">
              {products.length} productos · {products.filter((p) => p.status === "active").length} activos
            </p>
          </div>
          <Link href="/crm/afiliados/nuevo">
            <Button className="bg-[oklch(0.42_0.08_148)] hover:bg-[oklch(0.36_0.08_148)] text-white gap-2">
              <Plus size={16} />
              Nuevo producto
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-stone-400">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Tag size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500 mb-2">No hay productos afiliados todavía</p>
            <p className="text-sm text-stone-400">Crea el primero para que aparezca en /recomendados</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag size={14} />
                  {category}
                  <span className="font-normal normal-case">({items.length})</span>
                </h2>
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 bg-stone-50">
                        <th className="text-left px-4 py-3 text-stone-500 font-medium w-8">Orden</th>
                        <th className="text-left px-4 py-3 text-stone-500 font-medium">Producto</th>
                        <th className="text-left px-4 py-3 text-stone-500 font-medium hidden md:table-cell">Proveedor</th>
                        <th className="text-left px-4 py-3 text-stone-500 font-medium">Estado</th>
                        <th className="text-right px-4 py-3 text-stone-500 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((product, idx) => {
                        const globalIdx = products.findIndex((p) => p.id === product.id);
                        return (
                          <tr key={product.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                            {/* Orden */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => handleMoveUp(globalIdx)}
                                  disabled={globalIdx === 0}
                                  className="text-stone-300 hover:text-stone-600 disabled:opacity-20"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  onClick={() => handleMoveDown(globalIdx)}
                                  disabled={globalIdx === products.length - 1}
                                  className="text-stone-300 hover:text-stone-600 disabled:opacity-20"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            </td>

                            {/* Producto */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Globe size={16} className="text-stone-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-stone-800">{product.name}</p>
                                  {product.description && (
                                    <p className="text-xs text-stone-400 line-clamp-1 max-w-xs">{product.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Proveedor */}
                            <td className="px-4 py-3 hidden md:table-cell text-stone-500">
                              {product.provider ?? "—"}
                            </td>

                            {/* Estado */}
                            <td className="px-4 py-3">
                              <Badge
                                variant={product.status === "active" ? "default" : "secondary"}
                                className={
                                  product.status === "active"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-stone-100 text-stone-500"
                                }
                              >
                                {product.status === "active" ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>

                            {/* Acciones */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <a
                                  href={product.affiliateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded"
                                  title="Ver enlace afiliado"
                                >
                                  <ExternalLink size={14} />
                                </a>
                                <button
                                  onClick={() => toggleMutation.mutate({ id: product.id })}
                                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded"
                                  title={product.status === "active" ? "Desactivar" : "Activar"}
                                >
                                  {product.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <Link href={`/crm/afiliados/${product.id}/editar`}>
                                  <button className="p-1.5 text-stone-400 hover:text-stone-600 rounded" title="Editar">
                                    <Pencil size={14} />
                                  </button>
                                </Link>
                                <button
                                  onClick={() => setDeleteId(product.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-500 rounded"
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto dejará de aparecer en /recomendados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CRMLayout>
  );
}
