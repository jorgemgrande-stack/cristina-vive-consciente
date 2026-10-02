/**
 * Galería de imágenes de las fichas de masaje: lógica pura (shared/serviceGallery) y procedimientos del router.
 * Sin BD ni red: se simula ./db.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildServiceGallery, defaultGallery, imageKey, isAllowedImageUrl, defaultAlt, SALA_IMAGE } from "../shared/serviceGallery";

const MASAJE = { name: "Masaje Relajante", type: "masaje", imageUrl: "/uploads/crm-uploads/images/a.jpg", detailImage: null };

describe("galería por defecto", () => {
  it("masaje: imagen actual + foto de la sala, con textos alternativos y sin repetir", () => {
    const g = defaultGallery(MASAJE);
    expect(g.map((i) => i.url)).toEqual(["/uploads/crm-uploads/images/a.jpg", SALA_IMAGE.url]);
    expect(g[0]).toMatchObject({ isCover: true, alt: "Masaje Relajante — foto principal" });
    expect(g[1].alt).toMatch(/sala de masajes/i);
    expect(g[1].caption).toMatch(/ilustrativa/i);
  });
  it("incluye la imagen de detalle si es distinta y no la repite si es la misma (aunque cambie el dominio)", () => {
    expect(defaultGallery({ ...MASAJE, detailImage: "/uploads/crm-uploads/images/b.webp" })).toHaveLength(3);
    expect(defaultGallery({ ...MASAJE, detailImage: "https://cristinaviveconsciente.es/uploads/crm-uploads/images/a.jpg?v=2" })).toHaveLength(2);
  });
  it("las consultas no llevan la foto de la sala", () => {
    expect(defaultGallery({ ...MASAJE, type: "consulta" }).map((i) => i.url)).toEqual(["/uploads/crm-uploads/images/a.jpg"]);
  });
  it("sin ninguna imagen: galería vacía (la ficha usa su imagen genérica)", () => {
    expect(defaultGallery({ name: "X", type: "consulta" })).toEqual([]);
  });
});

describe("galería personalizada", () => {
  const rows = [
    { id: 3, url: "/uploads/c.jpg", alt: "Tercera", sortOrder: 2, isCover: 0 },
    { id: 1, url: "/uploads/a.jpg", alt: null, sortOrder: 0, isCover: 0 },
    { id: 2, url: "/uploads/b.jpg", alt: "Portada elegida", sortOrder: 1, isCover: 1 },
    { id: 4, url: "/uploads/A.jpg?x=1", alt: "Duplicada", sortOrder: 3, isCover: 0 },
  ];
  it("portada primero, luego por orden; sin duplicados; alt por defecto si falta", () => {
    const { images, custom } = buildServiceGallery(MASAJE, rows);
    expect(custom).toBe(true);
    expect(images.map((i) => i.id)).toEqual([2, 1, 3]);
    expect(images[0]).toMatchObject({ isCover: true, alt: "Portada elegida" });
    expect(images[1].alt).toBe(defaultAlt("Masaje Relajante", 1));
    expect(images.filter((i) => i.isCover)).toHaveLength(1);
  });
  it("sin filas vuelve a la galería por defecto", () => {
    expect(buildServiceGallery(MASAJE, []).custom).toBe(false);
  });
});

describe("rutas de imagen permitidas", () => {
  it("solo /uploads/ y /site/, sin «..», sin otros dominios ni esquemas", () => {
    for (const ok of ["/uploads/crm-uploads/images/1-ab.jpg", "/site/sala-masaje.webp"]) expect(isAllowedImageUrl(ok)).toBe(true);
    for (const bad of ["https://evil.com/a.jpg", "//evil.com/a.jpg", "/uploads/../.env", "javascript:alert(1)", "/crm/x.jpg", "/uploads/a b.jpg", "", "/uploads/" + "a".repeat(600)])
      expect(isAllowedImageUrl(bad)).toBe(false);
  });
  it("imageKey ignora dominio, parámetros y mayúsculas", () => {
    expect(imageKey("https://x.es/Uploads/A.JPG?v=3#f")).toBe("/uploads/a.jpg");
  });
});

// ─── Router ──────────────────────────────────────────────────────────────────
const SERVICE = { id: 11, slug: "masaje_relajante_navas_de_rio_frio_segovia", name: "Masaje Relajante", type: "masaje", status: "active", imageUrl: "/uploads/a.jpg", detailImage: null };
const db = vi.hoisted(() => ({
  listServices: vi.fn(async () => []),
  getServiceById: vi.fn(),
  getServiceBySlug: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  toggleServiceStatus: vi.fn(),
  getServiceImages: vi.fn(),
  addServiceImages: vi.fn(async () => undefined),
  updateServiceImageAlt: vi.fn(async () => undefined),
  getServiceImageById: vi.fn(),
  setServiceImageCover: vi.fn(async () => true),
  moveServiceImage: vi.fn(async () => undefined),
  removeServiceImage: vi.fn(async () => undefined),
}));
vi.mock("./db", () => db);

import { servicesRouter } from "./routers/services";

const pub = () => servicesRouter.createCaller({ user: null, req: {}, res: {} } as any);
const admin = () => servicesRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any);
const user = () => servicesRouter.createCaller({ user: { id: 2, role: "user" }, req: {}, res: {} } as any);

beforeEach(() => {
  vi.clearAllMocks();
  db.getServiceBySlug.mockResolvedValue(SERVICE);
  db.getServiceById.mockResolvedValue(SERVICE);
  db.getServiceImages.mockResolvedValue({ available: true, rows: [] });
});

describe("services.gallery (público)", () => {
  it("sin imágenes propias o con la tabla sin crear devuelve la galería por defecto (nunca falla)", async () => {
    db.getServiceImages.mockResolvedValue({ available: false, rows: [] });
    const g = await pub().gallery({ slug: SERVICE.slug });
    expect(g.map((i) => i.url)).toEqual(["/uploads/a.jpg", SALA_IMAGE.url]);
  });
  it("con imágenes propias devuelve esas, portada primero", async () => {
    db.getServiceImages.mockResolvedValue({
      available: true,
      rows: [
        { id: 1, serviceId: 11, url: "/uploads/x.jpg", alt: "X", sortOrder: 0, isCover: 0 },
        { id: 2, serviceId: 11, url: "/uploads/y.jpg", alt: "Y", sortOrder: 1, isCover: 1 },
      ],
    });
    expect((await pub().gallery({ slug: SERVICE.slug })).map((i) => i.id)).toEqual([2, 1]);
  });
  it("servicio inexistente o inactivo: NOT_FOUND", async () => {
    db.getServiceBySlug.mockResolvedValue({ ...SERVICE, status: "inactive" });
    await expect(pub().gallery({ slug: SERVICE.slug })).rejects.toThrow(/no encontrado/i);
  });
});

describe("services.images* (admin)", () => {
  it("solo los administradores gestionan la galería", async () => {
    await expect(user().imagesAdd({ serviceId: 11, images: [{ url: "/uploads/a.jpg" }] })).rejects.toThrow();
    await expect(pub().imagesRemove({ id: 1 })).rejects.toThrow();
    expect(db.addServiceImages).not.toHaveBeenCalled();
  });
  it("rechaza rutas de imagen no permitidas", async () => {
    await expect(admin().imagesAdd({ serviceId: 11, images: [{ url: "https://evil.com/a.jpg" }] })).rejects.toThrow();
    await expect(admin().imagesAdd({ serviceId: 11, images: [{ url: "/uploads/../.env" }] })).rejects.toThrow();
    expect(db.addServiceImages).not.toHaveBeenCalled();
  });
  it("sin la tabla creada avisa claramente en vez de fallar con un error de SQL", async () => {
    db.getServiceImages.mockResolvedValue({ available: false, rows: [] });
    await expect(admin().imagesAdd({ serviceId: 11, images: [{ url: "/uploads/a.jpg" }] })).rejects.toThrow(/migración 0022/);
  });
  it("añade solo imágenes nuevas (omite las ya existentes y las repetidas entre sí)", async () => {
    db.getServiceImages.mockResolvedValue({ available: true, rows: [{ id: 1, serviceId: 11, url: "/uploads/a.jpg", alt: null, sortOrder: 0, isCover: 1 }] });
    const res = await admin().imagesAdd({ serviceId: 11, images: [{ url: "/uploads/a.jpg" }, { url: "/uploads/b.jpg" }, { url: "/uploads/B.jpg" }] });
    expect(res).toEqual({ added: 1, skippedDuplicates: 2 });
    expect(db.addServiceImages).toHaveBeenCalledWith(11, [{ url: "/uploads/b.jpg" }]);
  });
  it("respeta el máximo de imágenes por masaje", async () => {
    db.getServiceImages.mockResolvedValue({
      available: true,
      rows: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, serviceId: 11, url: `/uploads/${i}.jpg`, alt: null, sortOrder: i, isCover: i === 0 ? 1 : 0 })),
    });
    await expect(admin().imagesAdd({ serviceId: 11, images: [{ url: "/uploads/nueva.jpg" }] })).rejects.toThrow(/máximo/i);
  });
  it("«Personalizar» copia la galería por defecto solo si aún no hay imágenes propias", async () => {
    const res = await admin().imagesAdopt({ serviceId: 11 });
    expect(res.added).toBe(2);
    expect(db.addServiceImages).toHaveBeenCalledWith(11, [
      { url: "/uploads/a.jpg", alt: expect.any(String) },
      { url: SALA_IMAGE.url, alt: SALA_IMAGE.alt },
    ]);
    db.addServiceImages.mockClear();
    db.getServiceImages.mockResolvedValue({ available: true, rows: [{ id: 1, serviceId: 11, url: "/uploads/a.jpg", alt: null, sortOrder: 0, isCover: 1 }] });
    expect((await admin().imagesAdopt({ serviceId: 11 })).added).toBe(0);
    expect(db.addServiceImages).not.toHaveBeenCalled();
  });
  it("portada, orden, texto alternativo y quitar actúan sobre la imagen indicada", async () => {
    db.getServiceImageById.mockResolvedValue({ id: 5, serviceId: 11, url: "/uploads/z.jpg" });
    await admin().imagesSetCover({ id: 5 });
    expect(db.setServiceImageCover).toHaveBeenCalledWith(11, 5);
    await admin().imagesMove({ id: 5, direction: "down" });
    expect(db.moveServiceImage).toHaveBeenCalledWith(11, 5, "down");
    await admin().imagesUpdateAlt({ id: 5, alt: "Camilla con toalla" });
    expect(db.updateServiceImageAlt).toHaveBeenCalledWith(5, "Camilla con toalla");
    await admin().imagesRemove({ id: 5 });
    expect(db.removeServiceImage).toHaveBeenCalledWith(11, 5);
  });
  it("imagen inexistente: NOT_FOUND y no se toca nada", async () => {
    db.getServiceImageById.mockResolvedValue(null);
    await expect(admin().imagesRemove({ id: 99 })).rejects.toThrow(/no encontrada/i);
    expect(db.removeServiceImage).not.toHaveBeenCalled();
  });
});
