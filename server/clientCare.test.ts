/**
 * Ficha integral de clientes: permisos, cálculos, sesiones, trazabilidad y bloqueo real de los módulos sensibles.
 * Base de datos simulada en memoria con datos 100 % ficticios.
 */
import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Base de datos ficticia en memoria ───────────────────────────────────────
type Row = Record<string, any>;
const store = vi.hoisted(() => ({
  clients: [] as Row[],
  sessions: [] as Row[],
  appointments: [] as Row[],
  services: [] as Row[],
  audit: [] as Row[],
  sensitive: [] as Row[],
  consents: [] as Row[],
  seq: 1000,
}));

const db = vi.hoisted(() => {
  const s = () => store;
  return {
    getClientRow: vi.fn(async (id: number) => s().clients.find((c) => c.id === id)),
    updateClientProfile: vi.fn(async (id: number, data: Row) => Object.assign(s().clients.find((c) => c.id === id)!, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)))),
    listServicesBasic: vi.fn(async () => s().services),
    serviceExists: vi.fn(async (id: number) => s().services.some((x) => x.id === id)),
    listClientAppointments: vi.fn(async (clientId: number) => s().appointments.filter((a) => a.clientId === clientId)),
    appointmentBelongsToClient: vi.fn(async (id: number, clientId: number) => s().appointments.some((a) => a.id === id && a.clientId === clientId)),
    listSessions: vi.fn(async (clientId: number) =>
      s()
        .sessions.filter((x) => x.clientId === clientId)
        .map((x) => ({ ...x, serviceName: s().services.find((sv) => sv.id === x.serviceId)?.name ?? null, practicalNotes: x.summary, pendingNext: x.nextSteps }))
        .sort((a, b) => b.sessionDate - a.sessionDate || b.id - a.id),
    ),
    getSession: vi.fn(async (id: number, clientId: number) => s().sessions.find((x) => x.id === id && x.clientId === clientId)),
    insertSession: vi.fn(async (clientId: number, data: Row, userId: number) => {
      const id = ++s().seq;
      s().sessions.push({ id, clientId, ...data, createdBy: userId });
      return id;
    }),
    updateSession: vi.fn(async (id: number, clientId: number, data: Row, userId: number) => {
      const row = s().sessions.find((x) => x.id === id && x.clientId === clientId);
      if (row) Object.assign(row, data, { editedAt: new Date(), editedBy: userId });
    }),
    insertAudit: vi.fn(async (e: Row) => void s().audit.push(e)),
    listAudit: vi.fn(async (clientId: number) => s().audit.filter((a) => a.clientId === clientId)),
    listSensitive: vi.fn(async (clientId: number, module: string) => s().sensitive.filter((r) => r.clientId === clientId && r.module === module)),
    insertSensitive: vi.fn(async (clientId: number, module: string, ciphertext: string, keyVersion: string, recordDate: number) => {
      const id = ++s().seq;
      s().sensitive.push({ id, clientId, module, ciphertext, keyVersion, recordDate });
      return id;
    }),
    updateSensitive: vi.fn(async () => undefined),
    deleteSensitiveForClient: vi.fn(async (clientId: number, module?: string) => {
      s().sensitive = s().sensitive.filter((r) => !(r.clientId === clientId && (!module || r.module === module)));
    }),
    countSensitive: vi.fn(async (clientId: number) => ({
      first_visit: s().sensitive.filter((r) => r.clientId === clientId && r.module === "first_visit").length,
      emotional: s().sensitive.filter((r) => r.clientId === clientId && r.module === "emotional").length,
    })),
    listConsents: vi.fn(async (clientId: number) => s().consents.filter((c) => c.clientId === clientId)),
    activeConsent: vi.fn(async (clientId: number, module: string) => s().consents.find((c) => c.clientId === clientId && c.module === module && !c.withdrawnAt)),
    insertConsent: vi.fn(async (data: Row) => {
      const id = ++s().seq;
      s().consents.push({ id, ...data, withdrawnAt: null, reviewRequired: false });
      return id;
    }),
    withdrawConsent: vi.fn(async (id: number, clientId: number, at: number) => {
      const c = s().consents.find((x) => x.id === id && x.clientId === clientId);
      if (c) Object.assign(c, { withdrawnAt: at, reviewRequired: true });
    }),
    deleteConsentsForClient: vi.fn(async () => undefined),
    exportAdministrative: vi.fn(async (clientId: number) => ({ client: s().clients.find((c) => c.id === clientId), sessions: [], notes: [], appointments: [], invoices: [], consents: [] })),
    careCounts: vi.fn(async () => ({ sessions: 1, notes: 0, appointments: 2, invoices: 0, sensitive: { first_visit: 0, emotional: 0 } })),
    eraseCareData: vi.fn(async () => undefined),
  };
});
vi.mock("./clientCareDb", () => db);

