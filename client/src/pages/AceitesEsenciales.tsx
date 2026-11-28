/**
 * Aceites esenciales — página de serie, la que se ve mientras no se publique otra desde «Editar web».
 * Su contenido (shared/aceitesPage.ts) son los mismos bloques que Cristina edita en el panel.
 */
import Layout from "@/components/Layout";
import PageBlocksView from "@/components/site/PageBlocksView";
import { usePageSeo } from "@/hooks/usePageSeo";
import { aceitesContent } from "@shared/aceitesPage";

const CONTENT = aceitesContent();

export default function AceitesEsenciales() {
  usePageSeo(CONTENT.seo);
  return (
    <Layout>
      <PageBlocksView blocks={CONTENT.blocks} ctx={{ path: "/aceites-esenciales", title: "Aceites esenciales", detail: null }} />
    </Layout>
  );
}
