/** Unificar fichas duplicadas contra MySQL de pruebas (SITE_TEST_DATABASE_URL). */
import { describe, expect, it } from "vitest";

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("Unificar fichas duplicadas", () => {
  it("traslada historial, notas y categorías, retira la duplicada; se detiene con vínculos o datos contradictorios", async () => {
    process.env.DATABASE_URL = URL;
    const mc = await import("./mergeClients");
    const dbm = await import("./db");
    const s = await import("../drizzle/schema");
    const { eq, inArray, like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `mg${Date.now()}`;
    const ids: number[] = [];
    const mk = async (v: Partial<typeof s.clients.$inferInsert>) => {
      const [r] = (await conn.insert(s.clients).values({ firstName: "Marta", lastName: tag, email: `m.${tag}@mail.test`, ...v })) as any;
      ids.push(r.insertId);
      return r.insertId as number;
    };
    const count = async (table: any, col: any, id: number) => (await conn.select().from(table).where(eq(col, id))).length;
    try {
      // ── Caso correcto: la que se conserva tiene teléfono y dirección; la duplicada, el historial ──
      const keep = await mk({ firstName: "Marta ", email: `M.${tag}@Mail.test`, phone: "600111222", address: "Calle Real 1" });
      const dup = await mk({ phone: null });
      await conn.insert(s.clientPriorItems).values({ clientId: dup, content: "Guia del agua 10-11-26", source: "Importada de CLIENTAS-ES", sourceKey: "CLIENTAS-ES:F77" });
      await conn.insert(s.clientNotes).values({ clientId: dup, type: "general", content: "Nota de la duplicada", source: "x", sourceKey: "CLIENTAS-ES:E77" });
      await conn.insert(s.clientCategories).values([{ clientId: dup, category: "recursos_gratuitos" }, { clientId: dup, category: "guias" }]);
      await conn.insert(s.clientCategories).values({ clientId: keep, category: "recursos_gratuitos" });

      const a = await mc.analyzeMerge(keep, dup);
      expect(a.ok).toBe(true);
      expect(a.conflicts).toEqual([]); // email y nombre se comparan sin mayúsculas ni espacios de más
      expect(a.move.categories).toEqual(["guias"]);

      let snapshot: any;
      const res = await mc.applyMerge(keep, dup, (snap) => (snapshot = snap));
      expect(res).toEqual({ moved: { priorItems: 1, notes: 1, categories: 1 }, removedClient: dup });
      expect(snapshot.client.id).toBe(dup);
      // teléfono y dirección de la que se conserva, intactos
      const [k] = await conn.select().from(s.clients).where(eq(s.clients.id, keep));
      expect(k).toMatchObject({ phone: "600111222", address: "Calle Real 1" });
      // el historial consta UNA vez, con su referencia a la fila 77
      const prior = await conn.select().from(s.clientPriorItems).where(eq(s.clientPriorItems.clientId, keep));
      expect(prior).toHaveLength(1);
      expect(prior[0]).toMatchObject({ sourceKey: "CLIENTAS-ES:F77", content: "Guia del agua 10-11-26" });
      expect(await count(s.clientNotes, s.clientNotes.clientId, keep)).toBe(1);
      expect((await conn.select().from(s.clientCategories).where(eq(s.clientCategories.clientId, keep))).map((c) => c.category).sort()).toEqual(["guias", "recursos_gratuitos"]);
      // la duplicada ya no existe ni deja filas sueltas
      expect(await count(s.clients, s.clients.id, dup)).toBe(0);
      expect(await count(s.clientPriorItems, s.clientPriorItems.clientId, dup)).toBe(0);
      expect(await count(s.clientCategories, s.clientCategories.clientId, dup)).toBe(0);

      // ── Se detiene: la duplicada tiene una cita ──
      const k2 = await mk({});
      const d2 = await mk({});
      await conn.insert(s.appointments).values({ clientId: d2, serviceType: "masaje", scheduledAt: Date.now() + 1e9, status: "pending" });
      const a2 = await mc.analyzeMerge(k2, d2);
      expect(a2.ok).toBe(false);
      expect(a2.unexpectedRefs).toEqual({ appointments: 1 });
      await expect(mc.applyMerge(k2, d2)).rejects.toThrow(/appointments/);
      expect(await count(s.clients, s.clients.id, d2)).toBe(1); // no se retiró

      // ── Se detiene: teléfonos distintos ──
      const k3 = await mk({ phone: "600000001" });
      const d3 = await mk({ phone: "699999999" });
      const a3 = await mc.analyzeMerge(k3, d3);
      expect(a3.ok).toBe(false);
      expect(a3.conflicts.map((c) => c.field)).toEqual(["phone"]);
      await expect(mc.applyMerge(k3, d3)).rejects.toThrow(/contradictorios/);
      expect(await count(s.clients, s.clients.id, d3)).toBe(1);

      // ── Historial repetido (misma clave) no se duplica ──
      const k4 = await mk({});
      const d4 = await mk({});
      for (const c of [k4, d4]) await conn.insert(s.clientPriorItems).values({ clientId: c, content: "Guia", source: "S", sourceKey: "CLIENTAS-ES:F1" });
      await mc.applyMerge(k4, d4);
      expect(await count(s.clientPriorItems, s.clientPriorItems.clientId, k4)).toBe(1);
    } finally {
      await conn.delete(s.appointments).where(inArray(s.appointments.clientId, ids));
      await conn.delete(s.clientPriorItems).where(inArray(s.clientPriorItems.clientId, ids));
      await conn.delete(s.clientNotes).where(inArray(s.clientNotes.clientId, ids));
      await conn.delete(s.clientCategories).where(inArray(s.clientCategories.clientId, ids));
      await conn.delete(s.clients).where(like(s.clients.lastName, tag));
    }
  }, 60_000);
});