// Si algo intentara notificar, fallaría la prueba de "sin notificaciones"
const notifications = vi.hoisted(() => ({ sendEmail: vi.fn(), notifyAdminWhatsApp: vi.fn() }));
vi.mock("./email", () => ({ sendEmail: notifications.sendEmail }));
vi.mock("./whatsapp", () => ({ notifyAdminWhatsApp: notifications.notifyAdminWhatsApp }));

import { clientCareRouter } from "./routers/clientCare";
import { decryptPayload, encryptPayload } from "./sensitive/crypto";
import { moduleReadiness } from "./sensitive/config";
import { changedFields, lastVisit, nextAppointment, servicesReceived, sortSessions } from "../shared/clientCare";
import { clientSearchTerms } from "./db";
import { adminSessionCookieOptions, createLoginLimiter, safeEqual } from "./_core/adminAuth";

const caller = (user: Row | null) => clientCareRouter.createCaller({ user, req: {}, res: {} } as any);
const admin = () => caller({ id: 1, role: "admin" });

const DAY = 86_400_000;
const NOW = Date.now();
// Marcadores ficticios que NUNCA deben aparecer en logs, errores ni auditoría
const SECRET_HEALTH = "ALERGIA-FICTICIA-zx81";
const SECRET_EMOTION = "RELATO-FICTICIO-qq42";
const PRACTICAL = "PRESION-SUAVE-FICTICIA";

const TEST_ENV = {
  SENSITIVE_FIRST_VISIT_ENABLED: "true",
  SENSITIVE_EMOTIONAL_ENABLED: "true",
  SENSITIVE_DATA_KEY: crypto.randomBytes(32).toString("base64"),
  SENSITIVE_KEY_VERSION: "test1",
  PRIVACY_REVIEW_REF: "REVISION-FICTICIA",
  PRIVACY_LEGAL_BASIS: "explicit_consent",
  PRIVACY_NOTICE_VERSION: "v-test",
};
const enableSensitive = () => Object.entries(TEST_ENV).forEach(([k, v]) => vi.stubEnv(k, v));

