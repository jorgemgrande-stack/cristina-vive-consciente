/** Paso del bloque de pedidos a las condiciones nuevas, desde cualquier estado en que haya quedado el borrador. */
import { describe, expect, it } from "vitest";
import { ACEITES_CONTACT, aceitesBlocks } from "../shared/aceitesPage";
import { PREVIOUS_ORDERS, migrateOrdersBlock } from "../shared/oilOrdersMigration";
import { createBlock } from "../shared/siteEditor";
import { normalizePageContent } from "./siteContent";

const NEXT = (aceitesBlocks().find((b) => b.id === "ac-pedidos") as any).data;
const OLD_URL = "https://wa.me/34657165343?text=viejo";
/** El borrador tal como lo dejó la versión anterior. */
const oldDraft = () => ({
  ...PREVIOUS_ORDERS,
  groupMin: "25 €", groupNote: "Gastos de envío no incluidos.", groupOpen: "off", groupDeadline: "",
  groupOpenLabel: "Solicitar pedido conjunto", groupOpenUrl: OLD_URL, groupClosedLabel: "Consultar el próximo pedido", groupClosedUrl: ACEITES_CONTACT.next,
  soloMin: "100 €", soloNote: "Gastos de envío no incluidos.", soloUrl: ACEITES_CONTACT.individual,
});
/** Lo que queda si alguien guarda ese borrador con el editor nuevo: sin groupMin y con los campos nuevos vacíos. */
const savedWithNewCode = (data: Record<string, unknown>) => {
  const block = { ...createBlock("oil_orders"), id: "ac-pedidos", data };
  return normalizePageContent({ v: 1, blocks: [block] }).blocks[0].data as unknown as Record<string, unknown>;
};

describe("bloque de pedidos", () => {
  it("desde el borrador antiguo queda como el nuevo", () => {
    const r = migrateOrdersBlock(oldDraft(), NEXT);
    expect(r).toMatchObject({ changed: true, kept: [] });
    expect(r.data).toEqual(NEXT);
  });
  it("guardado con el código nuevo (sin groupMin) también se actualiza", () => {
    const saved = savedWithNewCode(oldDraft());
    expect(saved).not.toHaveProperty("groupMin");
    expect([saved.groupPoints, saved.soloPoints, saved.groupUrl]).toEqual(["", "", ""]);
    expect(saved.conditions).toBe(PREVIOUS_ORDERS.conditions);
    const r = migrateOrdersBlock(saved, NEXT);
    expect(r).toMatchObject({ changed: true, kept: [] });
    expect(r.data).toEqual(NEXT);
  });
  it("una segunda pasada conserva el resultado, también después de guardarlo en el editor", () => {
    for (const start of [oldDraft(), savedWithNewCode(oldDraft())]) {
      const first = migrateOrdersBlock(start, NEXT).data;
      expect(migrateOrdersBlock(first, NEXT)).toEqual({ data: first, changed: false, kept: [] });
      expect(migrateOrdersBlock(savedWithNewCode(first), NEXT).changed).toBe(false);
    }
  });
  it("respeta lo que Cristina haya editado, antes y después", () => {
    const edited = savedWithNewCode({ ...oldDraft(), soloText: "Texto de Cristina", closing: "Cierre de Cristina" });
    const r = migrateOrdersBlock(edited, NEXT);
    expect(r.data).toMatchObject({ soloText: "Texto de Cristina", closing: "Cierre de Cristina", groupPoints: NEXT.groupPoints, conditions: "" });
    expect(r.kept.sort()).toEqual(["closing", "soloText"]);
    const later = { ...r.data, groupPoints: "Solo una condición", conditions: "Una condición suya" };
    expect(migrateOrdersBlock(later, NEXT)).toEqual({ data: later, changed: false, kept: [] });
    expect(migrateOrdersBlock({ ...oldDraft(), groupClosedUrl: "/contacto" }, NEXT).data.groupUrl).toBe("/contacto");
  });
});
