/**
 * Descarga promocional: registro de quien completa el formulario, alta/clasificación en el CRM y recurso gratuito.
 *
 * Identificación (las mismas reglas que la importación de clientes, ver clientImport.ts):
 *  - se busca por email normalizado y por teléfono normalizado;
 *  - sin coincidencias → ficha nueva; una sola ficha con nombre compatible → se reutiliza (se conservan sus datos y
 *    solo se rellenan los vacíos); varias fichas, o una de nombre distinto → CONFLICTO: no se toca ninguna ficha, el
 *    registro queda «en revisión» con los candidatos para que Cristina decida (como los pedidos con varias coincidencias).
 *  - Categoría «Recursos gratuitos» (solo se añade si falta) y recurso «Descarga de promoción · <ebook>» UNA vez por
 *    cliente y promoción (clave única cliente + «promo:ID»). Sin pedido, factura ni pago.
 */
import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { clientCategories, clients, clientServices, ebookPromoRegistrations, serviceCatalog, type EbookPromo, type Ebook } from "../drizzle/schema";
import { namesCompatible, normalizeEmail, normalizePhone as normalizePhoneDigits, splitName } from "./clientImport";
import { normalizePhone } from "../shared/phone";

export interface RegistrationInput {
  name: string;
  email: string;
  phone: string;
  source: string;
}
export type Validated = { ok: true; name: string; email: string; phone: string } | { ok: false; errors: Record<string, string> };

/** Validación en el servidor: nombre y apellidos, email y teléfono (obligatorios). */
export function validateRegistration(raw: { name?: unknown; email?: unknown; phone?: unknown }): Validated {
  const errors: Record<string, string> = {};
  const name = typeof raw.name === "string" ? raw.name.trim().replace(/\s+/g, " ") : "";
  if (name.length > 200 || name.split(" ").filter((w) => w.length >= 1).length < 2 || name.length < 5) errors.name = "Escribe tu nombre y apellidos.";
  const email = normalizeEmail(typeof raw.email === "string" ? raw.email : "");
  if (!email || email.length > 320) errors.email = "Escribe un correo electrónico válido.";
  const phone = normalizePhone(typeof raw.phone === "string" ? raw.phone : "");
  if (!phone) errors.phone = "Escribe un teléfono válido (por ejemplo 600 123 456).";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, name, email: email!, phone: phone! };
}

// Las altas se serializan (un solo proceso): dos envíos simultáneos de la misma persona no crean dos fichas
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

const isDup = (e: unknown) => /duplicate|ER_DUP_ENTRY/i.test(String((e as Error)?.message ?? "") + String((e as { cause?: Error })?.cause?.message ?? ""));

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  return db;
}

/** Artículo «Descarga de promoción · <ebook>» dentro de Recursos gratuitos (se crea la primera vez). */
async function ensurePromoNode(promo: EbookPromo, ebook: Ebook): Promise<{ categoryId: number; itemId: number; name: string; pathLabel: string }> {
  const db = await requireDb();
  let [cat] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.slug, "recursos_gratuitos")).limit(1);
  if (!cat) {
    const [r] = await db.insert(serviceCatalog).values({ parentId: null, kind: "category", name: "Recursos gratuitos", slug: "recursos_gratuitos", sortOrder: 1 });
    [cat] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.id, (r as { insertId: number }).insertId)).limit(1);
  }
  const itemSlug = `promo-${promo.slug}`.slice(0, 120);
  const name = `Descarga de promoción · ${ebook.title}`.slice(0, 200);
  let [item] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.slug, itemSlug)).limit(1);
  if (!item) {
    try {
      await db.insert(serviceCatalog).values({ parentId: cat.id, kind: "item", name, slug: itemSlug, sortOrder: 50 });
    } catch (e) {
      if (!isDup(e)) throw e;
    }
    [item] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.slug, itemSlug)).limit(1);
  }
  return { categoryId: cat.id, itemId: item.id, name: item.name, pathLabel: `${cat.name} → ${item.name}` };
}

