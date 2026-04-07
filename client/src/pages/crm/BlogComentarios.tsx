/**
 * BlogComentarios — CRM Cristina Vive Consciente
 * Moderación de comentarios del blog: aprobar, rechazar, eliminar
 */
import { useState } from "react";
import { MessageCircle, Check, X, Trash2, Clock, CheckCircle, XCircle, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import CRMLayout from "@/components/CRMLayout";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock size={12} />,
  },
  approved: {
    label: "Aprobado",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle size={12} />,
  },
  rejected: {
    label: "Rechazado",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle size={12} />,
  },
};

export default function BlogComentarios() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const { data: comments = [], isLoading, refetch } = trpc.blogComments.admin.listAll.useQuery({
    status: statusFilter,
  });

  const { data: pendingCount = 0 } = trpc.blogComments.admin.countPending.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const approveMutation = trpc.blogComments.admin.approve.useMutation({
    onSuccess: () => { toast.success("Comentario aprobado"); refetch(); },
    onError: () => toast.error("Error al aprobar el comentario"),
  });

  const rejectMutation = trpc.blogComments.admin.reject.useMutation({
    onSuccess: () => { toast.success("Comentario rechazado"); refetch(); },
    onError: () => toast.error("Error al rechazar el comentario"),
  });

  const deleteMutation = trpc.blogComments.admin.delete.useMutation({
    onSuccess: () => { toast.success("Comentario eliminado"); refetch(); },
    onError: () => toast.error("Error al eliminar el comentario"),
  });

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "pending", label: `Pendientes${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { value: "approved", label: "Aprobados" },
    { value: "rejected", label: "Rechazados" },
    { value: "all", label: "Todos" },
  ];

  return (
    <CRMLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageCircle size={22} className="text-[oklch(0.52_0.08_148)]" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Comentarios del Blog</h1>
              <p className="text-sm text-gray-500">Modera los comentarios antes de publicarlos</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full border border-amber-200">
              <Clock size={13} />
              {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === f.value
                  ? "bg-[oklch(0.52_0.08_148)] text-white border-[oklch(0.52_0.08_148)]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista de comentarios */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando comentarios...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">
              {statusFilter === "pending"
                ? "No hay comentarios pendientes de moderación"
                : "No hay comentarios en esta categoría"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const statusInfo = STATUS_LABELS[comment.status];
              return (
                <div
                  key={comment.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  {/* Meta */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[oklch(0.93_0.03_148)] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-[oklch(0.52_0.08_148)]">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{comment.authorName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          <span className="text-gray-500">Post #{comment.postId}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Contenido */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 pl-12">
                    {comment.content}
                  </p>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pl-12">
                    {comment.status !== "approved" && (
                      <button
                        onClick={() => approveMutation.mutate({ id: comment.id })}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <Check size={13} />
                        Aprobar
                      </button>
                    )}
                    {comment.status !== "rejected" && (
                      <button
                        onClick={() => rejectMutation.mutate({ id: comment.id })}
                        disabled={rejectMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        <X size={13} />
                        Rechazar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar este comentario permanentemente?")) {
                          deleteMutation.mutate({ id: comment.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
