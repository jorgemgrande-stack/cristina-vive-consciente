/**
 * Router «Editar web»: lo público solo lee la versión publicada; todo lo demás es del administrador (misma sesión que /crm).
 * Citas, carrito, cobros, pedidos, facturación, descargas, afiliados y automatizaciones NO pasan por aquí: conservan sus reglas.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  GLOBAL_KEY, LABEL_DEFS, SYSTEM_PAGES, slugProblem, systemPage, templateKeyFor,
  type GlobalContent, type PageBlock, type PageContent,
} from "../../shared/siteEditor";
import { normalizePageContent, plainText } from "../siteContent";
import {
  SiteEditorError, addRedirect, createCustomPage, deleteCustomPage, ensureDocument, getDocument, listDocuments, listRedirects, listVersions,
  publishDraft, readDraft, readPublishedGlobal, readPublishedPage, removeRedirect, renameCustomPage, renameDocumentTitle, restoreVersion, saveDraft,
  serveLegacy, stripHidden, legalVersions,
} from "../siteDb";
import { createClient, findClientByEmail, getDb } from "../db";
import { and, eq } from "drizzle-orm";
import { blogPosts, oilProducts, services, waterProducts } from "../../drizzle/schema";
import { migratedContent } from "../siteMigration";
import { mergeSeed } from "../siteSeed";
import { loadInitialDrafts } from "../siteSeedRun";
import { sendAdminLeadNotificationEmail } from "../email";
import { notifyAdminNewLead } from "../whatsapp";

/** Convierte los errores de dominio en mensajes claros para la administradora. */
async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof SiteEditorError) throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
    throw e;
  }
}

const docKeyInput = z.string().min(1).max(191);

/** ¿Es un documento que existe en el sistema (página original, plantilla, global o página nueva)? */
function isKnownKey(key: string): boolean {
  return key === GLOBAL_KEY || !!systemPage(key);
}

