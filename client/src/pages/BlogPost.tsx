/**
 * BlogPost — Cristina Vive Consciente
 * Página pública de detalle de artículo del blog
 * Design: "Luz Botánica"
 * Se compone con las mismas secciones que usa el editor (components/site/detail/blog.tsx).
 */
import { useRoute } from "wouter";
import Layout from "@/components/Layout";
import { BlogProvider, BlogSection } from "@/components/site/detail/blog";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";

  return (
    <Layout>
      <BlogProvider slug={slug}>
        <BlogSection name="cabecera" />
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <BlogSection name="meta" bare />
          <BlogSection name="titulo" bare />
          <BlogSection name="extracto" bare />
          <BlogSection name="imagen-destacada" bare />
          <BlogSection name="contenido" bare />
          <BlogSection name="comentarios" bare />
          <BlogSection name="volver" bare />
        </article>
      </BlogProvider>
    </Layout>
  );
}
