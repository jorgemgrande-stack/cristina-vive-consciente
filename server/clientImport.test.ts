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
