/**
 * Editar web — ajustes globales: identidad (logo), aviso, cabecera y menús, pie, contacto, redes y botón de WhatsApp.
 * Borrador con guardado automático y publicación explícita; la vista previa abre la web real con el borrador.
 */
import { ExternalLink, Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { ReactNode } from "react";
import type { GlobalContent, NavItem, SiteGlobal } from "@shared/siteEditor";
import CRMLayout from "@/components/CRMLayout";
import { ImageUploader } from "@/components/ImageUploader";
import { PublishControls, SaveBadge, inputCls, labelCls, useDocEditor } from "./shared";
import { previewUrl } from "./WebPaginas";

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-[oklch(0.9_0.012_75)] p-5 mb-5">
      <h2 className="font-display text-lg" style={{ fontWeight: 400 }}>{title}</h2>
      {hint && <p className="text-xs font-body text-[oklch(0.5_0.02_60)] mb-3">{hint}</p>}
      <div className="space-y-3 mt-3">{children}</div>
    </section>
  );
}
function Text({ label, value, onChange, area, placeholder }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; placeholder?: string }) {
  const id = `ws-${label}`;
  return <div><label className={labelCls} htmlFor={id}>{label}</label>{area ? <textarea id={id} rows={3} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /> : <input id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}</div>;
}

function NavEditor({ items, onChange, addLabel = "Añadir enlace" }: { items: NavItem[]; onChange: (n: NavItem[]) => void; addLabel?: string }) {
  const move = (i: number, d: -1 | 1) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input className={inputCls} value={it.label} aria-label="Texto del enlace" placeholder="Texto" onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
          <input className={inputCls} value={it.url} aria-label="Dirección del enlace" placeholder="/consultas o https://…" onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} />
          <span className="flex">
            <button type="button" className="p-1.5 hover:bg-[oklch(0.96_0.006_85)]" onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp size={13} /></button>
            <button type="button" className="p-1.5 hover:bg-[oklch(0.96_0.006_85)]" onClick={() => move(i, 1)} aria-label="Bajar"><ArrowDown size={13} /></button>
            <button type="button" className="p-1.5 text-red-700 hover:bg-red-50" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Quitar"><Trash2 size={13} /></button>
          </span>
        </div>
      ))}
      <button type="button" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-[oklch(0.85_0.015_75)] bg-white" onClick={() => onChange([...items, { label: "", url: "/" }])}><Plus size={12} /> {addLabel}</button>
    </div>
  );
}

