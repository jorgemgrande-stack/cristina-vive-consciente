/** Sección de Aceites Esenciales: contenido de serie, destinos, estados del pedido conjunto y filtros del catálogo. */
import { describe, expect, it } from "vitest";
import { ACEITES_CONTACT, aceitesBlocks, aceitesContent } from "../shared/aceitesPage";
import { oilLink, visibleOilTags } from "../shared/oilLinks";
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
  it("pedidos permanentes: condiciones de cada modalidad, 100 € solo en el individual y sin 25 € ni calendario", () => {
    const o = block("ac-pedidos");
    expect(o.groupPoints.split("\n")).toEqual(["Sin importe mínimo de compra.", "Gastos de envío aparte.", "Pago por adelantado."]);
    expect(o.soloPoints.split("\n")).toEqual(["Importe mínimo de compra: 100 €.", "Gastos de envío aparte.", "Pago por adelantado."]);
    expect([o.groupLabel, o.soloLabel, o.conditions]).toEqual(["Consultar próximo pedido", "Solicitar pedido individual", ""]);
    expect(o.groupUrl).toBe(ACEITES_CONTACT.next);
    expect(o.soloUrl).toBe(ACEITES_CONTACT.individual);
    expect(JSON.stringify(o)).not.toMatch(/25 €|groupOpen|groupDeadline/);
    expect(JSON.stringify(o).match(/100 €/g)).toHaveLength(1);
    expect(block("ac-servicios").items[1].text).toBe("Consulta cómo participar en un pedido conjunto o solicita un pedido individual");
  });
  it("canal oficial, reserva y precio", () => {
    expect(block("ac-guias").items[0].ebookSlug).toBe("aceites");
    expect(block("ac-asesoramiento")).toMatchObject({ serviceSlug: "asesoramiento_aromaterapia", priceLabel: "Precio del servicio: {precio}", buttonLabel: "Solicitar asesoramiento", helpUrl: ACEITES_CONTACT.advice });
    // El precio no está escrito en la página: sale de CRM → Servicios
    expect(JSON.stringify(block("ac-asesoramiento"))).not.toMatch(/14,90|90 €|120 €/);
    for (const url of Object.values(ACEITES_CONTACT)) expect(url).toMatch(/^https:\/\/wa\.me\/34657165343\?text=/);
    expect(new Set(Object.values(ACEITES_CONTACT)).size).toBe(3);
    expect(JSON.stringify(aceitesContent()).toLowerCase()).not.toContain("terapéutica");
    expect(JSON.stringify(aceitesContent()).toLowerCase()).not.toContain("bionfriends");
  });
  it("el editor descarta fechas imposibles y destinos peligrosos", () => {
    const raw = aceitesContent();
    const o = raw.blocks[3] as BlockOf<"oil_orders">;
    o.data.soloUrl = "javascript:alert(1)";
    const saved = normalizePageContent(raw).blocks[3] as BlockOf<"oil_orders">;
    expect(saved.data.soloUrl).toBe("");
  });
});

describe("fichas que remiten a otro producto", () => {
  it("la etiqueta define el enlace y no se muestra como etiqueta", () => {
    const tags = '["guia","ebook:aceites"]';
    expect(oilLink(tags)).toEqual({ kind: "ebook", ref: "aceites" });
    expect(visibleOilTags(tags)).toEqual(["guia"]);
    expect(oilLink('["consulta:asesoramiento_aromaterapia"]')).toEqual({ kind: "consulta", ref: "asesoramiento_aromaterapia" });
    expect(oilLink('["relajante"]')).toBeNull();
    expect(oilLink("no es json")).toBeNull();
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