let logged: string[];
beforeEach(() => {
  Object.assign(store, {
    clients: [
      { id: 1, firstName: "Lucía", lastName: "Ficticia Pérez", phone: "+34600000001", email: null, status: "active", occupation: null, customRate: null, customRateNote: null, rememberInfo: null, notes: null },
      { id: 2, firstName: "Marcos", lastName: "Inventado", phone: "+34600000002", status: "active", customRate: null },
    ],
    sessions: [
      { id: 10, clientId: 1, sessionDate: NOW - 30 * DAY, serviceId: 11, summary: "antigua", clientPreferences: null, nextSteps: null, durationMinutes: 45, appointmentId: null },
      { id: 11, clientId: 1, sessionDate: NOW - 5 * DAY, serviceId: 7, summary: "reciente", clientPreferences: null, nextSteps: null, durationMinutes: 60, appointmentId: null },
      { id: 12, clientId: 2, sessionDate: NOW - 1 * DAY, serviceId: 11, summary: "de otro cliente" },
    ],
    appointments: [
      { id: 100, clientId: 1, scheduledAt: NOW - 5 * DAY, status: "completed", serviceLabel: "Masaje" },
      { id: 101, clientId: 1, scheduledAt: NOW + 20 * DAY, status: "confirmed", serviceLabel: "Masaje lejano" },
      { id: 102, clientId: 1, scheduledAt: NOW + 3 * DAY, status: "pending", serviceLabel: "Masaje cercano" },
      { id: 103, clientId: 1, scheduledAt: NOW + 1 * DAY, status: "cancelled", serviceLabel: "Cancelada" },
    ],
    services: [
      { id: 11, name: "Masaje Relajante", type: "masaje", durationMinutes: 45, status: "active" },
      { id: 7, name: "Masaje Integrativo 60 min", type: "masaje", durationMinutes: 60, status: "active" },
    ],
    audit: [],
    sensitive: [],
    consents: [],
    seq: 1000,
  });
  Object.values(db).forEach((f) => (f as any).mockClear?.());
  logged = [];
  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => void logged.push(args.map(String).join(" ")));
  }
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    throw new Error("No debe haber llamadas externas");
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ─── Permisos ────────────────────────────────────────────────────────────────
const OPERATIONS: Array<[string, (c: ReturnType<typeof caller>) => Promise<unknown>]> = [
  ["modules", (c) => c.modules()],
  ["summary", (c) => c.summary({ clientId: 1 })],
  ["updateProfile", (c) => c.updateProfile({ clientId: 1, occupation: "x" })],
  ["sessions.list", (c) => c.sessions.list({ clientId: 1 })],
  ["sessions.create", (c) => c.sessions.create({ clientId: 1, sessionDate: NOW })],
  ["sessions.update", (c) => c.sessions.update({ clientId: 1, id: 10, sessionDate: NOW })],
  ["audit", (c) => c.audit({ clientId: 1 })],
  ["firstVisit.list", (c) => c.firstVisit.list({ clientId: 1 })],
  ["firstVisit.save", (c) => c.firstVisit.save({ clientId: 1, recordDate: NOW, data: { allergies: SECRET_HEALTH } })],
  ["emotional.list", (c) => c.emotional.list({ clientId: 1 })],
  ["emotional.save", (c) => c.emotional.save({ clientId: 1, recordDate: NOW, data: {} })],
  ["consents.list", (c) => c.consents.list({ clientId: 1, module: "first_visit" })],
  ["consents.grant", (c) => c.consents.grant({ clientId: 1, module: "first_visit", method: "papel_firmado" })],
  ["consents.withdraw", (c) => c.consents.withdraw({ clientId: 1, consentId: 1, module: "first_visit" })],
  ["rights.export", (c) => c.rights.export({ clientId: 1 })],
  ["rights.erasePreview", (c) => c.rights.erasePreview({ clientId: 1 })],
  ["rights.erase", (c) => c.rights.erase({ clientId: 1, confirmName: "Lucía Ficticia Pérez" })],
  ["rights.eraseModule", (c) => c.rights.eraseModule({ clientId: 1, module: "emotional" })],
];