export default function WebAjustes() {
  const editor = useDocEditor<GlobalContent>("global");
  const g = editor.content?.global;
  const set = (fn: (g: SiteGlobal) => SiteGlobal) => editor.update((c) => ({ ...c, global: fn(c.global) }));
  if (!g) return <CRMLayout title="Ajustes del sitio"><div className="p-10"><Loader2 className="animate-spin" /></div></CRMLayout>;
  const h = g.header, f = g.footer;
  return (
    <CRMLayout title="Ajustes del sitio">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sticky top-0 bg-[oklch(0.97_0.006_85)] py-2 z-20">
          <div><h1 className="font-display text-2xl" style={{ fontWeight: 400 }}>Ajustes del sitio</h1><SaveBadge state={editor.state} /></div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={async () => { await editor.flush(); window.open(previewUrl("/"), "_blank"); }} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-[oklch(0.85_0.015_75)] bg-white"><ExternalLink size={13} /> Vista previa</button>
            <PublishControls docKey="global" editor={editor} />
          </div>
        </div>

        <Card title="Logo e identidad" hint="El logo se usa en la cabecera, el menú del móvil y el pie. Conserva la marca BION.">
          <div><span className={labelCls}>Logo</span><ImageUploader value={g.identity.logoUrl} onChange={(u) => set((x) => ({ ...x, identity: { ...x.identity, logoUrl: u } }))} label="" /></div>
          <Text label="Texto alternativo del logo" value={g.identity.logoAlt} onChange={(v) => set((x) => ({ ...x, identity: { ...x.identity, logoAlt: v } }))} />
        </Card>

        <Card title="Aviso en la parte superior" hint="Una línea sobre la cabecera, para avisar de vacaciones, novedades o cambios de horario. Se puede cerrar.">
          <label className="flex items-center gap-2 text-sm font-body"><input type="checkbox" checked={g.announcement.enabled === "on"} onChange={(e) => set((x) => ({ ...x, announcement: { ...x.announcement, enabled: e.target.checked ? "on" : "off" } }))} /> Mostrar el aviso</label>
          <Text label="Texto" value={g.announcement.text} onChange={(v) => set((x) => ({ ...x, announcement: { ...x.announcement, text: v } }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Text label="Texto del enlace (opcional)" value={g.announcement.linkLabel} onChange={(v) => set((x) => ({ ...x, announcement: { ...x.announcement, linkLabel: v } }))} />
            <Text label="Dirección del enlace" value={g.announcement.linkUrl} onChange={(v) => set((x) => ({ ...x, announcement: { ...x.announcement, linkUrl: v } }))} />
          </div>
        </Card>

        <Card title="Cabecera y menú" hint="El menú de escritorio muestra las primeras entradas; el del móvil puede ser distinto.">
          <span className={labelCls}>Entradas del menú</span>
          <NavEditor items={h.nav} onChange={(nav) => set((x) => ({ ...x, header: { ...x.header, nav } }))} />
          <div>
            <label className={labelCls} htmlFor="dc">Cuántas entradas caben en el menú de escritorio</label>
            <input id="dc" type="number" min={1} max={12} className={inputCls} value={h.desktopCount} onChange={(e) => set((x) => ({ ...x, header: { ...x.header, desktopCount: Number(e.target.value) || 7 } }))} />
          </div>
          <div>
            <span className={labelCls}>Menú del móvil (vacío = el mismo que el de escritorio)</span>
            <NavEditor items={h.mobileNav} onChange={(mobileNav) => set((x) => ({ ...x, header: { ...x.header, mobileNav } }))} addLabel="Añadir entrada del móvil" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Text label="Enlace de contacto (texto)" value={h.contactLabel} onChange={(v) => set((x) => ({ ...x, header: { ...x.header, contactLabel: v } }))} />
            <Text label="Enlace de contacto (dirección)" value={h.contactUrl} onChange={(v) => set((x) => ({ ...x, header: { ...x.header, contactUrl: v } }))} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Text label="Botón destacado (texto; vacío = sin botón)" value={h.ctaLabel} onChange={(v) => set((x) => ({ ...x, header: { ...x.header, ctaLabel: v } }))} />
            <div>
              <label className={labelCls} htmlFor="cm">Qué hace el botón</label>
              <select id="cm" className={inputCls} value={h.ctaMode} onChange={(e) => set((x) => ({ ...x, header: { ...x.header, ctaMode: e.target.value as "booking" | "link" } }))}>
                <option value="booking">Abre la ventana de reserva</option><option value="link">Lleva a un enlace</option>
              </select>
            </div>
            {h.ctaMode === "link" && <Text label="Dirección del botón" value={h.ctaUrl} onChange={(v) => set((x) => ({ ...x, header: { ...x.header, ctaUrl: v } }))} />}
          </div>
        </Card>

        <Card title="Pie de página" hint="Textos, columnas de enlaces, contacto y redes.">
          <Text label="Texto de presentación" value={f.about} area onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, about: v } }))} />
          {f.columns.map((col, ci) => (
            <div key={ci} className="border border-[oklch(0.9_0.012_75)] p-3 space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1"><Text label={`Título de la columna ${ci + 1}`} value={col.title} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, columns: x.footer.columns.map((c, k) => (k === ci ? { ...c, title: v } : c)) } }))} /></div>
                <button type="button" className="p-2 text-red-700 border border-red-200" aria-label="Quitar columna" onClick={() => set((x) => ({ ...x, footer: { ...x.footer, columns: x.footer.columns.filter((_, k) => k !== ci) } }))}><Trash2 size={14} /></button>
              </div>
              <NavEditor items={col.links} onChange={(links) => set((x) => ({ ...x, footer: { ...x.footer, columns: x.footer.columns.map((c, k) => (k === ci ? { ...c, links } : c)) } }))} />
            </div>
          ))}
          {f.columns.length < 3 && <button type="button" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-[oklch(0.85_0.015_75)] bg-white" onClick={() => set((x) => ({ ...x, footer: { ...x.footer, columns: [...x.footer.columns, { title: "Nueva columna", links: [] }] } }))}><Plus size={12} /> Añadir columna</button>}
          <div className="grid sm:grid-cols-2 gap-3">
            <Text label="Título del bloque de contacto" value={f.contactTitle} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, contactTitle: v } }))} />
            <Text label="Correo de contacto" value={f.contactEmail} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, contactEmail: v } }))} />
          </div>
          <Text label="Línea de contacto (por ejemplo: «Consultas por cita previa» o un horario)" value={f.contactLine} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, contactLine: v } }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Text label="Botón del pie (texto)" value={f.ctaLabel} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, ctaLabel: v } }))} />
            <Text label="Botón del pie (dirección)" value={f.ctaUrl} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, ctaUrl: v } }))} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Text label="Instagram (https://…)" value={f.instagram} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, instagram: v } }))} />
            <Text label="Facebook (https://…)" value={f.facebook} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, facebook: v } }))} />
            <Text label="YouTube (https://…)" value={f.youtube} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, youtube: v } }))} />
          </div>
          <Text label="Texto del copyright (tras «© año»)" value={f.copyright} onChange={(v) => set((x) => ({ ...x, footer: { ...x.footer, copyright: v } }))} />
          <span className={labelCls}>Enlaces legales (privacidad, cookies, aviso legal…)</span>
          <NavEditor items={f.legalLinks} onChange={(legalLinks) => set((x) => ({ ...x, footer: { ...x.footer, legalLinks } }))} />
          <label className="flex items-center gap-2 text-sm font-body"><input type="checkbox" checked={f.showPrivateLink === "on"} onChange={(e) => set((x) => ({ ...x, footer: { ...x.footer, showPrivateLink: e.target.checked ? "on" : "off" } }))} /> Mostrar el enlace «Acceso privado»</label>
          <p className="text-xs text-[oklch(0.5_0.02_60)] font-body">«Gestionar cookies» se muestra siempre: es obligatorio para poder retirar el consentimiento.</p>
        </Card>

        <Card title="Botón de WhatsApp" hint="El globo flotante. Las notificaciones y avisos a Cristina no cambian.">
          <label className="flex items-center gap-2 text-sm font-body"><input type="checkbox" checked={g.whatsapp.enabled === "on"} onChange={(e) => set((x) => ({ ...x, whatsapp: { ...x.whatsapp, enabled: e.target.checked ? "on" : "off" } }))} /> Mostrar el botón</label>
          <Text label="Número (con prefijo, solo cifras; vacío = el actual)" value={g.whatsapp.number} onChange={(v) => set((x) => ({ ...x, whatsapp: { ...x.whatsapp, number: v } }))} placeholder="34657165343" />
          <Text label="Saludo del globo" value={g.whatsapp.tooltipTitle} onChange={(v) => set((x) => ({ ...x, whatsapp: { ...x.whatsapp, tooltipTitle: v } }))} />
          <Text label="Texto del globo" value={g.whatsapp.tooltipText} area onChange={(v) => set((x) => ({ ...x, whatsapp: { ...x.whatsapp, tooltipText: v } }))} />
        </Card>
      </div>
    </CRMLayout>
  );
}
