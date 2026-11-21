/**
 * Importación de clientas y categorías: reglas de cruce (puras) y, con SITE_TEST_DATABASE_URL,
 * escritura repetible y filtro por categoría contra MySQL de pruebas.
 */
import { describe, expect, it } from "vitest";
import { namesCompatible, normalizeEmail, normalizePhone, planImport, splitName, type ExistingClient, type ImportFile, type SourceRecord } from "./clientImport";

const rec = (o: Partial<SourceRecord> & { sourceRow: number; fullName: string }): SourceRecord => ({
  email: null, phone: null, address: null, servicesAndPurchases: null, categories: [], note: null, reviewFlags: [], ...o,
});
const file = (records: SourceRecord[], rules: Partial<ImportFile["rules"]> = {}): ImportFile => ({
  source: { filename: "x.xlsx", sheet: "Hoja 1" },
  rules: { addToAllPreexistingClients: [], fallbackForImportedClientsWithoutHistory: ["recursos_gratuitos"], sourceDuplicateGroups: [], possibleDuplicateGroupsToReview: [], ...rules },
  records,
});
const client = (o: Partial<ExistingClient> & { id: number }): ExistingClient => ({
  firstName: "Ana", lastName: "García", email: null, phone: null, address: null, categories: ["recursos_gratuitos"], noteKeys: [], priorKeys: [], ...o,
});

describe("normalización", () => {
  it("emails: minúsculas y rechaza los no válidos (tildes, sin dominio)", () => {
    expect(normalizeEmail(" Ana@Gmail.COM ")).toBe("ana@gmail.com");
    expect(normalizeEmail("María@gmail.com")).toBeNull();
    expect(normalizeEmail("sin-arroba")).toBeNull();
  });
  it("teléfonos: quita prefijo de España y símbolos", () => {
    expect(normalizePhone("+34 651 645 228")).toBe("651645228");
    expect(normalizePhone("0034651645228")).toBe("651645228");
    expect(normalizePhone("123")).toBeNull();
  });
  it("nombres: separa nombre y apellidos y compara sin tildes", () => {
    expect(splitName("Rubén Sanz Martín")).toEqual({ firstName: "Rubén", lastName: "Sanz Martín" });
    expect(splitName("Maria Jose Palacios")).toEqual({ firstName: "Maria Jose", lastName: "Palacios" });
    expect(splitName("Trompiz")).toEqual({ firstName: "Trompiz", lastName: "" });
    expect(namesCompatible("Rocío Natividad Carmona", "Rocio Natividad")).toBe(true);
    expect(namesCompatible("Eugenia", "Marta Gómez")).toBe(false);
  });
});

