/**
 * CRM — Gestor de Ebooks (Guías Digitales)
 * Lista, crea, edita y activa/desactiva ebooks.
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, ChevronUp, ChevronDown,
  Download, Tag, Star, StarOff
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Ebooks() {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: ebooks = [], isLoading } = trpc.ebooksAdmin.listAdmin.useQuery();

  const toggleStatus = trpc.ebooksAdmin.toggleStatus.useMutation({
    onSuccess: () => {
      utils.ebooksAdmin.listAdmin.invalidate();
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar el estado"),
  });

  const deleteEbook = trpc.ebooksAdmin.delete.useMutation({
    onSuccess: () => {
      utils.ebooksAdmin.listAdmin.invalidate();
      toast.success("Ebook eliminado");
      setDeletingId(null);
    },
    onError: () => toast.error("Error al eliminar el ebook"),
  });

  const reorder = trpc.ebooksAdmin.reorder.useMutation({
    onSuccess: () => utils.ebooksAdmin.listAdmin.invalidate(),
  });

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const newOrder = [...ebooks];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    reorder.mutate(newOrder.map((e, i) => ({ id: e.id, sortOrder: i })));
  };

  const handleMoveDown = (idx: number) => {
    if (idx === ebooks.length - 1) return;
    const newOrder = [...ebooks];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    reorder.mutate(newOrder.map((e, i) => ({ id: e.id, sortOrder: i })));
  };

  const activeCount = ebooks.filter((e) => e.status === "active").length;
  const withStripe = ebooks.filter((e) => !!e.stripePriceId).length;

  return (
    <CRMLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Ebooks</h1>
            <p className="text-sm text-gray-500">Gestiona las guías digitales que aparecen en la web</p>
          </div>
          <Link href="/crm/ebooks/nuevo">
            <Button className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white gap-2">
              <Plus size={16} />
              Nuevo ebook
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{ebooks.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total ebooks</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-[oklch(0.52_0.08_148)]">{activeCount}</p>
            <p className="text-xs text-gray-500 mt-1">Activos</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{withStripe}</p>
            <p className="text-xs text-gray-500 mt-1">Con Stripe</p>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full mx-auto mb-3" />
              Cargando ebooks...
            </div>
          ) : ebooks.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No hay ebooks todavía.</p>
              <Link href="/crm/ebooks/nuevo">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus size={14} />
                  Crear primer ebook
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {ebooks.map((ebook, idx) => (
                <div key={ebook.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  {/* Imagen */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {ebook.coverImage ? (
                      <img src={ebook.coverImage} alt={ebook.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={24} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{ebook.title}</h3>
                      <Badge
                        variant={ebook.status === "active" ? "default" : "secondary"}
                        className={`text-[0.65rem] px-2 py-0 ${ebook.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500"}`}
                      >
                        {ebook.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                      {ebook.stripePriceId && (
                        <Badge className="text-[0.65rem] px-2 py-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                          Stripe ✓
                        </Badge>
                      )}
                      {ebook.includesSession === 1 && (
                        <Badge className="text-[0.65rem] px-2 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
                          + Sesión
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{ebook.subtitle ?? ""}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-semibold text-[oklch(0.52_0.08_148)]">
                        {parseFloat(ebook.price).toFixed(2)}€
                      </span>
                      {ebook.pdfUrl && (
                        <span className="flex items-center gap-1 text-[0.65rem] text-gray-400">
                          <Download size={10} />
                          PDF listo
                        </span>
                      )}
                      {ebook.crmTag && (
                        <span className="flex items-center gap-1 text-[0.65rem] text-gray-400">
                          <Tag size={10} />
                          {ebook.crmTag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Reordenar */}
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                      title="Subir"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === ebooks.length - 1}
                      className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                      title="Bajar"
                    >
                      <ChevronDown size={14} />
                    </button>

                    {/* Toggle activo */}
                    <button
                      onClick={() => toggleStatus.mutate({ id: ebook.id })}
                      className={`p-1.5 transition-colors ${ebook.status === "active" ? "text-green-600 hover:text-gray-500" : "text-gray-400 hover:text-green-600"}`}
                      title={ebook.status === "active" ? "Desactivar" : "Activar"}
                    >
                      {ebook.status === "active" ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    {/* Editar */}
                    <Link href={`/crm/ebooks/${ebook.id}/editar`}>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                        <Edit2 size={15} />
                      </button>
                    </Link>

                    {/* Eliminar */}
                    {deletingId === ebook.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteEbook.mutate({ id: ebook.id })}
                          className="px-2 py-1 text-[0.65rem] bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 text-[0.65rem] bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(ebook.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 leading-relaxed">
          <strong>Nota sobre Stripe:</strong> Para activar la compra de un ebook, crea el precio en{" "}
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">
            Stripe Dashboard
          </a>{" "}
          y pega el <code>price_id</code> en el campo correspondiente al editar el ebook. El campo{" "}
          <em>slug</em> debe coincidir con el ID usado en el sistema de compras.
        </div>
      </div>
    </CRMLayout>
  );
}
