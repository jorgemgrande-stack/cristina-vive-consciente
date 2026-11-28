/** Descripción de la guía del catálogo: sin soporte grupal y sin tocar el resto. */
import { describe, expect, it } from "vitest";
import { aceitesBlocks } from "../shared/aceitesPage";
import { AROMA_SERVICE } from "../shared/aromaService";
import { removeGroupSupport } from "../shared/oilGuide";

const PROD = "El formato de envío de esta guía es PDF DIGITAL. Guía corta de aceites esenciales básicos para el hogar, incluye soporte grupal y posibilidad de compra a través de mí. Más información, consultar.";

describe("guía del catálogo", () => {
  it("retira solo la promesa de soporte grupal", () => {
    const out = removeGroupSupport(PROD);
    expect(out).toBe("El formato de envío de esta guía es PDF DIGITAL. Guía corta de aceites esenciales básicos para el hogar, incluye posibilidad de compra a través de mí. Más información, consultar.");
    expect(removeGroupSupport(out)).toBe(out);
  });
  it("si se ha reescrito y sigue prometiéndolo, no adivina", () => {
    expect(() => removeGroupSupport("Con soporte grupal por WhatsApp.")).toThrow(/a mano/);
  });
  it("el asesoramiento sigue indicando que incluye la guía, en la página y en la consulta", () => {
    const block = aceitesBlocks().find((b) => b.id === "ac-asesoramiento")!.data as { includes: string };
    expect(block.includes).toContain("Guía básica de aceites esenciales en PDF.");
    expect(AROMA_SERVICE.includes).toContain("Guía básica de aceites esenciales en PDF.");
  });
});