describe("cruce en seco", () => {
  it("alta cuando no coincide, con Recursos gratuitos si no trae categoría", () => {
    const [p] = planImport(file([rec({ sourceRow: 2, fullName: "Nueva Persona", email: "nueva@x.es" })]), []);
    expect(p).toMatchObject({ action: "create", categories: ["recursos_gratuitos"] });
  });

  it("coincide por email y por teléfono y solo añade lo que falta", () => {
    const plan = planImport(
      file([
        rec({ sourceRow: 3, fullName: "Ana García", email: "ANA@x.es", categories: ["productos", "recursos_gratuitos"], note: { sourceCell: "E3", type: "general", content: "n", commercialExtract: false } }),
        rec({ sourceRow: 4, fullName: "Luis Pérez", phone: "+34 600 111 222", categories: ["guias"] }),
      ]),
      [client({ id: 1, email: "ana@x.es" }), client({ id: 2, firstName: "Luis", lastName: "Pérez", phone: "600111222" })],
    );
    expect(plan[0]).toMatchObject({ action: "update", clientId: 1, matchedBy: "email", add: { categories: ["productos"], notes: ["CLIENTAS-ES:E3"] } });
    expect(plan[1]).toMatchObject({ action: "update", clientId: 2, matchedBy: "teléfono", add: { categories: ["guias"] } });
  });

  it("no sobrescribe datos: conserva el teléfono distinto y solo rellena huecos", () => {
    const [p] = planImport(
      file([rec({ sourceRow: 5, fullName: "Ana García", email: "ana@x.es", phone: "699000111", address: "Calle Nueva 1" })]),
      [client({ id: 1, email: "ana@x.es", phone: "611222333", address: "Calle Vieja 2" })],
    );
    expect(p.action).toBe("update");
    if (p.action === "update") {
      expect(p.add.fields).toEqual([]);
      expect(p.warnings.join(" ")).toMatch(/teléfono/);
    }
  });

  it("consolida el duplicado declarado en una sola persona", () => {
    const plan = planImport(
      file(
        [
          rec({ sourceRow: 15, fullName: "Rocio N", email: "r@x.es", phone: "654991519", categories: ["productos"], servicesAndPurchases: "Aceite" }),
          rec({ sourceRow: 27, fullName: "Rocio N", email: "r@x.es" }),
        ],
        { sourceDuplicateGroups: [[15, 27]] },
      ),
      [],
    );
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ action: "create", rows: [15, 27], categories: ["productos"] });
  });

  it("deja aparte lo dudoso: identidad repetida, nombre distinto, varias fichas, sin contacto", () => {
    const plan = planImport(
      file(
        [
          rec({ sourceRow: 30, fullName: "Claire H", email: "c@x.es" }),
          rec({ sourceRow: 74, fullName: "Claire H", phone: "660342440" }),
          rec({ sourceRow: 78, fullName: "Eugenia", email: "otra@x.es" }),
          rec({ sourceRow: 79, fullName: "Vanessa" }),
          rec({ sourceRow: 80, fullName: "Ana García", email: "ana@x.es", phone: "600000000" }),
        ],
        { possibleDuplicateGroupsToReview: [[30, 74]] },
      ),
      [client({ id: 7, firstName: "Marta", lastName: "Gómez", email: "otra@x.es" }), client({ id: 8, email: "ana@x.es" }), client({ id: 9, phone: "600000000" })],
    );
    const reasons = plan.map((p) => (p.action === "pending" ? p.reason : ""));
    expect(plan.map((p) => p.action)).toEqual(["pending", "pending", "pending", "pending", "pending"]);
    expect(reasons[0]).toMatch(/repetida/);
    expect(reasons[2]).toMatch(/nombre distinto/);
    expect(reasons[3]).toMatch(/Sin email ni teléfono/);
    expect(reasons[4]).toMatch(/más de una ficha/);
  });
});

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("Importación y categorías con base de datos", () => {
  it("repetir la importación no duplica nada y el filtro devuelve una sola vez a quien tiene varias categorías", async () => {
    process.env.DATABASE_URL = URL;
    const db = await import("./db");
    const imp = await import("./clientImport");
    const { clients, clientCategories, clientNotes, clientPriorItems } = await import("../drizzle/schema");
    const { inArray, like } = await import("drizzle-orm");
    const conn = (await db.getDb())!;
    const tag = `t${Date.now()}`;
    const cleanup = async () => {
      const ids = (await conn.select({ id: clients.id }).from(clients).where(like(clients.email, `%@${tag}.test`))).map((r) => r.id);
      if (ids.length) {
        await conn.delete(clientCategories).where(inArray(clientCategories.clientId, ids));
        await conn.delete(clientNotes).where(inArray(clientNotes.clientId, ids));
        await conn.delete(clientPriorItems).where(inArray(clientPriorItems.clientId, ids));
        await conn.delete(clients).where(inArray(clients.id, ids));
      }
    };
    await cleanup();
    try {
      const [{ insertId }] = (await conn.insert(clients).values({ firstName: "Existente", lastName: "Prueba", email: `ex@${tag}.test` })) as any;
      await conn.insert(clientCategories).values({ clientId: insertId, category: "recursos_gratuitos" });
      const data = file([
        rec({ sourceRow: 1, fullName: "Existente Prueba", email: `EX@${tag}.test`, categories: ["productos", "acompanamiento"], note: { sourceCell: "E1", type: "general", content: "Pack arcilla", commercialExtract: false }, servicesAndPurchases: "Aceite Onguard" }),
        rec({ sourceRow: 2, fullName: "Persona Nueva", email: `nueva@${tag}.test`, categories: ["guias"] }),
      ]);
      const run = async () => imp.applyPlan(imp.planImport(data, await imp.loadExisting()));
      const first = await run();
      expect(first).toMatchObject({ created: 1, updated: 1, notesAdded: 1, priorAdded: 1, categoriesAdded: 3 });
      const second = await run();
      expect(second).toMatchObject({ created: 0, updated: 0, unchanged: 2, notesAdded: 0, priorAdded: 0, categoriesAdded: 0 });

      const mine = (rows: { email: string | null }[]) => rows.filter((r) => r.email?.endsWith(`@${tag}.test`));
      expect(mine(await db.getClients(undefined, undefined, "productos"))).toHaveLength(1);
      expect(mine(await db.getClients(undefined, undefined, "acompanamiento"))).toHaveLength(1);
      expect(mine(await db.getClients(undefined, undefined, "guias"))).toHaveLength(1);
      // «Todos»: cada persona una sola vez aunque tenga tres categorías
      const all = mine(await db.getClients(undefined, undefined, "all"));
      expect(all).toHaveLength(2);
      // combinable con búsqueda y estado
      expect(mine(await db.getClients("Existente", "active", "productos"))).toHaveLength(1);
      expect(mine(await db.getClients("Existente", "active", "guias"))).toHaveLength(0);
      expect(mine(await db.getClients("Existente", "inactive", "productos"))).toHaveLength(0);
      // edición desde la ficha
      const ex = all.find((c: any) => c.firstName === "Existente") as any;
      await db.setClientCategoryList(ex.id, ["masajes_y_sanacion", "inventada"]);
      expect(await db.getClientCategoryList(ex.id)).toEqual(["masajes_y_sanacion"]);
    } finally {
      await cleanup();
    }
  });
});

