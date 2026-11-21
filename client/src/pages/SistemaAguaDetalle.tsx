/**
 * SistemaAguaDetalle — Ficha pública de detalle de un sistema de agua
 * Cristina Vive Consciente
 * Las secciones viven en components/site/detail/agua.tsx (compartidas con el editor «Editar web»).
 */

import { useParams } from "wouter";
import Layout from "@/components/Layout";
import { AguaProvider, AguaSection } from "@/components/site/detail/agua";
import { FICHA_AGUA } from "@shared/ficha/agua";

export default function SistemaAguaDetalle() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <Layout>
      <AguaProvider slug={slug}>
        {FICHA_AGUA.map((s) => <AguaSection key={s.key} name={s.key} />)}
      </AguaProvider>
    </Layout>
  );
}