describe("permisos de servidor en cada operación", () => {
  it.each(OPERATIONS)("%s: sin sesión → UNAUTHORIZED", async (_n, op) => {
    await expect(op(caller(null))).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it.each(OPERATIONS)("%s: usuario sin rol admin → FORBIDDEN", async (_n, op) => {
    await expect(op(caller({ id: 2, role: "user" }))).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("ninguna operación rechazada tocó datos", () => {
    for (const f of ["insertSession", "updateSession", "updateClientProfile", "listSensitive", "insertSensitive", "insertConsent", "eraseCareData"] as const) expect(db[f]).not.toHaveBeenCalled();
  });
});

// ─── Resumen y cálculos ──────────────────────────────────────────────────────
describe("resumen de la ficha", () => {
  it("última visita = sesión más reciente; próxima cita = reserva futura pendiente/confirmada más cercana", async () => {
    const s = await admin().summary({ clientId: 1 });
    expect(s.lastVisit).toBe(NOW - 5 * DAY);
    expect(s.nextAppointment?.id).toBe(102); // la cancelada de mañana no cuenta
    expect(s.latestSession).toMatchObject({ id: 11, serviceName: "Masaje Integrativo 60 min" });
    expect(s.servicesReceived.map((x) => x.name)).toEqual(["Masaje Integrativo 60 min", "Masaje Relajante"]);
    expect(s.sessionsCount).toBe(2); // no mezcla sesiones de otro cliente
  });
  it("cliente inexistente → NOT_FOUND", async () => {
    await expect(admin().summary({ clientId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("funciones puras: sin sesiones ni citas futuras devuelven null", () => {
    expect(lastVisit([])).toBeNull();
    expect(nextAppointment([{ id: 1, scheduledAt: NOW - DAY, status: "confirmed" }], NOW)).toBeNull();
    expect(servicesReceived([{ sessionDate: 1, serviceId: 999 }], [{ id: 1, name: "x" }])).toEqual([]);
    expect(sortSessions([{ id: 1, sessionDate: 5 }, { id: 2, sessionDate: 5 }, { id: 3, sessionDate: 9 }]).map((x) => x.id)).toEqual([3, 2, 1]);
  });
});

// ─── Sesiones ────────────────────────────────────────────────────────────────
describe("sesiones", () => {
  it("añadir una sesión es una entrada nueva y no modifica las anteriores", async () => {
    const before = JSON.parse(JSON.stringify(store.sessions));
    const { id } = await admin().sessions.create({ clientId: 1, sessionDate: NOW, serviceId: 11, durationMinutes: 45, practicalNotes: PRACTICAL, pendingNext: "probar lavanda" });
    expect(db.updateSession).not.toHaveBeenCalled();
    expect(store.sessions.slice(0, before.length)).toEqual(before);
    expect(store.sessions.find((x) => x.id === id)).toMatchObject({ clientId: 1, serviceId: 11, summary: PRACTICAL, nextSteps: "probar lavanda", createdBy: 1 });
    const list = await admin().sessions.list({ clientId: 1 });
    expect(list.map((x) => x.id)).toEqual([id, 11, 10]); // más reciente primero
  });
  it("rechaza servicios inexistentes y citas de otro cliente", async () => {
    await expect(admin().sessions.create({ clientId: 1, sessionDate: NOW, serviceId: 999 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    store.appointments.push({ id: 200, clientId: 2, scheduledAt: NOW, status: "confirmed" });
    await expect(admin().sessions.create({ clientId: 1, sessionDate: NOW, appointmentId: 200 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.insertSession).not.toHaveBeenCalled();
  });
  it("editar deja quién y cuándo, y la auditoría guarda solo nombres de campos", async () => {
    const r = await admin().sessions.update({ clientId: 1, id: 10, sessionDate: NOW - 30 * DAY, serviceId: 11, durationMinutes: 45, practicalNotes: PRACTICAL });
    expect(r.changed).toEqual(["summary"]);
    expect(store.sessions.find((x) => x.id === 10)).toMatchObject({ summary: PRACTICAL, editedBy: 1 });
    expect(store.sessions.find((x) => x.id === 11)!.summary).toBe("reciente"); // las demás intactas
    const entry = store.audit.at(-1)!;
    expect(entry).toMatchObject({ action: "update", entityType: "session", entityId: 10, clientId: 1, fields: ["summary"] });
    expect(JSON.stringify(store.audit)).not.toContain(PRACTICAL);
  });
  it("no se puede editar la sesión de otro cliente cambiando el id", async () => {
    await expect(admin().sessions.update({ clientId: 1, id: 12, sessionDate: NOW })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updateSession).not.toHaveBeenCalled();
  });
});

describe("perfil", () => {
  it("guarda solo lo que cambia y audita sin contenido", async () => {
    const r = await admin().updateProfile({ clientId: 1, occupation: "Profesora", rememberInfo: PRACTICAL, customRate: "65,50" });
    expect(r.changed.sort()).toEqual(["customRate", "occupation", "rememberInfo"]);
    expect(store.clients[0]).toMatchObject({ occupation: "Profesora", customRate: "65.50", rememberInfo: PRACTICAL });
    expect(JSON.stringify(store.audit)).not.toContain(PRACTICAL);
    expect(changedFields({ a: 1, b: null }, { a: 1, b: undefined })).toEqual([]);
  });
  it("valida longitudes en el servidor sin devolver el texto recibido", async () => {
    const long = PRACTICAL + "x".repeat(3000);
    const err = await admin().updateProfile({ clientId: 1, rememberInfo: long }).catch((e) => e);
    expect(err.code).toBe("BAD_REQUEST");
    expect(JSON.stringify(err)).not.toContain(PRACTICAL);
  });
});

// ─── Módulos sensibles desactivados (estado por defecto) ─────────────────────
describe("módulos sensibles DESACTIVADOS: imposibilidad real de leer o escribir", () => {
  it("por defecto ambos módulos están bloqueados", async () => {
    const m = await admin().modules();
    expect(m.every((x) => !x.enabled)).toBe(true);
    expect(moduleReadiness("first_visit", {}).missing).toEqual([
      "SENSITIVE_FIRST_VISIT_ENABLED", "SENSITIVE_DATA_KEY", "SENSITIVE_KEY_VERSION", "PRIVACY_REVIEW_REF", "PRIVACY_LEGAL_BASIS", "PRIVACY_NOTICE_VERSION",
    ]);
  });

  const BLOCKED: Array<[string, () => Promise<unknown>]> = [
    ["firstVisit.list", () => admin().firstVisit.list({ clientId: 1 })],
    ["firstVisit.save", () => admin().firstVisit.save({ clientId: 1, recordDate: NOW, data: { allergies: SECRET_HEALTH } })],
    ["firstVisit.save (edición)", () => admin().firstVisit.save({ clientId: 1, id: 5, recordDate: NOW, data: { allergies: SECRET_HEALTH } })],
    ["emotional.list", () => admin().emotional.list({ clientId: 1 })],
    ["emotional.save", () => admin().emotional.save({ clientId: 1, recordDate: NOW, data: { clientAccount: { emotions: SECRET_EMOTION }, professionalObservations: {}, followUp: {} } })],
    ["consents.list", () => admin().consents.list({ clientId: 1, module: "emotional" })],
    ["consents.grant", () => admin().consents.grant({ clientId: 1, module: "first_visit", method: "papel_firmado" })],
  ];
  it.each(BLOCKED)("%s → FORBIDDEN sin tocar los datos", async (_n, op) => {
    await expect(op()).rejects.toMatchObject({ code: "FORBIDDEN" });
    for (const f of ["listSensitive", "insertSensitive", "updateSensitive", "activeConsent", "insertConsent", "getClientRow"] as const) expect(db[f]).not.toHaveBeenCalled();
    expect(store.sensitive).toHaveLength(0);
  });

  it("aunque la clave esté configurada, sin el interruptor ni la revisión sigue bloqueado", async () => {
    vi.stubEnv("SENSITIVE_DATA_KEY", TEST_ENV.SENSITIVE_DATA_KEY);
    vi.stubEnv("SENSITIVE_FIRST_VISIT_ENABLED", "true");
    await expect(admin().firstVisit.list({ clientId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    vi.stubEnv("PRIVACY_LEGAL_BASIS", "interes_legitimo"); // base no implementada como control
    expect(moduleReadiness("first_visit").enabled).toBe(false);
  });

  it("el rechazo queda registrado sin contenido y sin enviar nada fuera", async () => {
    await admin().firstVisit.save({ clientId: 1, recordDate: NOW, data: { allergies: SECRET_HEALTH } }).catch(() => undefined);
    expect(store.audit).toContainEqual(expect.objectContaining({ action: "denied_disabled", entityType: "first_visit", clientId: 1 }));
    const everything = JSON.stringify(store.audit) + logged.join("\n");
    expect(everything).not.toContain(SECRET_HEALTH);
    expect(notifications.sendEmail).not.toHaveBeenCalled();
    expect(notifications.notifyAdminWhatsApp).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("la exportación no descifra nada: solo indica que hay registros bloqueados", async () => {
    store.sensitive.push({ id: 1, clientId: 1, module: "emotional", ciphertext: "v1.x.y.z", recordDate: NOW });
    const out = await admin().rights.export({ clientId: 1 });
    expect(out.sensitive).toEqual({ first_visit: { blocked: true, records: 0 }, emotional: { blocked: true, records: 1 } });
    expect(db.listSensitive).not.toHaveBeenCalled();
  });

  it("borrar los datos de un módulo sí se permite (supresión) sin leerlos", async () => {
    store.sensitive.push({ id: 1, clientId: 1, module: "emotional", ciphertext: "v1.x.y.z", recordDate: NOW });
    await admin().rights.eraseModule({ clientId: 1, module: "emotional" });
    expect(store.sensitive).toHaveLength(0);
    expect(db.listSensitive).not.toHaveBeenCalled();
  });
});

// ─── Módulos sensibles habilitados (entorno de prueba) ───────────────────────
describe("módulos sensibles HABILITADOS: consentimiento, cifrado y retirada", () => {
  beforeEach(enableSensitive);

  it("sin consentimiento explícito vigente no se guarda nada", async () => {
    await expect(admin().firstVisit.save({ clientId: 1, recordDate: NOW, data: { allergies: SECRET_HEALTH } })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(db.insertSensitive).not.toHaveBeenCalled();
  });

  it("con consentimiento se guarda CIFRADO, se lee descifrado y se audita sin contenido", async () => {
    await admin().consents.grant({ clientId: 1, module: "first_visit", method: "papel_firmado" });
    expect(store.consents[0]).toMatchObject({ module: "first_visit", textVersion: "v-test", method: "papel_firmado" });
    await admin().firstVisit.save({ clientId: 1, recordDate: NOW, data: { allergies: SECRET_HEALTH } });
    expect(store.sensitive[0].ciphertext).not.toContain(SECRET_HEALTH);
    expect(store.sensitive[0].ciphertext.startsWith("v1.")).toBe(true);
    const rows = await admin().firstVisit.list({ clientId: 1 });
    expect(rows[0].data).toMatchObject({ allergies: SECRET_HEALTH });
    expect(store.audit.map((a) => a.action)).toEqual(expect.arrayContaining(["consent_granted", "create", "read"]));
    expect(JSON.stringify(store.audit) + logged.join("\n")).not.toContain(SECRET_HEALTH);
  });

  it("acompañamiento: separa relato, observaciones y seguimiento; un consentimiento por módulo", async () => {
    await admin().consents.grant({ clientId: 1, module: "first_visit", method: "papel_firmado" });
    await expect(
      admin().emotional.save({ clientId: 1, recordDate: NOW, data: { clientAccount: { emotions: SECRET_EMOTION }, professionalObservations: {}, followUp: {} } }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" }); // el de primera visita no vale para acompañamiento
    await admin().consents.grant({ clientId: 1, module: "emotional", method: "formulario_electronico" });
    await admin().emotional.save({ clientId: 1, recordDate: NOW, data: { clientAccount: { emotions: SECRET_EMOTION }, professionalObservations: { observations: "obs" }, followUp: { goals: "obj" } } });
    const [row] = await admin().emotional.list({ clientId: 1 });
    expect(Object.keys(row.data)).toEqual(["clientAccount", "professionalObservations", "followUp"]);
  });

  it("retirar el consentimiento bloquea nuevos registros y marca revisión", async () => {
    const { id } = await admin().consents.grant({ clientId: 1, module: "first_visit", method: "papel_firmado" });
    const r = await admin().consents.withdraw({ clientId: 1, consentId: id, module: "first_visit" });
    expect(r.reviewRequired).toBe(true);
    expect(store.consents[0]).toMatchObject({ reviewRequired: true });
    await expect(admin().firstVisit.save({ clientId: 1, recordDate: NOW, data: { allergies: "x" } })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("datos inválidos: el error no devuelve el contenido", async () => {
    await admin().consents.grant({ clientId: 1, module: "first_visit", method: "papel_firmado" });
    const err = await admin().firstVisit.save({ clientId: 1, recordDate: NOW, data: { allergies: SECRET_HEALTH + "x".repeat(3000) } }).catch((e) => e);
    expect(err.code).toBe("BAD_REQUEST");
    expect(JSON.stringify(err) + String(err.message)).not.toContain(SECRET_HEALTH);
  });
});

// ─── Supresión ───────────────────────────────────────────────────────────────
describe("derechos: supresión de la ficha", () => {
  it("exige escribir el nombre completo", async () => {
    await expect(admin().rights.erase({ clientId: 1, confirmName: "otra persona" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.eraseCareData).not.toHaveBeenCalled();
    await admin().rights.erase({ clientId: 1, confirmName: "  lucía ficticia pérez " });
    expect(db.eraseCareData).toHaveBeenCalledWith(1);
  });
});

// ─── Cifrado, búsqueda y acceso ──────────────────────────────────────────────
describe("cifrado de aplicación", () => {
  const env = { SENSITIVE_DATA_KEY: crypto.randomBytes(32).toString("base64") };
  it("ida y vuelta; ligado al cliente y al módulo; detecta manipulación", () => {
    const blob = encryptPayload({ a: SECRET_HEALTH }, 1, "first_visit", env);
    expect(blob).not.toContain(SECRET_HEALTH);
    expect(decryptPayload(blob, 1, "first_visit", env)).toEqual({ a: SECRET_HEALTH });
    expect(() => decryptPayload(blob, 2, "first_visit", env)).toThrow(); // copiado a otra ficha
    expect(() => decryptPayload(blob, 1, "emotional", env)).toThrow(); // copiado a otro módulo
    const parts = blob.split(".");
    parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith("A") ? "BB" : "AA");
    expect(() => decryptPayload(parts.join("."), 1, "first_visit", env)).toThrow();
    expect(() => encryptPayload({}, 1, "first_visit", { SENSITIVE_DATA_KEY: "corta" })).toThrow(/Clave/);
  });
});

describe("búsqueda de clientes", () => {
  it("separa palabras y escapa comodines", () => {
    expect(clientSearchTerms("  ana   garcía ")).toEqual(["ana", "garcía"]);
    expect(clientSearchTerms("100%_x")).toEqual(["100\\%\\_x"]);
    expect(clientSearchTerms("")).toEqual([]);
  });
});

describe("acceso de administración", () => {
  it("comparación segura y límite de intentos", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
    let t = 0;
    const lim = createLoginLimiter({ maxFailures: 3, windowMs: 1000, now: () => t });
    lim.fail("ip"); lim.fail("ip");
    expect(lim.isBlocked("ip")).toBe(false);
    lim.fail("ip");
    expect(lim.isBlocked("ip")).toBe(true);
    t = 2000;
    expect(lim.isBlocked("ip")).toBe(false);
  });
  it("cookie de sesión httpOnly, lax y secure en producción", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(adminSessionCookieOptions()).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true });
  });
});