describe("filas resueltas a mano", () => {
  it("una fila con nota «resuelta» en una ficha no se importa ni queda pendiente", () => {
    const plan = planImport(
      file([rec({ sourceRow: 79, fullName: "Vanessa", servicesAndPurchases: "Guia del agua-12 € 11-11-26", categories: ["guias"] })]),
      [client({ id: 129, firstName: "Vanessa", lastName: "Porras", email: "v@x.es", noteKeys: ["CLIENTAS-ES:F79-resuelta"] })],
    );
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ action: "resolved", clientId: 129, rows: [79] });
  });
  it("sin la nota, la fila sin contacto sigue pendiente", () => {
    const [p] = planImport(file([rec({ sourceRow: 79, fullName: "Vanessa" })]), [client({ id: 129, noteKeys: [] })]);
    expect(p.action).toBe("pending");
  });
});

const URL2 = process.env.SITE_TEST_DATABASE_URL;
describe.runIf(!!URL2 && /(_test|test_)/.test(URL2 ?? ""))("markRowResolved con base de datos", () => {
  it("deja constancia una sola vez, sin importar la fila, y exige pedido pagado, vinculado y con un único registro", async () => {
    process.env.DATABASE_URL = URL2;
    const imp = await import("./clientImport");
    const dbm = await import("./db");
    const { clients, orders, clientServices, clientNotes, clientPriorItems } = await import("../drizzle/schema");
    const { eq, like, inArray } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `res${Date.now()}`;
    const ids: number[] = [];
    try {
      const [c] = (await conn.insert(clients).values({ firstName: "Vanessa", lastName: tag, email: `v.${tag}@mail.test` })) as any;
      ids.push(c.insertId);
      const ref = `GUIA-${tag.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, "X").padEnd(6, "X")}`;
      const [o] = (await conn.insert(orders).values({ reference: ref, productType: "ebook", productSlug: tag, productTitle: "Guía", amountCents: 1200, customerName: "V", customerEmail: `v.${tag}@mail.test`, status: "paid", paidAt: Date.now(), clientId: null })) as any;
      // sin vínculo → rechaza
      await expect(imp.markRowResolved(79, c.insertId, ref, "Guia")).rejects.toThrow(/no está vinculado/);
      await conn.update(orders).set({ clientId: c.insertId }).where(eq(orders.id, o.insertId));
      // sin registro en Servicios → rechaza
      await expect(imp.markRowResolved(79, c.insertId, ref, "Guia")).rejects.toThrow(/exactamente 1 registro/);
      await conn.insert(clientServices).values({ clientId: c.insertId, pathLabel: "P → E → G", name: "G", amountCents: 1200, paymentStatus: "paid", receivedAt: Date.now(), source: "order", orderId: o.insertId, sourceKey: `order:${o.insertId}` });
      expect(await imp.markRowResolved(79, c.insertId, ref, "Guia del agua-12 € 11-11-26")).toEqual({ created: true });
      expect(await imp.markRowResolved(79, c.insertId, ref, "Guia del agua-12 € 11-11-26")).toEqual({ created: false });
      const notes = await conn.select().from(clientNotes).where(eq(clientNotes.clientId, c.insertId));
      expect(notes).toHaveLength(1);
      expect(notes[0].content).toContain(ref);
      expect(notes[0].sourceKey).toBe("CLIENTAS-ES:F79-resuelta");
      // no crea historial ni otro registro de compra
      expect(await conn.select().from(clientPriorItems).where(eq(clientPriorItems.clientId, c.insertId))).toHaveLength(0);
      expect(await conn.select().from(clientServices).where(eq(clientServices.clientId, c.insertId))).toHaveLength(1);
      // el cruce posterior la ve como resuelta
      const plan = imp.planImport(file([rec({ sourceRow: 79, fullName: "Vanessa" })]), await imp.loadExisting());
      expect(plan[0]).toMatchObject({ action: "resolved", clientId: c.insertId });
    } finally {
      if (ids.length) {
        await conn.delete(clientNotes).where(inArray(clientNotes.clientId, ids));
        await conn.delete(clientServices).where(inArray(clientServices.clientId, ids));
        await conn.delete(clients).where(inArray(clients.id, ids));
      }
      await conn.delete(orders).where(like(orders.customerEmail, `%${tag}%`));
    }
  }, 60_000);
});