export interface RegistrationResult {
  registrationId: number;
  token: string;
  status: "linked" | "created" | "review";
  clientId: number | null;
  resourceCreated: boolean;
  categoryAdded: boolean;
}

export function registerPromoDownload(promo: EbookPromo, ebook: Ebook, input: RegistrationInput & { name: string; email: string; phone: string }): Promise<RegistrationResult> {
  return serialized(async () => {
    const db = await requireDb();
    const emailN = input.email.toLowerCase();
    const phoneDigits = normalizePhoneDigits(input.phone);

    // Candidatos por email y por teléfono (ambos normalizados)
    const byEmail = await db.select().from(clients).where(sql`lower(trim(${clients.email})) = ${emailN}`);
    const tail = phoneDigits ? phoneDigits.slice(-9) : null;
    const byPhone = tail
      ? (await db.select().from(clients).where(sql`replace(replace(replace(replace(${clients.phone}, ' ', ''), '-', ''), '+', ''), '.', '') like ${`%${tail}`}`)).filter((c) => normalizePhoneDigits(c.phone) === phoneDigits)
      : [];
    const cand = new Map<number, typeof byEmail[number]>();
    for (const c of [...byEmail, ...byPhone]) cand.set(c.id, c);
    const found = Array.from(cand.values());

    let clientId: number | null = null;
    let status: RegistrationResult["status"] = "created";
    let candidates: number[] = [];
    if (found.length === 0) {
      const { firstName, lastName } = splitName(input.name);
      const [r] = await db.insert(clients).values({ firstName, lastName, email: emailN, phone: input.phone, status: "active" });
      clientId = (r as { insertId: number }).insertId;
      status = "created";
    } else if (found.length === 1 && namesCompatible(input.name, `${found[0].firstName} ${found[0].lastName}`)) {
      const c = found[0];
      clientId = c.id;
      status = "linked";
      // Se conservan los datos de la ficha; solo se rellenan los vacíos
      const patch: Partial<typeof clients.$inferInsert> = {};
      if (!c.email?.trim()) patch.email = emailN;
      if (!c.phone?.trim()) patch.phone = input.phone;
      if (Object.keys(patch).length) await db.update(clients).set(patch).where(eq(clients.id, c.id));
    } else {
      status = "review"; // varias fichas, o una con nombre distinto: decide Cristina; no se toca ninguna
      candidates = found.map((c) => c.id);
    }

    let resourceCreated = false;
    let categoryAdded = false;
    if (clientId != null) {
      try {
        await db.insert(clientCategories).values({ clientId, category: "recursos_gratuitos" });
        categoryAdded = true;
      } catch (e) {
        if (!isDup(e)) throw e;
      }
      const node = await ensurePromoNode(promo, ebook);
      try {
        await db.insert(clientServices).values({
          clientId,
          categoryId: node.categoryId,
          groupId: null,
          itemId: node.itemId,
          pathLabel: node.pathLabel,
          name: node.name,
          amountCents: null,
          paymentStatus: "free",
          receivedAt: Date.now(),
          notes: `Origen: promoción «${promo.name}» (/promocion/${promo.slug}) · procedencia: ${input.source}`,
          source: "promo",
          sourceKey: `promo:${promo.id}`,
        });
        resourceCreated = true;
      } catch (e) {
        if (!isDup(e)) throw e; // ya figuraba: una sola vez por cliente y promoción
      }
    }

    const token = crypto.randomBytes(32).toString("hex");
    const [reg] = await db.insert(ebookPromoRegistrations).values({
      promoId: promo.id,
      clientId,
      name: input.name,
      email: emailN,
      phone: input.phone,
      source: input.source,
      status,
      candidates: candidates.length ? candidates.join(",") : null,
      token,
    });
    return { registrationId: (reg as { insertId: number }).insertId, token, status, clientId, resourceCreated, categoryAdded };
  });
}

export async function findRegistrationByToken(promoId: number, token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await requireDb();
  const [r] = await db.select().from(ebookPromoRegistrations).where(and(eq(ebookPromoRegistrations.token, token), eq(ebookPromoRegistrations.promoId, promoId))).limit(1);
  return r ?? null;
}
