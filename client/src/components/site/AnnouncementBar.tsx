import { useState } from "react";
import { X } from "lucide-react";
import { useSiteGlobal } from "@/lib/siteGlobal";
import SiteLink from "./SiteLink";

/** Aviso de la web (editable en Editar web → Ajustes): una línea sobre la cabecera, que se puede cerrar. */
export default function AnnouncementBar() {
  const { announcement } = useSiteGlobal();
  const [closedText, setClosedText] = useState<string | null>(() => {
    try { return sessionStorage.getItem("cvc-announcement-closed"); } catch { return null; }
  });
  if (announcement.enabled !== "on" || !announcement.text || closedText === announcement.text) return null;
  const close = () => {
    setClosedText(announcement.text);
    try { sessionStorage.setItem("cvc-announcement-closed", announcement.text); } catch { /* sin almacenamiento */ }
  };
  return (
    <div role="status" className="relative bg-[oklch(0.38_0.07_148)] text-white text-xs font-body">
      <div className="container flex items-center justify-center gap-3 py-2 relative pr-8">
        <span style={{ fontWeight: 300 }}>{announcement.text}</span>
        {announcement.linkLabel && announcement.linkUrl && (
          <SiteLink href={announcement.linkUrl} className="underline underline-offset-2 text-white" style={{ fontWeight: 500 }}>
            {announcement.linkLabel}
          </SiteLink>
        )}
        <button onClick={close} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white" aria-label="Cerrar aviso">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
