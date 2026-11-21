import { Pencil } from "lucide-react";
import { usePreviewMode } from "@/lib/siteGlobal";

/**
 * Acceso rápido de la administradora desde una tarjeta al módulo donde se editan sus datos (precio, duración, contenido).
 * Solo aparece en la vista previa privada con sesión de administradora: los visitantes nunca lo reciben.
 */
export default function AdminEditLink({ href, label }: { href: string; label: string }) {
  if (!usePreviewMode()) return null;
  return (
    <a
      data-preview-allow
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 bg-[oklch(0.18_0.018_55)] text-white text-[0.65rem] font-body px-2 py-1 no-underline shadow"
    >
      <Pencil size={10} /> {label}
    </a>
  );
}
