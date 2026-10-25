/**
 * Servicios no publicados en la web (visibleEnPublico = 0): fuera de la web pública, disponibles en el CRM.
 * BD simulada con servicios ficticios.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ services: [] as any[] }));
const db = vi.hoisted(() => ({
  listServices: vi.fn(async (onlyActive: boolean) => store.services.filter((s) => !onlyActive || s.status === "active")),
  getServiceById: vi.fn(async (id: number) => store.services.find((s) => s.id === id) ?? null),
  getServiceBySlug: vi.fn(async (slug: string) => store.services.find((s) => s.slug === slug) ?? null),
  createService: vi.fn(async (data: any) => { store.services.push({ id: 99, ...data }); return 99; }),
  updateService: vi.fn(async (id: number, data: any) => Object.assign(store.services.find((s) => s.id === id), data)),
  getServiceImages: vi.fn(async () => ({ available: true, rows: [] })),
}));
vi.mock("./db", async (orig) => ({ ...(await orig<typeof import("./db")>()), ...db }));

import { servicesRouter } from "./routers/services";
import { isPublicService } from "../shared/serviceVisibility";

const pub = () => servicesRouter.createCaller({ user: null, req: {}, res: {} } as any);
const admin = () => servicesRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any);

const base = { type: "masaje", modality: "presencial", price: "70.00", homePrice: null, durationMinutes: 60, featured: 0, sortOrder: 1 };
beforeEach(() => {
  vi.clearAllMocks();
  store.services = [
    { ...base, id: 1, slug: "masaje_publico", name: "Masaje Público Ficticio", status: "active", visibleEnPublico: 1 },
    { ...base, id: 2, slug: "masaje_no_publicado", name: "Masaje No Publicado Ficticio", status: "active", visibleEnPublico: 0 },
    { ...base, id: 3, slug: "masaje_inactivo", name: "Masaje Inactivo Ficticio", status: "inactive", visibleEnPublico: 1 },
  ];
});

describe("web pública: un servicio no publicado no aparece", () => {
  it("listado general y por tipo: solo activos y publicados", async () => {
    expect((await pub().list()).map((s) => s.slug)).toEqual(["masaje_publico"]);
    expect((await pub().list({ type: "masaje" })).map((s) => s.slug)).toEqual(["masaje_publico"]);
  });
  it("ficha y galería: NOT_FOUND (como si no existiera)", async () => {
    await expect(pub().getBySlug({ slug: "masaje_no_publicado" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(pub().gallery({ slug: "masaje_no_publicado" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(pub().getBySlug({ slug: "masaje_publico" })).resolves.toMatchObject({ id: 1 });
  });
  it("los servicios anteriores a 0026 (sin la marca) siguen siendo visibles", () => {
    expect(isPublicService({ status: "active" })).toBe(true);
    expect(isPublicService({ status: "active", visibleEnPublico: 0 })).toBe(false);
    expect(isPublicService({ status: "inactive", visibleEnPublico: 1 })).toBe(false);
    expect(isPublicService(null)).toBe(false);
  });
});

describe("CRM: el servicio no publicado sigue disponible", () => {
  it("aparece en el listado de administración", async () => {
    expect((await admin().listAdmin()).map((s) => s.slug)).toContain("masaje_no_publicado");
  });
  it("crear: por defecto publicado; con visibleEnPublico=false queda oculto", async () => {
    const input = { slug: "nuevo_ficticio", name: "Nuevo Ficticio", price: "120.00", homePrice: null, durationMinutes: 60, type: "masaje", modality: "presencial" } as const;
    await admin().create(input);
    expect((db.createService.mock.calls as any[][])[0][0].visibleEnPublico).toBe(1);
    await admin().create({ ...input, slug: "nuevo_oculto", visibleEnPublico: false });
    expect((db.createService.mock.calls as any[][])[1][0].visibleEnPublico).toBe(0);
  });
  it("editar sin el campo conserva la visibilidad (no se republica por accidente); con el campo, la cambia", async () => {
    const data = { slug: "masaje_no_publicado", name: "Masaje No Publicado Ficticio", price: "70.00", homePrice: null, durationMinutes: 60, type: "masaje", modality: "presencial" } as const;
    await admin().update({ id: 2, data });
    expect((db.updateService.mock.calls as any[][])[0][1]).not.toHaveProperty("visibleEnPublico");
    expect(store.services[1].visibleEnPublico).toBe(0);
    await admin().update({ id: 2, data: { ...data, visibleEnPublico: true } });
    expect(store.services[1].visibleEnPublico).toBe(1);
  });
});
