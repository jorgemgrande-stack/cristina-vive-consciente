/**
 * ConsultaDetalle — Cristina Vive Consciente
 * Página de detalle de una consulta individual (/consultas/:slug)
 * Design: "Luz Botánica"
 * Se compone con las mismas secciones que usa el editor (components/site/detail/consultas.tsx).
 */
import { useRoute } from "wouter";
import Layout from "@/components/Layout";
import { ConsultasProvider, ConsultasSection } from "@/components/site/detail/consultas";

export default function ConsultaDetalle() {
  const [, params] = useRoute("/consultas/:slug");
  const slug = params?.slug ?? "";

  return (
    <Layout>
      <ConsultasProvider slug={slug}>
        <ConsultasSection name="cabecera" />
        <section className="py-12 bg-white">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <ConsultasSection name="descripcion" bare />
                <ConsultasSection name="imagen-detalle" bare />
                <ConsultasSection name="beneficios" bare />
                <ConsultasSection name="notas" bare />
                <ConsultasSection name="faq" bare />
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <ConsultasSection name="reserva" bare />
                  <ConsultasSection name="volver" bare />
                </div>
              </div>
            </div>
          </div>
        </section>
      </ConsultasProvider>
    </Layout>
  );
}