export const siteRouter = router({
  // ─── Público: solo lo publicado ───────────────────────────────────────────
  page: publicProcedure.input(z.object({ path: z.string().min(1).max(300) })).query(async ({ input }) => {
    const page = await readPublishedPage(input.path.split(/[?#]/)[0]);
    return page;
  }),
  global: publicProcedure.query(() => readPublishedGlobal()),
  /** Versiones publicadas de privacidad y cookies: se guardan junto al consentimiento de cookies. */
  legalVersions: publicProcedure.query(() => legalVersions()),

  /** Formulario de un bloque publicado: la configuración se lee del servidor (no se fía del cliente). */
  submitForm: publicProcedure
    .input(z.object({
      path: z.string().min(1).max(300),
      blockId: z.string().min(1).max(60),
      answers: z.record(z.string().max(100), z.string().max(3000)),
      consent: z.boolean(),
      website: z.string().max(200).optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.website) return { success: true }; // trampa para robots: se descarta sin avisar
      const page = await readPublishedPage(input.path.split(/[?#]/)[0]);
      const block = page ? findPublishedForm(page.content.blocks, input.blockId) : null;
      if (!block) throw new TRPCError({ code: "NOT_FOUND", message: "Este formulario ya no está disponible." });
      if (!input.consent) throw new TRPCError({ code: "BAD_REQUEST", message: "Debes aceptar la política de privacidad." });
      const get = (role: string) => {
        const idx = block.data.fields.findIndex((f) => f.role === role);
        return idx >= 0 ? (input.answers[String(idx)] ?? "").trim() : "";
      };
      const lines: string[] = [];
      block.data.fields.forEach((f, i) => {
        const v = (input.answers[String(i)] ?? "").trim();
        if (f.required === "on" && !v) throw new TRPCError({ code: "BAD_REQUEST", message: `Falta «${f.label}».` });
        if (v) lines.push(`${f.label}: ${v}`);
      });
      const email = get("email").toLowerCase();
      if (email && !z.string().email().safeParse(email).success) throw new TRPCError({ code: "BAD_REQUEST", message: "Revisa el correo electrónico." });
      const [firstName, ...rest] = (get("name") || "Sin nombre").split(/\s+/);
      const lastName = rest.join(" ");
      const message = lines.join("\n");
      // Solo se crea contacto en el CRM si hay correo; nunca se enrolan en secuencias de emails comerciales.
      if (email && !(await findClientByEmail(email))) {
        await createClient({ firstName, lastName, email, phone: get("phone") || null, status: "lead", notes: `Formulario «${block.data.title || "web"}» (${input.path}):\n${message}` });
      }
      const lead = { firstName, lastName, email: email || "(sin correo)", phone: get("phone") || undefined, subject: block.data.title || "Formulario de la web", message };
      sendAdminLeadNotificationEmail(lead).catch(console.error);
      notifyAdminNewLead({ firstName, lastName, phone: lead.phone, email: lead.email, message, interest: lead.subject }).catch(console.error);
      return { success: true };
    }),

  // ─── Administración ───────────────────────────────────────────────────────
  documents: adminProcedure.query(() => run(listDocuments)),
  labelDefs: adminProcedure.query(() => LABEL_DEFS),

  /** Borrador de un documento (con el estado de publicación). */
  draft: adminProcedure.input(z.object({ docKey: docKeyInput })).query(({ input }) =>
    run(async () => {
      const { doc, content } = await readDraft(input.docKey);
      return { docKey: doc.docKey, title: doc.title, kind: doc.kind, servedFrom: doc.servedFrom, published: !!doc.publishedVersionId, publishedAt: doc.publishedAt, draftUpdatedAt: doc.draftUpdatedAt, content };
    })),

  /** Vista previa privada: el borrador de la ruta pedida (solo administradora). */
  preview: adminProcedure.input(z.object({ path: z.string().min(1).max(300) })).query(({ input }) =>
    run(async () => {
      const path = input.path.split(/[?#]/)[0];
      const key = (await getDocument(path)) || isKnownKey(path) ? path : templateKeyFor(path) ?? path;
      const doc = await getDocument(key);
      if (!doc && !isKnownKey(key)) return null;
      const { content } = await readDraft(key);
      return { docKey: key, title: doc?.title ?? "", content: content as PageContent };
    })),
  previewGlobal: adminProcedure.query(() => run(async () => ((await readDraft(GLOBAL_KEY)).content as GlobalContent).global)),

  save: adminProcedure
    .input(z.object({ docKey: docKeyInput, content: z.unknown() }))
    .mutation(({ input, ctx }) => run(async () => {
      const r = await saveDraft(input.docKey, input.content, ctx.user.id);
      return { savedAt: r.savedAt, content: r.content };
    })),

  publish: adminProcedure
    .input(z.object({ docKey: docKeyInput, note: z.string().max(200).optional() }))
    .mutation(({ input, ctx }) => run(() => publishDraft(input.docKey, ctx.user.id, input.note))),

  /** Vuelve a servir la página original en código (el borrador y el historial se conservan). */
  serveLegacy: adminProcedure.input(z.object({ docKey: docKeyInput })).mutation(({ input }) => run(() => serveLegacy(input.docKey))),

  versions: adminProcedure.input(z.object({ docKey: docKeyInput })).query(({ input }) => run(() => listVersions(input.docKey))),
  restore: adminProcedure
    .input(z.object({ docKey: docKeyInput, versionId: z.number().int(), publish: z.boolean().default(true) }))
    .mutation(({ input, ctx }) => run(() => restoreVersion(input.docKey, input.versionId, ctx.user.id, input.publish))),

  createPage: adminProcedure
    .input(z.object({ title: z.string().min(1).max(200), slug: z.string().max(80) }))
    .mutation(({ input, ctx }) => run(() => createCustomPage(input.title, input.slug, ctx.user.id))),
  renamePage: adminProcedure
    .input(z.object({ docKey: docKeyInput, slug: z.string().max(80) }))
    .mutation(({ input }) => run(() => renameCustomPage(input.docKey, input.slug))),
  setTitle: adminProcedure
    .input(z.object({ docKey: docKeyInput, title: z.string().min(1).max(200) }))
    .mutation(({ input }) => run(() => renameDocumentTitle(input.docKey, input.title))),
  deletePage: adminProcedure.input(z.object({ docKey: docKeyInput })).mutation(({ input }) => run(() => deleteCustomPage(input.docKey))),
  slugCheck: adminProcedure.input(z.object({ slug: z.string().max(80) })).query(async ({ input }) => {
    const problem = slugProblem(input.slug);
    if (problem) return { ok: false as const, problem };
    if (await getDocument(`/${input.slug}`)) return { ok: false as const, problem: "Ya existe una página con esa dirección." };
    return { ok: true as const };
  }),

  redirects: adminProcedure.query(() => run(listRedirects)),
  addRedirect: adminProcedure.input(z.object({ from: z.string().min(1).max(300), to: z.string().min(1).max(500) })).mutation(({ input }) => run(() => addRedirect(input.from, input.to))),
  removeRedirect: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => run(() => removeRedirect(input.id))),

  /** Resumen de texto de un borrador (para comprobar migraciones). */
  summary: adminProcedure.input(z.object({ docKey: docKeyInput })).query(({ input }) =>
    run(async () => {
      const doc = await ensureDocument(input.docKey);
      const content = normalizePageContent(JSON.parse(doc.draftJson));
      return { blocks: content.blocks.length, text: plainText(content.blocks).slice(0, 2000) };
    })),
  systemPages: adminProcedure.query(() => SYSTEM_PAGES),

  /** Ruta real para previsualizar una plantilla de ficha (la primera ficha publicada de su tipo). */
  sampleRoute: adminProcedure.input(z.object({ docKey: docKeyInput })).query(async ({ input }) => {
    if (!input.docKey.startsWith("tpl:")) return input.docKey === GLOBAL_KEY ? "/" : input.docKey;
    const d = await getDb();
    const base = input.docKey.replace("tpl:", "").replace("/:slug", "");
    let slug: string | undefined;
    if (d) {
      if (base === "/consultas" || base === "/masajes") {
        const type = base === "/consultas" ? "consulta" : "masaje";
        [{ slug }] = [...(await d.select({ slug: services.slug }).from(services).where(and(eq(services.type, type), eq(services.status, "active"), eq(services.visibleEnPublico, 1))).limit(1)), { slug: undefined }];
      } else if (base === "/sistemas-agua") [{ slug }] = [...(await d.select({ slug: waterProducts.slug }).from(waterProducts).where(eq(waterProducts.status, "active")).limit(1)), { slug: undefined }];
      else if (base === "/aceites-esenciales") [{ slug }] = [...(await d.select({ slug: oilProducts.slug }).from(oilProducts).where(and(eq(oilProducts.status, "active"), eq(oilProducts.visibleEnPublico, 1))).limit(1)), { slug: undefined }];
      else if (base === "/blog") [{ slug }] = [...(await d.select({ slug: blogPosts.slug }).from(blogPosts).where(eq(blogPosts.status, "published")).limit(1)), { slug: undefined }];
    }
    return slug ? `${base}/${slug}` : base;
  }),

  /** Completa el borrador de una página original con la web actual SIN perder lo que ya has editado. No publica nada. */
  migrate: adminProcedure
    .input(z.object({ docKey: docKeyInput }))
    .mutation(({ input, ctx }) => run(async () => {
      const migrated = migratedContent(input.docKey);
      if (!migrated) throw new SiteEditorError("Esa página no se puede preparar automáticamente.");
      const { content: current } = await readDraft(input.docKey);
      const { content, report } = mergeSeed(current as PageContent, migrated);
      if (report.action !== "unchanged") await saveDraft(input.docKey, content, ctx.user.id);
      return { created: report.action !== "unchanged", report };
    })),

  /** Carga (o completa) los borradores de todas las páginas, plantillas y ajustes con la web actual. No publica nada. */
  loadAll: adminProcedure.mutation(() => run(() => loadInitialDrafts())),
});

function findPublishedForm(blocks: PageBlock[], id: string): Extract<PageBlock, { type: "form" }> | null {
  for (const b of stripHidden(blocks)) {
    if (b.type === "form" && b.id === id) return b;
    if (b.type === "section") for (const c of b.data.columns) { const f = findPublishedForm(c.blocks, id); if (f) return f; }
  }
  return null;
}
