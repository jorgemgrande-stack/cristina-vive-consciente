/**
 * Editar web — páginas: originales, fichas (plantillas), páginas nuevas y accesos a Ajustes, Textos y Redirecciones.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ExternalLink, FilePlus2, Globe, Loader2, Pencil, Settings2, Type, ArrowRightLeft, Trash2, Wand2, Undo2 } from "lucide-react";
import { slugProblem, slugify } from "@shared/siteEditor";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { StatusPill, dateTime, inputCls, labelCls } from "./shared";

export const editUrl = (docKey: string) => `/crm/web/editar?doc=${encodeURIComponent(docKey)}`;
export const previewUrl = (route: string) => `${route}${route.includes("?") ? "&" : "?"}__preview=1`;

function NewPageDialog({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const utils = trpc.useUtils();
  const create = trpc.site.createPage.useMutation({
    onSuccess: async (r) => { await utils.site.documents.invalidate(); navigate(editUrl(r.docKey)); },
    onError: (e) => toast.error(e.message),
  });
  const effective = touched ? slug : slugify(title);
  const problem = effective ? slugProblem(effective) : null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Nueva página" onClick={onClose}>
      <form className="bg-white max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (!problem) create.mutate({ title, slug: effective }); }}>
        <h2 className="font-display text-xl" style={{ fontWeight: 400 }}>Nueva página</h2>
        <div><label className={labelCls} htmlFor="np-title">Título de la página</label><input id="np-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required placeholder="Sobre mí" /></div>
        <div>
          <label className={labelCls} htmlFor="np-slug">Dirección</label>
          <div className="flex items-center gap-1 text-sm font-body"><span className="text-[oklch(0.5_0.02_60)]">cristinaviveconsciente.es/</span><input id="np-slug" className={inputCls} value={effective} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} required /></div>
          {problem && <p className="text-xs text-red-700 mt-1 font-body">{problem}</p>}
        </div>
        <p className="text-xs text-[oklch(0.5_0.02_60)] font-body">Se crea como borrador: nadie la ve hasta que pulses «Publicar».</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-[oklch(0.85_0.015_75)]">Cancelar</button><button type="submit" disabled={!!problem || !title.trim() || create.isPending} className="px-4 py-2 text-xs bg-[oklch(0.52_0.08_148)] text-white disabled:opacity-50">Crear y editar</button></div>
      </form>
    </div>
  );
}

function RenameDialog({ docKey, onClose }: { docKey: string; onClose: () => void }) {
  const [slug, setSlug] = useState(docKey.slice(1));
  const utils = trpc.useUtils();
  const rename = trpc.site.renamePage.useMutation({
    onSuccess: async () => { await utils.site.documents.invalidate(); toast.success("Dirección cambiada. La anterior redirige a la nueva."); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const problem = slug !== docKey.slice(1) ? slugProblem(slug) : null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Cambiar dirección" onClick={onClose}>
      <form className="bg-white max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (!problem) rename.mutate({ docKey, slug }); }}>
        <h2 className="font-display text-xl" style={{ fontWeight: 400 }}>Cambiar la dirección</h2>
        <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Nueva dirección" />
        {problem && <p className="text-xs text-red-700 font-body">{problem}</p>}
        <p className="text-xs text-[oklch(0.5_0.02_60)] font-body">La dirección actual (<b>{docKey}</b>) quedará redirigida a la nueva (redirección permanente 301), para no perder enlaces ni posicionamiento.</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-[oklch(0.85_0.015_75)]">Cancelar</button><button type="submit" disabled={!!problem || rename.isPending || slug === docKey.slice(1)} className="px-4 py-2 text-xs bg-[oklch(0.52_0.08_148)] text-white disabled:opacity-50">Cambiar</button></div>
      </form>
    </div>
  );
}

export default function WebPaginas() {
  const { data = [], isLoading } = trpc.site.documents.useQuery();
  const utils = trpc.useUtils();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const del = trpc.site.deletePage.useMutation({ onSuccess: () => utils.site.documents.invalidate(), onError: (e) => toast.error(e.message) });
  const legacy = trpc.site.serveLegacy.useMutation({ onSuccess: () => { void utils.site.documents.invalidate(); void utils.site.page.invalidate(); toast.success("La web vuelve a servir la página original"); }, onError: (e) => toast.error(e.message) });
  const migrate = trpc.site.migrate.useMutation({
    onSuccess: (r) => { void utils.site.documents.invalidate(); toast.success(r.created ? "Borrador preparado desde la web actual. Revísalo y pulsa «Publicar» cuando esté bien." : "Ya había un borrador con cambios: no se ha tocado."); },
    onError: (e) => toast.error(e.message),
  });

  const pages = data.filter((d) => d.kind === "page" && !d.custom);
  const templates = data.filter((d) => d.kind === "template");
  const custom = data.filter((d) => d.custom);

  const Row = ({ d }: { d: (typeof data)[number] }) => (
    <tr className="border-t border-[oklch(0.92_0.01_75)]">
      <td className="py-3 pr-3 font-body text-sm" style={{ fontWeight: 500 }}>{d.label}<div className="text-xs text-[oklch(0.55_0.02_60)]" style={{ fontWeight: 300 }}>{d.route}</div></td>
      <td className="py-3 pr-3"><StatusPill published={d.published} changed={d.draftChanged} served={d.servedFrom} /><div className="text-[0.7rem] text-[oklch(0.55_0.02_60)] mt-1 font-body">{d.publishedAt ? `Publicada: ${dateTime(d.publishedAt)}` : d.draftUpdatedAt ? `Borrador: ${dateTime(d.draftUpdatedAt)}` : ""}</div></td>
      <td className="py-3 text-right whitespace-nowrap">
        <div className="inline-flex flex-wrap justify-end gap-1.5">
          {!d.custom && !d.published && !d.draftChanged && (
            <button onClick={() => migrate.mutate({ docKey: d.docKey })} disabled={migrate.isPending} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-[oklch(0.85_0.015_75)] hover:bg-[oklch(0.97_0.006_85)]" title="Crea el borrador con los textos, imágenes y enlaces de la web actual">
              <Wand2 size={12} /> Preparar borrador
            </button>
          )}
          <Link href={editUrl(d.docKey)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[oklch(0.52_0.08_148)] text-white no-underline"><Pencil size={12} /> Editar</Link>
          {!d.route.includes(":") && <a href={d.servedFrom === "cms" || d.draftChanged || d.custom ? previewUrl(d.route) : d.route} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-[oklch(0.85_0.015_75)] no-underline text-inherit"><ExternalLink size={12} /> Ver</a>}
          {!d.custom && d.servedFrom === "cms" && <button onClick={() => { if (window.confirm("La web volverá a mostrar la página original (en código). El borrador y el historial se conservan. ¿Continuar?")) legacy.mutate({ docKey: d.docKey }); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-[oklch(0.85_0.015_75)]" title="Dejar de servir la versión del editor"><Undo2 size={12} /> Volver a la original</button>}
          {d.custom && <button onClick={() => setRenaming(d.docKey)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-[oklch(0.85_0.015_75)]"><ArrowRightLeft size={12} /> Dirección</button>}
          {d.custom && <button onClick={() => { if (window.confirm(`¿Eliminar «${d.label}»? Se borra con su historial y deja de existir en la web.`)) del.mutate({ docKey: d.docKey }); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-red-200 text-red-700"><Trash2 size={12} /> Eliminar</button>}
        </div>
      </td>
    </tr>
  );
  const Table = ({ rows, empty }: { rows: typeof data; empty?: string }) => rows.length === 0 ? <p className="text-sm font-body text-[oklch(0.5_0.02_60)] py-3">{empty}</p> : <table className="w-full"><tbody>{rows.map((d) => <Row key={d.docKey} d={d} />)}</tbody></table>;

  return (
    <CRMLayout title="Editar web">
      <div className="max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl" style={{ fontWeight: 400 }}>Editar web</h1>
            <p className="text-sm font-body text-[oklch(0.45_0.02_55)]" style={{ fontWeight: 300 }}>Cambia textos, imágenes, menús y páginas sin tocar código. Los cambios son borradores hasta que pulsas «Publicar».</p>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-[oklch(0.52_0.08_148)] text-white"><FilePlus2 size={15} /> Nueva página</button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { href: "/crm/web/ajustes", icon: <Settings2 size={16} />, t: "Ajustes del sitio", d: "Logo, menú, pie, contacto, redes, WhatsApp y avisos" },
            { href: "/crm/web/textos", icon: <Type size={16} />, t: "Textos de reserva y compra", d: "Mensajes de citas, Mi consulta, pedidos y guías" },
            { href: "/crm/web/redirecciones", icon: <ArrowRightLeft size={16} />, t: "Redirecciones", d: "Direcciones antiguas que llevan a páginas nuevas" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="block border border-[oklch(0.9_0.012_75)] bg-white p-4 no-underline text-inherit hover:border-[oklch(0.52_0.08_148)]">
              <div className="flex items-center gap-2 text-[oklch(0.42_0.08_148)] mb-1">{c.icon}<span className="font-body text-sm" style={{ fontWeight: 500 }}>{c.t}</span></div>
              <p className="text-xs font-body text-[oklch(0.5_0.02_60)]">{c.d}</p>
            </Link>
          ))}
        </div>

        {isLoading ? <Loader2 className="animate-spin" /> : (
          <>
            <section className="bg-white border border-[oklch(0.9_0.012_75)] p-5 mb-6">
              <h2 className="font-display text-lg mb-1 flex items-center gap-2" style={{ fontWeight: 400 }}><Globe size={16} /> Páginas de la web</h2>
              <p className="text-xs font-body text-[oklch(0.5_0.02_60)] mb-2">Mientras una página figure como «Original», la web sigue mostrando la de siempre. «Preparar borrador» copia su contenido actual al editor; la web no cambia hasta que publiques.</p>
              <Table rows={pages} />
            </section>
            <section className="bg-white border border-[oklch(0.9_0.012_75)] p-5 mb-6">
              <h2 className="font-display text-lg mb-1" style={{ fontWeight: 400 }}>Fichas (consultas, masajes, agua, aceites, blog)</h2>
              <p className="text-xs font-body text-[oklch(0.5_0.02_60)] mb-2">Una plantilla se aplica a todas las fichas de su tipo. El precio, la duración y las condiciones se siguen leyendo de su ficha en Servicios, Agua, Aceites o Blog.</p>
              <Table rows={templates} />
            </section>
            <section className="bg-white border border-[oklch(0.9_0.012_75)] p-5">
              <h2 className="font-display text-lg mb-1" style={{ fontWeight: 400 }}>Páginas nuevas</h2>
              <Table rows={custom} empty="Aún no has creado ninguna. Pulsa «Nueva página»." />
            </section>
          </>
        )}
      </div>
      {creating && <NewPageDialog onClose={() => setCreating(false)} />}
      {renaming && <RenameDialog docKey={renaming} onClose={() => setRenaming(null)} />}
    </CRMLayout>
  );
}
