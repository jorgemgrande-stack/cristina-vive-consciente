/**
 * «Mi consulta» de aceites: consentimiento comprobado en el servidor y sin texto libre de salud.
 * Base de datos y notificaciones simuladas; datos 100 % ficticios.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ createOilConsultation: vi.fn(async () => 501) }));
vi.mock("./oilsDb", () => ({
  createOilConsultation: db.createOilConsultation,
  listOilCategories: vi.fn(),
  listOilProducts: vi.fn(),
  getOilProductBySlug: vi.fn(),
  createOilCategory: vi.fn(),
  updateOilCategory: vi.fn(),
  deleteOilCategory: vi.fn(),
  reorderOilCategories: vi.fn(),
  listAllOilCategories: vi.fn(),
  listAllOilProducts: vi.fn(),
  getOilProductById: vi.fn(),
  createOilProduct: vi.fn(),
  updateOilProduct: vi.fn(),
  deleteOilProduct: vi.fn(),
  reorderOilProducts: vi.fn(),
  listOilConsultations: vi.fn(),
  updateOilConsultation: vi.fn(),
}));
const notify = vi.hoisted(() => ({ notifyOwner: vi.fn(async () => true), notifyAdminNewLead: vi.fn(async () => undefined) }));
vi.mock("./_core/notification", () => ({ notifyOwner: notify.notifyOwner }));
vi.mock("./whatsapp", () => ({ notifyAdminNewLead: notify.notifyAdminNewLead }));

import { oilsRouter } from "./routers/oils";
import { buildOilConsultationMessage } from "../shared/oilConsultation";

const caller = () => oilsRouter.createCaller({ user: null, req: {}, res: {} } as any);
const HEALTH = "INSOMNIO-FICTICIO-PRUEBA";
const base = {
  nombre: "Lucía",
  apellidos: "Ficticia Pérez",
  email: "Lucia.Ficticia@example.com",
  telefono: "+34600000001",
  provincia: "Segovia",
  usos: ["hogar", "aprender"] as const,
  experiencia: "algo" as const,
  productsList: JSON.stringify([{ id: 1, name: "Lavanda", slug: "lavanda" }]),
  acceptPrivacy: true as const,
};

beforeEach(() => vi.clearAllMocks());

describe("«Mi consulta»: consentimiento en el servidor", () => {
  it.each([
    ["sin acceptPrivacy", (({ acceptPrivacy, ...r }) => r)(base)],
    ["acceptPrivacy: false", { ...base, acceptPrivacy: false }],
  ])("%s → BAD_REQUEST y no se guarda ni se notifica nada", async (_n, input) => {
    const err = await caller().submitConsultation(input as any).catch((e) => e);
    expect(err.code).toBe("BAD_REQUEST");
    expect(db.createOilConsultation).not.toHaveBeenCalled();
    expect(notify.notifyOwner).not.toHaveBeenCalled();
    expect(notify.notifyAdminNewLead).not.toHaveBeenCalled();
  });

  it("con consentimiento se guarda solo con opciones cerradas", async () => {
    const r = await caller().submitConsultation({ ...base, usos: [...base.usos] });
    expect(r.success).toBe(true);
    const saved = (db.createOilConsultation.mock.calls as any[][])[0][0];
    expect(saved).toMatchObject({ nombre: "Lucía Ficticia Pérez", email: "lucia.ficticia@example.com", status: "new" });
    expect(saved.mensaje).toBe("Apellidos: Ficticia Pérez | Provincia: Segovia | Usos: Ambientar el hogar (difusor), Aprender a usarlos con seguridad | Experiencia: Los he probado alguna vez");
  });
});

describe("«Mi consulta»: sin texto libre de salud", () => {
  it("el antiguo campo libre «mensaje» (u otros no previstos) se descarta: no llega a la BD ni a las notificaciones", async () => {
    await caller().submitConsultation({ ...base, usos: [...base.usos], mensaje: `Objetivos: ${HEALTH}`, objetivos: HEALTH } as any);
    const everything = JSON.stringify(db.createOilConsultation.mock.calls) + JSON.stringify(notify.notifyOwner.mock.calls) + JSON.stringify(notify.notifyAdminNewLead.mock.calls);
    expect(everything).not.toContain(HEALTH);
  });

  it("usos y experiencia solo admiten las opciones previstas", async () => {
    await expect(caller().submitConsultation({ ...base, usos: [HEALTH] } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller().submitConsultation({ ...base, usos: [] } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller().submitConsultation({ ...base, usos: [...base.usos], experiencia: HEALTH } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createOilConsultation).not.toHaveBeenCalled();
  });

  it("el resumen se construye solo con las etiquetas de las opciones", () => {
    expect(buildOilConsultationMessage({ usos: ["otro"], experiencia: "ninguna" })).toBe("Usos: Otro: prefiero hablarlo con Cristina | Experiencia: Nunca los he usado");
  });
});
