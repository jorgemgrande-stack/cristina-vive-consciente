import { useRef, useState } from "react";
import { Upload, Trash2, GripVertical, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

export default function HeroImagenes() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: images = [], isLoading } = trpc.hero.list.useQuery();

  const addMutation = trpc.hero.add.useMutation({
    onSuccess: () => { utils.hero.list.invalidate(); toast.success("Imagen añadida"); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const removeMutation = trpc.hero.remove.useMutation({
    onSuccess: () => { utils.hero.list.invalidate(); toast.success("Imagen eliminada"); setConfirmDelete(null); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const reorderMutation = trpc.hero.reorder.useMutation({
    onError: (e) => toast.error("Error al guardar orden: " + e.message),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as { url: string; key: string };
        await addMutation.mutateAsync({ url: data.url, key: data.key });
      }
    } catch (err: any) {
      toast.error("Error al subir: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Drag & drop reorder
  const dragOver = useRef<number | null>(null);

  function onDragStart(id: number) { setDraggingId(id); }
  function onDragEnter(id: number) { dragOver.current = id; }
  function onDragEnd() {
    if (draggingId === null || dragOver.current === null || draggingId === dragOver.current) {
      setDraggingId(null); dragOver.current = null; return;
    }
    const reordered = [...images];
    const fromIdx = reordered.findIndex((i) => i.id === draggingId);
    const toIdx = reordered.findIndex((i) => i.id === dragOver.current);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const payload = reordered.map((img, idx) => ({ id: img.id, sortOrder: idx }));
    reorderMutation.mutate(payload);
    utils.hero.list.setData(undefined, reordered.map((img, idx) => ({ ...img, sortOrder: idx })));
    setDraggingId(null);
    dragOver.current = null;
  }

  return (
    <CRMLayout title="Imágenes del Hero">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Upload zone */}
        <div
          className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-stone-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="mx-auto mb-3 text-stone-400" size={28} />
          <p className="text-sm text-stone-600 font-medium">
            {uploading ? "Subiendo…" : "Haz clic o arrastra imágenes aquí"}
          </p>
          <p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP — máx. 20 MB por imagen</p>
        </div>

        {/* Info */}
        <p className="text-xs text-stone-500">
          {images.length === 0
            ? "Sin imágenes — el hero usará la imagen por defecto."
            : images.length === 1
            ? "1 imagen — el hero será estático."
            : `${images.length} imágenes — slideshow automático cada 5 s. Arrastra para reordenar.`}
        </p>

        {/* Image list */}
        {isLoading ? (
          <div className="text-sm text-stone-400">Cargando…</div>
        ) : (
          <ul className="space-y-3">
            {images.map((img, idx) => (
              <li
                key={img.id}
                draggable
                onDragStart={() => onDragStart(img.id)}
                onDragEnter={() => onDragEnter(img.id)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-4 p-3 bg-white rounded-lg border transition-opacity ${
                  draggingId === img.id ? "opacity-40" : "opacity-100"
                }`}
              >
                <GripVertical size={16} className="text-stone-300 cursor-grab flex-shrink-0" />
                <span className="text-xs text-stone-400 w-5 flex-shrink-0">{idx + 1}</span>
                <div className="w-20 h-14 rounded overflow-hidden bg-stone-100 flex-shrink-0">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-stone-500 truncate flex-1 font-mono">{img.url}</span>

                {confirmDelete === img.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      className="text-xs text-red-600 underline"
                      onClick={() => removeMutation.mutate({ id: img.id })}
                    >
                      Confirmar
                    </button>
                    <button className="text-xs text-stone-400" onClick={() => setConfirmDelete(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className="p-1.5 text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                    onClick={() => setConfirmDelete(img.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {images.length === 0 && !isLoading && (
          <div className="text-center py-8 text-stone-400">
            <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aún no hay imágenes configuradas</p>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
