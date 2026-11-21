/**
 * CmsRoute — decide qué sirve cada ruta pública: la página publicada en «Editar web» o, mientras no se haya publicado
 * (o si se vuelve a la original), la página de siempre en código. Con ?__preview=1 y sesión de administradora muestra
 * el borrador en la web real, con formularios y acciones comerciales inactivos.
 */
import { useEffect, type ComponentType } from "react";
import { useLocation } from "wouter";
import { type PageContent, templateKeyFor } from "@shared/siteEditor";
import { trpc } from "@/lib/trpc";
import { usePageSeo } from "@/hooks/usePageSeo";
import { usePreviewMode } from "@/lib/siteGlobal";
import Layout from "@/components/Layout";
import PageBlocksView, { PreviewShield, type DetailKey } from "./PageBlocksView";
import { FichaScope } from "./detail";
import { WhatsappContextProvider } from "./whatsappContext";

function detailKeyFor(path: string): DetailKey {
  const t = templateKeyFor(path);
  if (!t) return null;
  const seg = t.split("/")[1];
  return seg as DetailKey;
}

const LEGAL_PATHS = ["/privacidad", "/politica-de-cookies"];

export function CmsPage({ path, title, content, preview, inEditor, version }: { path: string; title: string; content: PageContent; preview: boolean; inEditor?: boolean; version?: { id: number | null; at: Date | string | null } }) {
  usePageSeo(content.seo.title || content.seo.description || content.seo.ogImage || content.seo.noindex ? content.seo : null);
  return (
    <PreviewShield active={preview}>
      <WhatsappContextProvider>
      {(wa) => (
      <Layout whatsappContext={wa}>
        {preview && (
          <div data-preview-allow className="fixed bottom-3 left-3 z-[70] bg-[oklch(0.18_0.018_55)] text-white text-xs font-body px-3 py-1.5 shadow-lg pointer-events-none">
            Vista previa del borrador · nada se envía ni se guarda
          </div>
        )}
        <FichaScope kind={detailKey(path)} slug={path.split("/").pop() ?? ""}>
          <PageBlocksView blocks={content.blocks} ctx={{ path, title, detail: detailKey(path), inEditor }} />
        </FichaScope>
        {LEGAL_PATHS.includes(path) && version?.id && (
          <p className="container max-w-3xl text-xs text-[oklch(0.52_0.02_60)] font-body pb-12">
            Versión publicada n.º {version.id}{version.at ? ` · ${new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(version.at))}` : ""}
          </p>
        )}
      </Layout>
      )}
      </WhatsappContextProvider>
    </PreviewShield>
  );
}
const detailKey = detailKeyFor;

export default function CmsRoute({ legacy: Legacy }: { legacy: ComponentType }) {
  const [path] = useLocation();
  const preview = usePreviewMode();
  const published = trpc.site.page.useQuery({ path }, { enabled: !preview, staleTime: 15_000 });
  const draft = trpc.site.preview.useQuery({ path }, { enabled: preview, staleTime: 0 });

  // Las vistas previas se piden con ?__preview=1; sin ello (o sin sesión de administradora) solo se ve lo publicado.
  useEffect(() => { window.scrollTo(0, 0); }, [path]);

  const loading = preview ? draft.isLoading : published.isLoading;
  if (loading) return <div className="min-h-screen bg-[oklch(0.985_0.006_85)]" aria-busy="true" />;

  const doc = preview ? (draft.data && draft.data.content.blocks.length > 0 ? draft.data : null) : published.data;
  if (doc) return <CmsPage path={path} title={doc.title} content={doc.content} preview={preview} version={{ id: (doc as unknown as { versionId?: number | null }).versionId ?? null, at: (doc as unknown as { publishedAt?: Date | null }).publishedAt ?? null }} />;
  // Vista previa de una página que aún sirve el código: también sin acciones activas
  return preview ? <PreviewShield active><Legacy /></PreviewShield> : <Legacy />;
}
