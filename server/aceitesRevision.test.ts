/** Ajustes tras la revisión de Cristina: enlace a Pedidos desde la guía, plazo del PDF y pregunta nueva. */
import { describe, expect, it } from "vitest";
import { aceitesBlocks } from "../shared/aceitesPage";
import { DELIVERY_NEW, DELIVERY_OLD, GUIDE_ORDERS_SENTENCE, alignDelivery, linkGuideToOrders } from "../shared/aceitesRevision";
import { AROMA_FAQ, AROMA_SERVICE } from "../shared/aromaService";
import { splitLinks } from "../shared/textLinks";

const PROD = "El formato de envío de esta guía es PDF DIGITAL. Guía corta de aceites esenciales básicos para el hogar, incluye posibilidad de compra a través de mí. Más información, consultar.";

describe("ficha de la guía digital", () => {
  it("sustituye solo la mención a la compra y es repetible", () => {
    const out = linkGuideToOrders(PROD);
    expect(out).toBe(`El formato de envío de esta guía es PDF DIGITAL. Guía corta de aceites esenciales básicos para el hogar. ${GUIDE_ORDERS_SENTENCE} Más información, consultar.`);
    expect(linkGuideToOrders(out)).toBe(out);
    expect(() => linkGuideToOrders("Otro texto.")).toThrow(/a mano/);
  });
  it("el enlace se lee como la frase pedida y lleva a Pedidos", () => {
    const parts = splitLinks(GUIDE_ORDERS_SENTENCE);
    expect(parts.map((p) => (typeof p === "string" ? p : p.label)).join("")).toBe("Si quieres adquirir alguno de los aceites de la guía, puedes consultar las modalidades de pedido.");
    expect(parts[1]).toEqual({ label: "consultar las modalidades de pedido", href: "/aceites-esenciales#pedidos" });
  });
  it("solo enlaza rutas de la propia web", () => {
    for (const t of ["[a](https://otro.sitio)", "[a](//otro.sitio)", "[a](/\\otro.sitio)", "[a](javascript:alert(1))", "Sin enlaces."]) {
      expect(splitLinks(t)).toEqual([t]);
    }
  });
});

describe("plazo del PDF personalizado", () => {
  it("página, consulta y pregunta frecuente cuentan desde la confirmación", () => {
    const block = aceitesBlocks().find((b) => b.id === "ac-asesoramiento")!.data as { howText: string };
    for (const t of [block.howText, AROMA_SERVICE.longDescription]) {
      expect(t).toContain(DELIVERY_NEW);
      expect(t).not.toContain(DELIVERY_OLD);
    }
    const answers = AROMA_FAQ.map((f) => f.a).filter((a) => a.includes("10 días"));
    expect(answers).toHaveLength(2);
    for (const a of answers) expect(a).toContain("10 días desde que me confirmes tu selección");
  });
  it("actualiza lo guardado sin pisar textos reescritos", () => {
    expect(alignDelivery(`Antes. ${DELIVERY_OLD} Después.`)).toBe(`Antes. ${DELIVERY_NEW} Después.`);
    expect(alignDelivery(DELIVERY_NEW)).toBe(DELIVERY_NEW);
    expect(alignDelivery("Te lo envío cuando pueda.")).toBeNull();
  });
  it("conserva las preguntas anteriores y añade la nueva", () => {
    expect(AROMA_FAQ.map((f) => f.q)).toEqual([
      "¿Cómo se desarrolla el asesoramiento?",
      "¿Es online o presencial?",
      "¿Cuándo recibiré el documento personalizado?",
      "¿Tengo que comprar los aceites recomendados?",
      "¿Qué diferencia hay entre la guía básica y el PDF personalizado?",
    ]);
  });
});