describe("fila resuelta dentro de un grupo de filas de la misma persona", () => {
  const grupo = { sourceDuplicateGroups: [[10, 11]] };
  const filas = () => [
    rec({ sourceRow: 10, fullName: "Rocío N", email: "r@x.es", servicesAndPurchases: "Guia del agua 12 €", categories: ["guias"] }),
    rec({ sourceRow: 11, fullName: "Rocío N", email: "r@x.es", categories: ["productos"], note: { sourceCell: "E11", type: "general", content: "Aceite Onguard 5ml", commercialExtract: false } }),
  ];

  it("excluye solo la fila marcada: la otra conserva su nota y su categoría en el plan", () => {
    const plan = planImport(file(filas(), grupo), [
      client({ id: 50, firstName: "Rocío", lastName: "N", email: "r@x.es", noteKeys: ["CLIENTAS-ES:F10-resuelta"] }),
    ]);
    const resuelta = plan.find((p) => p.rows.includes(10))!;
    const otra = plan.find((p) => p.rows.includes(11))!;
    expect(resuelta).toMatchObject({ action: "resolved", clientId: 50, rows: [10] });
    // la fila 11 no queda arrastrada por la resuelta: se concilia con la ficha y añade su nota y su categoría
    expect(otra).toMatchObject({ action: "update", clientId: 50, rows: [11] });
    if (otra.action === "update") {
      expect(otra.add.notes).toEqual(["CLIENTAS-ES:E11"]);
      expect(otra.add.categories).toEqual(["productos"]);
      expect(otra.prior).toEqual([]); // el historial de la fila 10 (resuelta) NO se importa
    }
    // lo que se aplicaría: nada de la fila 10 (los ítems «resolved» los salta applyPlan)
    const aplicable = plan.filter((p) => p.action !== "resolved" && p.action !== "pending");
    expect(aplicable.flatMap((p) => p.prior.map((h) => h.key))).not.toContain("CLIENTAS-ES:F10");
    expect(aplicable.flatMap((p) => p.notes.map((n) => n.key))).toEqual(["CLIENTAS-ES:E11"]);
  });

  it("al revés: resuelta la fila 11, la 10 sigue su flujo con su historial", () => {
    const plan = planImport(file(filas(), grupo), [
      client({ id: 50, firstName: "Rocío", lastName: "N", email: "r@x.es", noteKeys: ["CLIENTAS-ES:F11-resuelta"] }),
    ]);
    const diez = plan.find((p) => p.rows.includes(10))!;
    expect(diez).toMatchObject({ action: "update", rows: [10] });
    expect(diez.prior.map((h) => h.key)).toEqual(["CLIENTAS-ES:F10"]);
    expect(plan.find((p) => p.rows.includes(11))).toMatchObject({ action: "resolved" });
  });

  it("sin ninguna marca, el grupo sigue consolidándose en una sola persona", () => {
    const plan = planImport(file(filas(), grupo), []);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ action: "create", rows: [10, 11] });
  });

  it("si la fila que queda no tiene contacto propio, queda pendiente (no se pierde ni se importa a ciegas)", () => {
    const plan = planImport(
      file([rec({ sourceRow: 10, fullName: "A", email: "a@x.es" }), rec({ sourceRow: 11, fullName: "A", note: { sourceCell: "E11", type: "general", content: "n", commercialExtract: false } })], grupo),
      [client({ id: 50, noteKeys: ["CLIENTAS-ES:F10-resuelta"] })],
    );
    expect(plan.find((p) => p.rows.includes(11))).toMatchObject({ action: "pending" });
  });
});
