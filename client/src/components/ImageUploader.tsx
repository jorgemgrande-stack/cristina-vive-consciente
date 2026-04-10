import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, X, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  className?: string;
  accept?: string;
  icon?: "image" | "file";
}

export function ImageUploader({
  value,
  onChange,
  label = "Imagen",
  hint = "JPG, PNG, WEBP hasta 20 MB",
  className = "",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  icon = "image",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Track image load state independently from the URL value
  const [imgState, setImgState] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  // Reset image state whenever the URL changes so we re-attempt to load it
  useEffect(() => {
    if (value) {
      setImgState("loading");
    } else {
      setImgState("idle");
    }
  }, [value]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(err.error ?? "Error al subir");
        }
        const data = await res.json();
        onChange(data.url);
        toast.success("Archivo subido correctamente");
      } catch (err: any) {
        toast.error(err.message ?? "Error al subir el archivo");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const isImage = icon === "image";
  const isPdf = value?.toLowerCase().endsWith(".pdf");

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Preview area */}
      {value && (
        <div className="relative group inline-block">
          {isImage && !isPdf ? (
            <>
              {/* Spinner while the image is loading */}
              {imgState === "loading" && (
                <div className="h-32 w-32 rounded-lg border border-border bg-muted flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error state — image URL is kept so it can still be saved/replaced */}
              {imgState === "error" && (
                <div className="h-32 w-auto max-w-xs rounded-lg border border-orange-200 bg-orange-50 flex flex-col items-center justify-center gap-1.5 px-4 py-3">
                  <AlertCircle className="h-5 w-5 text-orange-400 shrink-0" />
                  <span className="text-xs text-orange-600 text-center font-medium">
                    Imagen no disponible
                  </span>
                  <span className="text-xs text-orange-400 truncate max-w-[180px]" title={value}>
                    {value.split("/").pop()}
                  </span>
                </div>
              )}

              {/* Actual image — hidden until loaded to avoid showing the broken-image icon */}
              <img
                key={value}
                src={value}
                alt="Vista previa"
                className={`h-32 w-auto max-w-xs rounded-lg border border-border object-cover shadow-sm ${
                  imgState === "loaded" ? "block" : "hidden"
                }`}
                onLoad={() => setImgState("loaded")}
                onError={() => setImgState("error")}
              />
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[200px]">{value.split("/").pop()}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center h-6 w-6 rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/80 transition-colors"
            title="Eliminar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
          px-6 py-5 text-center cursor-pointer transition-colors
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Subiendo...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {value ? "Cambiar archivo" : "Haz clic o arrastra aquí"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>
    </div>
  );
}

// Variante para PDFs
export function FileUploader(props: Omit<ImageUploaderProps, "accept" | "icon">) {
  return (
    <ImageUploader
      {...props}
      accept="application/pdf"
      icon="file"
      hint={props.hint ?? "PDF hasta 20 MB"}
    />
  );
}
