import { describe, expect, it } from "vitest";
import { buildRelatedItems } from "../shared/relatedItems";

const eb = (slug: string, title: string, price = "9.90") => ({ slug, title, price, coverImage: `/c/${slug}.jpg`, galleryImages: null });

describe("También te puede interesar", () => {
  const src = {
    currentSlug: "los-cuatro-regalos-de-la-tierra",
    ebooks: [eb("los_cuatro_regalos_de_la_tierra", "Los cuatro regalos"), eb("agua", "Guía del agua", "10.00")],
    services: [
      { slug: "primera", name: "Consulta", type: "consulta", imageUrl: "/s.jpg", price: "60.00" },
      { slug: "relax", name: "Masaje relax", type: "masaje", imageUrl: null, price: null },
      { slug: "otra", name: "Otro", type: "otro", imageUrl: null, price: "5" },
    ],
    water: [{ slug: "sist", title: "Sistema", mainImage: "/w.jpg", priceVisible: "1.200 €" }],
  };
  it("excluye el ebook actual (con - o _), no duplica, incluye sistemas de agua y deja fuera los aceites", () => {
    const r = buildRelatedItems({ ...src, ebooks: [...src.ebooks, eb("agua", "Guía del agua duplicada")] });
    expect(r.map((i) => i.href)).toEqual(["/guias-digitales/agua", "/consultas/primera", "/masajes/relax", "/sistemas-agua/sist"]);
    expect(r[0]).toMatchObject({ price: "10€", image: "/c/agua.jpg" });
    expect(r[1].price).toBe("60 €");
    expect(r[2].price).toBeNull();
  });
  it("sin otros artículos devuelve lista vacía (la sección no se pinta)", () => {
    expect(buildRelatedItems({ currentSlug: "x", ebooks: [eb("x", "X")], services: [], water: [] })).toEqual([]);
  });
});
