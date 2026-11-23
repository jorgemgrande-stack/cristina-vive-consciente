/**
 * CRM — Promoción de descarga gratuita (crear / editar). Todo en hora peninsular española (Europe/Madrid).
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Copy, Save } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PROMO_STATE_LABEL } from "./Promociones";
import PromoMetrics from "@/components/crm/PromoMetrics";
import PromoReviews from "@/components/crm/PromoReviews";
import { madridLocalToMs, msToMadridLocal, promoPath } from "@shared/promo";

type Mode = "draft" | "now" | "scheduled";

interface Form {
  name: string;
  slug: string;
  ebookId: number;
  headline: string;
  message: string;
  bannerText: string;
  mode: Mode;
  startsLocal: string;
  endsLocal: string;
  donationEnabled: boolean;
  donationConcept: string;
}

const EMPTY: Form = {
  name: "",
  slug: "",
  ebookId: 0,
  headline: "Hay regalos que\nno se envuelven.",
  message: "Quiero regalarte mi primer cuento para que puedas leerlo en familia.",
  bannerText: "Descarga gratis el primer cuento ilustrado de Cristina",
  mode: "draft",
  startsLocal: "",
  endsLocal: "",
  donationEnabled: true,
  donationConcept: "Regalo Tierra",
};

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

export default function PromoForm() {
  const params = useParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [f, setF] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const { data: ebooks = [] } = trpc.ebooksAdmin.listAdmin.useQuery();
  const { data: promo } = trpc.promosAdmin.get.useQuery({ id: id ?? 0 }, { enabled: id != null });

  useEffect(() => {
    if (!promo) return;
    setSlugTouched(true);
    setF({
      name: promo.name,
      slug: promo.slug,
      ebookId: promo.ebookId,
      headline: promo.headline,
      message: promo.message,
      bannerText: promo.bannerText,
      mode: !promo.published ? "draft" : promo.startsAt ? "scheduled" : "now",
      startsLocal: promo.startsAt ? msToMadridLocal(promo.startsAt) : "",
      endsLocal: msToMadridLocal(promo.endsAt),
      donationEnabled: promo.donationEnabled === 1,
      donationConcept: promo.donationConcept,
    });
  }, [promo]);

  useEffect(() => {
    if (!f.ebookId && ebooks.length) setF((p) => (p.ebookId ? p : { ...p, ebookId: (ebooks.find((e) => /cuatro/.test(e.slug)) ?? ebooks[0]).id }));
  }, [ebooks, f.ebookId]);

  const done = (msg: string) => {
    utils.promosAdmin.list.invalidate();
    toast.success(msg);
    navigate("/crm/ebooks/promociones");
  };
  const create = trpc.promosAdmin.create.useMutation({ onSuccess: () => done("Promoción creada"), onError: (e) => toast.error(e.message) });
  const update = trpc.promosAdmin.update.useMutation({ onSuccess: () => { utils.promosAdmin.get.invalidate(); done("Promoción guardada"); }, onError: (e) => toast.error(e.message) });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    const endsAt = madridLocalToMs(f.endsLocal);
    const startsAt = f.mode === "scheduled" ? madridLocalToMs(f.startsLocal) : null;
    if (!f.name.trim() || !f.slug || !f.ebookId) return toast.error("Falta el nombre, la URL o el ebook.");
    if (!Number.isFinite(endsAt)) return toast.error("Indica la fecha y hora de cierre.");
    if (f.mode === "scheduled" && !Number.isFinite(startsAt as number)) return toast.error("Indica la fecha y hora de inicio.");
    if (startsAt != null && endsAt <= startsAt) return toast.error("El cierre debe ser posterior al inicio.");
    const data = {
      slug: f.slug,
      name: f.name.trim(),
      ebookId: f.ebookId,
      headline: f.headline.trim(),
      message: f.message.trim(),
      bannerText: f.bannerText.trim(),
      published: f.mode !== "draft",
      startsAt,
      endsAt,
      donationEnabled: f.donationEnabled,
      donationConcept: f.donationConcept.trim() || "Regalo Tierra",
    };
    if (id != null) update.mutate({ id, data });
    else create.mutate(data);
  };

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}${promoPath(f.slug || "…")}`;
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => toast.success("Enlace copiado"), () => toast.error("No se pudo copiar"));
  const saving = create.isPending || update.isPending;

  return (
    <CRMLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Link href="/crm/ebooks/promociones" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"><ArrowLeft size={14} /> Promociones</Link>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{id ? "Editar promoción" : "Nueva promoción"}</h1>
          {promo && <span className={`text-xs px-2 py-0.5 rounded ${PROMO_STATE_LABEL[promo.state].cls}`}>{PROMO_STATE_LABEL[promo.state].label}</span>}
        </div>

        {promo && (
          <div className="bg-white rounded-lg border border-gray-100 p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Métricas de la campaña</h2>
            <PromoMetrics stats={promo.stats} />
          </div>
        )}

        {promo && <PromoReviews promoId={promo.id} />}

        <div className="bg-white rounded-lg border border-gray-100 p-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre interno</Label>
              <Input value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} placeholder="Lanzamiento Los cuatro regalos" />
            </div>
            <div>
              <Label>Ebook</Label>
              <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={f.ebookId} onChange={(e) => set("ebookId", Number(e.target.value))}>
                {ebooks.map((e) => <option key={e.id} value={e.id}>{e.title}{e.pdfUrl ? "" : " (sin PDF)"}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>URL de la página</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 whitespace-nowrap">/promocion/</span>
              <Input value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
              <Button type="button" variant="outline" size="sm" onClick={() => copy(url)} aria-label="Copiar enlace"><Copy size={13} /></Button>
            </div>
            {f.slug && (
              <p className="text-xs text-gray-500 mt-1.5">
                Enlaces para medir el origen: <button type="button" className="underline" onClick={() => copy(`${url}?utm_source=instagram`)}>Instagram</button> · <button type="button" className="underline" onClick={() => copy(`${url}?utm_source=whatsapp`)}>WhatsApp</button> · <button type="button" className="underline" onClick={() => copy(`${url}?utm_source=colaborador`)}>Colaboradores</button> (copian el enlace con su origen)
              </p>
            )}
          </div>

          <div>
            <Label>Titular (el salto de línea separa la parte en cursiva)</Label>
            <Textarea rows={2} value={f.headline} onChange={(e) => set("headline", e.target.value)} />
          </div>
          <div>
            <Label>Mensaje de Cristina</Label>
            <Textarea rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} />
          </div>
          <div>
            <Label>Aviso de la portada y de Guías digitales</Label>
            <Input value={f.bannerText} onChange={(e) => set("bannerText", e.target.value)} maxLength={200} />
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div>
              <Label>Publicación</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {([["draft", "Borrador"], ["now", "Publicar ahora"], ["scheduled", "Programar inicio"]] as [Mode, string][]).map(([m, label]) => (
                  <button key={m} type="button" onClick={() => set("mode", m)} className={`px-3 py-1.5 text-sm rounded border ${f.mode === m ? "bg-[oklch(0.52_0.08_148)] text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {f.mode === "scheduled" && (
                <div>
                  <Label>Inicio (hora peninsular)</Label>
                  <Input type="datetime-local" value={f.startsLocal} onChange={(e) => set("startsLocal", e.target.value)} />
                </div>
              )}
              <div>
                <Label>Cierre (hora peninsular)</Label>
                <Input type="datetime-local" value={f.endsLocal} onChange={(e) => set("endsLocal", e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">A esa hora exacta se bloquea la descarga gratuita, aunque alguien tenga la página abierta.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Donativo voluntario por Bizum</Label>
                <p className="text-xs text-gray-500">Solo muestra las instrucciones: quien completa el formulario descarga sin donar.</p>
              </div>
              <Switch checked={f.donationEnabled} onCheckedChange={(v) => set("donationEnabled", v)} />
            </div>
            {f.donationEnabled && (
              <div className="max-w-xs">
                <Label>Concepto inicial</Label>
                <Input value={f.donationConcept} onChange={(e) => set("donationConcept", e.target.value)} maxLength={60} />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button onClick={save} disabled={saving} className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white gap-2"><Save size={15} /> {saving ? "Guardando…" : "Guardar"}</Button>
        </div>
      </div>
    </CRMLayout>
  );
}
