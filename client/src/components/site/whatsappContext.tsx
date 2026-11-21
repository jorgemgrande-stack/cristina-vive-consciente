/**
 * Contexto del globo de WhatsApp para páginas montadas por el editor: la ficha de un masaje o consulta nombra el servicio
 * en el mensaje y en la medición. Las secciones de ficha lo fijan con `useWhatsappContext(ctx)`; CmsPage lo lee en Layout.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { WhatsAppContext } from "@/components/WhatsAppButton";

const Ctx = createContext<{ value: WhatsAppContext | undefined; set: (v: WhatsAppContext | undefined) => void }>({ value: undefined, set: () => {} });

export function WhatsappContextProvider({ children }: { children: (value: WhatsAppContext | undefined) => ReactNode }) {
  const [value, set] = useState<WhatsAppContext | undefined>();
  return <Ctx.Provider value={{ value, set }}>{children(value)}</Ctx.Provider>;
}

/** Fija el servicio del globo de WhatsApp mientras el componente está montado (no hace nada fuera de una página del editor). */
export function useWhatsappContext(ctx: WhatsAppContext | undefined): void {
  const { set } = useContext(Ctx);
  const name = ctx?.serviceName, slug = ctx?.serviceSlug;
  useEffect(() => {
    set(name && slug ? { serviceName: name, serviceSlug: slug } : undefined);
    return () => set(undefined);
  }, [name, slug]); // eslint-disable-line react-hooks/exhaustive-deps
}
