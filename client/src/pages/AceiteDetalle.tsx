/**
 * AceiteDetalle.tsx — Ficha de detalle de aceite esencial
 * Cristina Vive Consciente
 * Las secciones viven en components/site/detail/aceites.tsx (compartidas con el editor «Editar web»).
 */

import { useParams } from "wouter";
import Layout from "@/components/Layout";
import { AceitesProvider, AceitesSection } from "@/components/site/detail/aceites";
import { FICHA_ACEITES } from "@shared/ficha/aceites";

export default function AceiteDetalle() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <Layout>
      <AceitesProvider slug={slug ?? ""}>
        {FICHA_ACEITES.map((s) => <AceitesSection key={s.key} name={s.key} />)}
      </AceitesProvider>
    </Layout>
  );
}
