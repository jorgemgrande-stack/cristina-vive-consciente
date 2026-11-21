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

export default function MasajeDetalle() {
  const [, params] = useRoute("/masajes/:slug");
  const slug = params?.slug ?? "";
  // Misma consulta que el Provider (se comparte la caché): solo para el servicio del globo de WhatsApp
  const { data: masaje } = trpc.services.getBySlug.useQuery({ slug }, { enabled: !!slug });

  return (
    <Layout whatsappContext={masaje ? { serviceName: masaje.name, serviceSlug: masaje.slug } : undefined}>
      <MasajesProvider slug={slug}>
        <MasajesSection name="cabecera" />
        <section className="py-12 bg-white pb-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-12">
                {["descripcion", "experiencia", "beneficios", "consideraciones", "como_reservar", "faq"].map((k) => (
                  <MasajesSection key={k} name={k} bare />
                ))}
              </div>
              <div>
                <div className="lg:sticky lg:top-24 space-y-4">
                  <MasajesSection name="donde_cuando" bare />
                </div>
              </div>
            </div>
          </div>
        </section>
        <MasajesSection name="barra_reserva" />
      </MasajesProvider>
    </Layout>
  );
}
