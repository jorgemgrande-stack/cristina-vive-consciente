/** Sección de Aceites Esenciales: contenido de serie, destinos, estados del pedido conjunto y filtros del catálogo. */
import { describe, expect, it } from "vitest";
import { ACEITES_CONTACT, aceitesBlocks, aceitesContent } from "../shared/aceitesPage";
import { groupOrderState, cleanDate, formatDeadline } from "../shared/oilOrders";
import { OIL_FILTERS, filterOils } from "../shared/oilCatalog";
import { normalizePageContent } from "./siteContent";
import type { BlockOf } from "../shared/siteEditor";

const block = <T extends string>(id: string) => aceitesBlocks().find((b) => b.id === id)!.data as any;

describe("contenido de serie", () => {
  it("el editor lo guarda sin perder nada (guardar dos veces da lo mismo)", () => {
    const saved = normalizePageContent(aceitesContent());
    expect(saved.blocks.map((b) => b.type)).toEqual(["hero", "features", "connected", "oil_orders", "service_offer", "resources"]);
    expect(saved.blocks).toEqual(aceitesBlocks());
    expect(normalizePageContent(saved)).toEqual(saved);
  });
  it("cada botón de la cabecera y de las tarjetas apunta a un bloque que existe", () => {
    const anchors = new Set(aceitesBlocks().map((b) => b.style?.anchor).filter(Boolean));
    const hero = block("hero");
    const targets = [hero.buttonUrl, hero.secondaryUrl, ...block("ac-servicios").items.map((i: any) => i.buttonUrl), block("catalogo").secondaryUrl];
    expect(targets).toEqual(["#servicios", "#catalogo", "#catalogo", "#pedidos", "#asesoramiento", "#guias", "#pedidos"]);
    for (const t of targets) expect(anchors.has(t.slice(1)), t).toBe(true);
  });
  it("importes, precio, canal oficial y reserva pendiente", () => {
    const o = block("ac-pedidos");
    expect([o.groupMin, o.soloMin, o.groupOpen, o.groupDeadline]).toEqual(["25 €", "100 €", "off", ""]);
    expect(block("ac-guias").items[0].ebookSlug).toBe("aceites");
    expect(block("ac-asesoramiento")).toMatchObject({ priceLabel: "Precio del servicio: 90 €", buttonLabel: "Solicitar asesoramiento", buttonUrl: ACEITES_CONTACT.advice });
    expect(JSON.stringify(block("ac-asesoramiento"))).not.toMatch(/14,90|120 €/);
    for (const url of Object.values(ACEITES_CONTACT)) expect(url).toMatch(/^https:\/\/wa\.me\/34657165343\?text=/);
    expect(new Set(Object.values(ACEITES_CONTACT)).size).toBe(4);
    expect(JSON.stringify(aceitesContent()).toLowerCase()).not.toContain("terapéutica");
    expect(JSON.stringify(aceitesContent()).toLowerCase()).not.toContain("bionfriends");
  });
  it("el editor descarta fechas imposibles y destinos peligrosos", () => {
    const raw = aceitesContent();
    const o = raw.blocks[3] as BlockOf<"oil_orders">;
    o.data.groupDeadline = "2026-02-31";
    o.data.soloUrl = "javascript:alert(1)";
    const saved = normalizePageContent(raw).blocks[3] as BlockOf<"oil_orders">;
    expect(saved.data.groupDeadline).toBe("");
    expect(saved.data.soloUrl).toBe("");
  });
});

describe("pedido conjunto", () => {
  const at = (iso: string) => Date.parse(iso);
  it("cerrado, sin fecha, abierto y vencido, en hora de Madrid", () => {
    expect(groupOrderState("off", "2026-12-10", at("2026-12-01T12:00:00Z"))).toBe("closed");
    expect(groupOrderState("on", "", at("2026-12-01T12:00:00Z"))).toBe("no_date");
    expect(groupOrderState("on", "2026-12-10", at("2026-12-01T12:00:00Z"))).toBe("open");
    // El día límite cuenta entero: a las 23:59 de Madrid sigue abierto y a las 00:00 ya no
    expect(groupOrderState("on", "2026-12-10", at("2026-12-10T23:59:00+01:00"))).toBe("open");
    expect(groupOrderState("on", "2026-12-10", at("2026-12-11T00:00:00+01:00"))).toBe("expired");
    // En verano Madrid va dos horas por delante de UTC
    expect(groupOrderState("on", "2027-07-10", at("2027-07-10T22:30:00Z"))).toBe("expired");
  });
  it("fechas", () => {
    expect(cleanDate("5/12/2026")).toBe("2026-12-05");
    expect(cleanDate("pronto")).toBe("");
    expect(formatDeadline("2026-12-05")).toBe("5 de diciembre de 2026");
  });
});

describe("catálogo", () => {
  const products = ["aceite", "mezcla", "base", "pack", "accesorio"].map((t, i) => ({ id: i, name: `Producto ${t}`, tipoProducto: t, tags: i === 0 ? '["Sueño"]' : null }));
  it("seis filtros en el orden pedido; «Todos» no descarta nada y cada producto cae en uno solo", () => {
    expect(OIL_FILTERS.map((f) => f.value)).toEqual(["", "aceite", "mezcla", "base", "pack", "accesorio"]);
    expect(filterOils(products, "", "")).toHaveLength(5);
    const split = OIL_FILTERS.slice(1).flatMap((f) => filterOils(products, f.value, ""));
    expect(split.map((p) => p.id).sort()).toEqual([0, 1, 2, 3, 4]);
  });
  it("busca por nombre o etiqueta sin tildes", () => {
    expect(filterOils(products, "", "sueno").map((p) => p.id)).toEqual([0]);
    expect(filterOils(products, "base", "sueno")).toEqual([]);
  });
});
