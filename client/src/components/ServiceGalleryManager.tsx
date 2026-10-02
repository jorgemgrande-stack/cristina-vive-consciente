/**
 * ServiceGalleryManager — gestión de la galería de un masaje desde el CRM.
 * Subir varias imágenes, elegir portada, cambiar el orden, editar el texto alternativo y quitar imágenes.
 *
 * - Reutiliza el endpoint de subida existente (POST /api/upload) y los procedimientos services.images*.
 * - «Quitar» solo saca la imagen de esta galería: el archivo NO se borra (puede usarse en otros contenidos).
 * - Mientras no haya imágenes propias, la ficha muestra las actuales + la sala; «Personalizar» las copia aquí.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Star, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_FILE_MB = 20;

async function uploadOne(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Error ${res.status} al subir ${file.name}`);
  }
  const data = await res.json();
  return data.url as string;
}

export default function ServiceGalleryManager({ serviceId, onCoverChange }: { serviceId: number; onCoverChange?: (url: string) => void }) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = trpc.services.imagesList.useQuery({ serviceId });

  // La portada de la galería también es la imagen de la tarjeta: se avisa al formulario para que no la pise al guardar
  const coverUrl = data?.custom ? data.images[0]?.url : undefined;
  useEffect(() => {
    if (coverUrl) onCoverChange?.(coverUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverUrl]);

  const refresh = () => {
    void utils.services.imagesList.invalidate({ serviceId });
    void utils.services.gallery.invalidate();
    void utils.services.getBySlug.invalidate();
    void utils.services.list.invalidate();
  };
  const onError = (e: { message: string }) => toast.error(e.message);

  const add = trpc.services.imagesAdd.useMutation({ onError });
  const adopt = trpc.services.imagesAdopt.useMutation({ onSuccess: refresh, onError });
  const setCover = trpc.services.imagesSetCover.useMutation({ onSuccess: () => { toast.success("Portada actualizada"); refresh(); }, onError });
  const move = trpc.services.imagesMove.useMutation({ onSuccess: refresh, onError });
  const remove = trpc.services.imagesRemove.useMutation({ onSuccess: () => { toast.success("Imagen quitada de la galería"); refresh(); }, onError });
  const updateAlt = trpc.services.imagesUpdateAlt.useMutation({ onSuccess: () => toast.success("Texto alternativo guardado"), onError });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const tooBig = list.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) return toast.error(`${tooBig.name} pesa más de ${MAX_FILE_MB} MB`);
    setUploading(true);
    try {
      const uploaded: Array<{ url: string }> = [];
      for (const f of list) uploaded.push({ url: await uploadOne(f) });
      const res = await add.mutateAsync({ serviceId, images: uploaded });
      toast.success(`${res.added} imagen(es) añadida(s)${res.skippedDuplicates ? ` · ${res.skippedDuplicates} repetida(s) omitida(s)` : ""}`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron subir las imágenes");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando galería…
      </div>
    );
  }

  const busy = uploading || add.isPending || move.isPending || remove.isPending || setCover.isPending || adopt.isPending;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Galería de imágenes</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Aparece en la ficha pública del masaje (foto principal, miniaturas y vista ampliada). La primera es la portada y también
          es la foto de la tarjeta del listado. Máximo {data.max} imágenes.
        </p>
      </div>

      {!data.available && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Para gestionar la galería hace falta crear la tabla <code>service_images</code> (migración 0022,
            <code> scripts/apply-service-images.mjs</code>). Mientras tanto la ficha muestra la galería por defecto.
          </p>
        </div>
      )}

      {data.available && !data.custom && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
          <p>
            Este masaje aún usa la galería por defecto (sus imágenes actuales y la foto de la sala). Para ordenarla, cambiar la portada o
            quitar imágenes, pulsa «Personalizar galería».
          </p>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => adopt.mutate({ serviceId })}>
            Personalizar galería
          </Button>
        </div>
      )}

      {/* Imágenes */}
      <ul className="space-y-3">
        {data.images.map((img, i) => (
          <li key={`${img.url}-${i}`} className="flex gap-3 rounded-md border bg-white p-2 sm:p-3">
            <div className="relative w-24 h-20 sm:w-32 sm:h-24 flex-shrink-0 overflow-hidden rounded bg-muted">
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
              {i === 0 && (
                <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <Star className="h-2.5 w-2.5" fill="currentColor" /> Portada
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {img.id !== null ? (
                <>
                  <Input
                    defaultValue={img.alt}
                    maxLength={300}
                    aria-label={`Texto alternativo de la imagen ${i + 1}`}
                    placeholder="Texto alternativo (describe la imagen)"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== img.alt) updateAlt.mutate({ id: img.id!, alt: v });
                    }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <Button type="button" size="sm" variant="outline" disabled={busy || i === 0} onClick={() => setCover.mutate({ id: img.id! })}>
                      <Star className="h-3.5 w-3.5 mr-1" /> Portada
                    </Button>
                    <Button type="button" size="icon" variant="outline" aria-label="Subir una posición" disabled={busy || i === 0} onClick={() => move.mutate({ id: img.id!, direction: "up" })}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="outline" aria-label="Bajar una posición" disabled={busy || i === data.images.length - 1} onClick={() => move.mutate({ id: img.id!, direction: "down" })}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-700 hover:text-red-800"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("¿Quitar esta imagen de la galería del masaje? El archivo no se borra.")) remove.mutate({ id: img.id! });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Quitar
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{img.alt}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Subir */}
      <div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id={`gallery-upload-${serviceId}`}
          onChange={(e) => void onFiles(e.target.files)}
          disabled={!data.available || busy}
        />
        <Button type="button" variant="outline" disabled={!data.available || busy} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
          {uploading ? "Subiendo…" : "Subir imágenes"}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG o WEBP de hasta {MAX_FILE_MB} MB. Puedes elegir varias a la vez.</p>
      </div>
    </div>
  );
}
