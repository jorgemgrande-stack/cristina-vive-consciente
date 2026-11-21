/**
 * MasajeDetalle — Cristina Vive Consciente
 * Ficha de un masaje. Las secciones y los datos viven en components/site/detail/masajes.tsx (las mismas que usa el editor
 * «Editar web»); esta página las compone en el orden de siempre.
 * Design: "Luz Botánica"
 */

import { useRoute } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { MasajesProvider, MasajesSection } from "@/components/site/detail/masajes";
import { FICHA_MASAJES } from "@shared/ficha/masajes";

export default function MasajeDetalle() {
  const [, params] = useRoute("/masajes/:slug");
  const slug = params?.slug ?? "";
  // Misma consulta que el Provider (se comparte la caché): solo para el servicio del globo de WhatsApp
  const { data: masaje } = trpc.services.getBySlug.useQuery({ slug }, { enabled: !!slug });

  return (
    <Layout whatsappContext={masaje ? { serviceName: masaje.name, serviceSlug: masaje.slug } : undefined}>
      <MasajesProvider slug={slug}>
        {FICHA_MASAJES.map((s) => (
          <MasajesSection key={s.key} name={s.key} />
        ))}
      </MasajesProvider>
    </Layout>
  );
}
