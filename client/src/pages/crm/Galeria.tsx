/**
 * Galería — CRM Cristina Vive Consciente
 * Muestra todos los archivos alojados en el servidor con opción de copiar URL y eliminar.
 */
import { useState } from "react";
import { Copy, Trash2, ImageIcon, FileIcon, Search, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Galeria() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "file">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: files = [], isLoading } = trpc.gallery.list.useQuery();

  const deleteMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      utils.gallery.list.invalidate();
      toast.success("Archivo eliminado");
      setConfirmDelete(null);
    },
    onError: (e) => toast.error("Error al eliminar: " + e.message),
  });

  function copyUrl(url: string, key: string) {
    const full = window.location.origin + url;
    navigator.clipboard.writeText(full).then(() => {
      setCopiedKey(key);
      toast.success("URL copiada al portapapeles");
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }

  const filtered = files.filter((f) => {
    const matchesSearch =
      !search || f.filename.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || f.type === filter;
    return matchesSearch && matchesFilter;
  });

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <CRMLayout title="Galería">
      <div className="space-y-6">
        {/* Header stats */}
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex gap-6 text-sm font-body text-gray-500">
            <span>
              <span className="font-medium text-gray-800">{files.length}</span> archivos
            </span>
            <span>
              <span className="font-medium text-gray-800">{formatBytes(totalSize)}</span> total
            </span>
            <span>
              <span className="font-medium text-gray-800">
                {files.filter((f) => f.type === "image").length}
              </span>{" "}
              imágenes
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 text-sm font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div className="flex border border-gray-200 text-sm font-body">
            {(["all", "image", "file"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-3 py-2 transition-colors ${
                  filter === v
                    ? "bg-[oklch(0.52_0.08_148)] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
                style={{ borderRadius: 0 }}
              >
                {v === "all" ? "Todos" : v === "image" ? "Imágenes" : "Archivos"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <ImageIcon size={36} strokeWidth={1} />
            <p className="text-sm font-body">No hay archivos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((file) => (
              <div
                key={file.key}
                className={`group relative border bg-white flex flex-col overflow-hidden transition-colors ${
                  (file as any).inUse
                    ? "border-[oklch(0.52_0.08_148)]/40"
                    : "border-gray-200 hover:border-[oklch(0.52_0.08_148)]"
                }`}
              >
                {/* Preview */}
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {file.type === "image" ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <FileIcon size={32} className="text-gray-300" />
                  )}
                </div>

                {/* In-use badge */}
                {(file as any).inUse && (
                  <div
                    className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-[oklch(0.52_0.08_148)] text-white"
                    title="Imagen en uso en la web"
                  >
                    <ShieldCheck size={10} />
                    <span className="text-[9px] font-body tracking-wide">En uso</span>
                  </div>
                )}

                {/* Info */}
                <div className="p-2 flex flex-col gap-0.5 flex-1">
                  <p
                    className="text-xs font-body text-gray-700 truncate leading-tight"
                    title={file.filename}
                  >
                    {file.filename}
                  </p>
                  <p className="text-[10px] font-body text-gray-400">
                    {formatBytes(file.size)} · {formatDate(file.createdAt)}
                  </p>
                </div>

                {/* Actions — visible on hover */}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => copyUrl(file.url, file.key)}
                    title="Copiar URL"
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {copiedKey === file.key ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <Copy size={12} className="text-gray-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(file.key)}
                    title={(file as any).inUse ? "Imagen en uso — ver opciones" : "Eliminar"}
                    className={`w-7 h-7 flex items-center justify-center bg-white border shadow-sm transition-colors ${
                      (file as any).inUse
                        ? "border-amber-200 hover:bg-amber-50 cursor-not-allowed"
                        : "border-gray-200 hover:bg-red-50 hover:border-red-200"
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    <Trash2 size={12} className={(file as any).inUse ? "text-amber-400" : "text-red-400"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (() => {
        const confirmFile = files.find((f) => f.key === confirmDelete);
        const isInUse = (confirmFile as any)?.inUse ?? false;
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 p-6 max-w-sm w-full space-y-4 shadow-lg" style={{ borderRadius: 0 }}>
              <h2 className="font-heading text-[oklch(0.35_0.05_148)] text-lg">Eliminar archivo</h2>

              {isInUse ? (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200">
                  <ShieldCheck size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-body text-amber-800 leading-snug">
                    Esta imagen está siendo utilizada en la web (productos, consultas, blog u otras secciones). No puedes eliminarla mientras esté en uso.
                  </p>
                </div>
              ) : (
                <p className="text-sm font-body text-gray-600">
                  ¿Eliminar permanentemente este archivo del servidor? Esta acción no se puede deshacer.
                </p>
              )}

              <p className="text-xs font-body text-gray-400 bg-gray-50 px-3 py-2 break-all">
                {confirmDelete}
              </p>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border border-gray-200 text-sm font-body text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  {isInUse ? "Entendido" : "Cancelar"}
                </button>
                {!isInUse && (
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ key: confirmDelete })}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-body hover:bg-red-600 disabled:opacity-50 transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </CRMLayout>
  );
}
