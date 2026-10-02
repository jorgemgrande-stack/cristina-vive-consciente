/**
 * Tests del flujo público de solicitud de cita (bookings.request) y de las acciones del admin
 * (crm.appointments.*). Sin BD ni red: se simulan db, email, whatsapp y notificaciones.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const MASSAGE_RELAX = {
  id: 11,
  slug: "masaje_relajante_navas_de_rio_frio_segovia",
  name: "Masaje Relajante",
  type: "masaje",
  price: "70.00",
  durationMinutes: 45,
  durationLabel: "45 min",
  modality: "presencial",
  status: "active",
};
const MASSAGE_THERAPEUTIC = {
  id: 7,
  slug: "masaje_terapeutico_navas_de_rio_frio_segovia",
  name: "Masaje Terapéutico 60 min",
  type: "masaje",
  price: "80.00",
  durationMinutes: 60,
  durationLabel: "60 min",
  modality: "ambos",
  status: "active",
};
const CONSULTA = {
  id: 2,
  slug: "consulta_naturopata",
  name: "Consulta Naturópata",
  type: "consulta",
  price: "90.00",
  durationMinutes: 60,
  durationLabel: "Mínimo 60 min",
  modality: "ambos",
  status: "active",
};
const SERVICES: Record<string, any> = {
  [MASSAGE_RELAX.slug]: MASSAGE_RELAX,
  [MASSAGE_THERAPEUTIC.slug]: MASSAGE_THERAPEUTIC,
  [CONSULTA.slug]: CONSULTA,
};

const db = vi.hoisted(() => ({
  createClient: vi.fn(async () => 1),
  createAppointment: vi.fn(async () => ({ insertId: 99 })),
  findClientByEmail: vi.fn(async () => undefined as any),
  getAppointmentByRescheduleToken: vi.fn(),
  getAppointmentById: vi.fn(),
  updateAppointment: vi.fn(async () => undefined),
  getServiceBySlug: vi.fn(),
  findOpenDuplicateAppointment: vi.fn(async () => undefined as any),
  logAppointmentEvent: vi.fn(async () => undefined),
  getAppointmentEvents: vi.fn(async () => ({ available: true, events: [] })),
}));
vi.mock("./db", () => db);

const mail = vi.hoisted(() => ({
  isEmailConfigured: vi.fn(() => true),
  isAdminEmailConfigured: vi.fn(() => true),
  sendClientConfirmationEmail: vi.fn(async () => undefined),
  sendAdminNotificationEmail: vi.fn(async () => undefined),
  sendAdminSlotSelectedEmail: vi.fn(async () => undefined),
  sendAppointmentAcceptedEmail: vi.fn(async () => undefined),
  sendAppointmentAcceptedAdminEmail: vi.fn(async () => undefined),
  sendAppointmentCancelledEmail: vi.fn(async () => undefined),
  sendAppointmentCancelledAdminEmail: vi.fn(async () => undefined),
  sendRescheduleProposalEmail: vi.fn(async () => undefined),
  sendInvoiceEmail: vi.fn(),
}));
vi.mock("./email", () => mail);
vi.mock("./whatsapp", () => ({
  notifyAdminNewBooking: vi.fn(async () => ({ sent: false, waUrl: "x", note: "" })),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => {
    throw new Error("Notification service URL is not configured.");
  }),
}));
vi.mock("./invoicePdf", () => ({ generateInvoicePdf: vi.fn() }));

import { bookingsRouter } from "./routers/bookings";
import { crmRouter } from "./routers/crm";
import { todayInMadrid } from "./bookingRules";

const futureDate = () => {
  const d = new Date(Date.now() + 10 * 86400000);
  return todayInMadrid(d.getTime());
};

const publicCaller = () => bookingsRouter.createCaller({ user: null, req: {}, res: {} } as any);
const adminCaller = () => crmRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any);
const userCaller = () => crmRouter.createCaller({ user: { id: 2, role: "user" }, req: {}, res: {} } as any);

const baseInput = (over: Record<string, unknown> = {}) => ({
  firstName: "Ana",
  lastName: "García",
  email: "Ana@Example.com",
  phone: "600111222",
  serviceType: MASSAGE_RELAX.slug,
  preferredDate: futureDate(),
  timeSlot: "afternoon" as const,
  modality: "presencial" as const,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.getServiceBySlug.mockImplementation(async (slug: string) => SERVICES[slug] ?? null);
  db.findClientByEmail.mockResolvedValue(undefined);
  db.findOpenDuplicateAppointment.mockResolvedValue(undefined);
  db.createAppointment.mockResolvedValue({ insertId: 99 });
  mail.isEmailConfigured.mockReturnValue(true);
  mail.isAdminEmailConfigured.mockReturnValue(true);
});

describe("bookings.request — masajes", () => {
  it("acepta el slug real del Masaje Relajante y crea una cita PENDIENTE (no confirmada)", async () => {
    const res = await publicCaller().request(baseInput());
    expect(res.success).toBe(true);
    expect(res.status).toBe("pending");
    expect(res.message).toMatch(/pendiente de confirmación/i);

    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    expect(created.status).toBe("pending");
    expect(created.serviceType).toBe("masaje");
    expect(created.serviceLabel).toBe("Masaje Relajante — 45 min");
    expect(created.durationMinutes).toBe(45);
    expect(created.price).toBe("70.00");
    expect(created.modality).toBe("presencial");
    expect(created.internalNotes).toContain("Franja preferida: Tarde");
  });

  it("el botón de WhatsApp de la confirmación apunta al número de Cristina (+34 657 165 343), no a un relleno", async () => {
    const res = await publicCaller().request(baseInput());
    expect(res.whatsappUrl).toContain("https://wa.me/34657165343?text=");
    expect(res.whatsappUrl).not.toContain("34600000000");
  });

  it("acepta el slug real del Masaje Terapéutico y no se mezcla con el Relajante", async () => {
    await publicCaller().request(baseInput({ serviceType: MASSAGE_THERAPEUTIC.slug }));
    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    expect(created.serviceLabel).toBe("Masaje Terapéutico 60 min");
    expect(created.durationMinutes).toBe(60);
    expect(created.price).toBe("80.00");
  });

  it("guarda la franja como hora de Madrid (tarde = 16:00 Madrid)", async () => {
    await publicCaller().request(baseInput({ preferredDate: "2099-07-15", timeSlot: "afternoon" }));
    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    expect(new Date(created.scheduledAt).toISOString()).toBe("2099-07-15T14:00:00.000Z"); // CEST = UTC+2
  });

  it("rechaza Zoom, teléfono o WhatsApp para un masaje", async () => {
    for (const modality of ["zoom", "telefono", "whatsapp"] as const) {
      await expect(publicCaller().request(baseInput({ modality }))).rejects.toThrow(/presencial/i);
    }
    expect(db.createAppointment).not.toHaveBeenCalled();
  });

  it("rechaza fechas pasadas y servicios inexistentes o inactivos", async () => {
    await expect(publicCaller().request(baseInput({ preferredDate: "2020-01-01" }))).rejects.toThrow(/pasado/i);
    await expect(publicCaller().request(baseInput({ serviceType: "servicio_que_no_existe" }))).rejects.toThrow(/no válido/i);
    db.getServiceBySlug.mockResolvedValueOnce({ ...MASSAGE_RELAX, status: "inactive" });
    await expect(publicCaller().request(baseInput())).rejects.toThrow(/no está disponible/i);
    expect(db.createAppointment).not.toHaveBeenCalled();
  });

  it("evita duplicados: misma persona + servicio + día con solicitud abierta", async () => {
    db.findOpenDuplicateAppointment.mockResolvedValueOnce({ id: 50 });
    const res = await publicCaller().request(baseInput());
    expect(res.success).toBe(true);
    expect((res as any).duplicate).toBe(true);
    expect(db.createAppointment).not.toHaveBeenCalled();
    expect(mail.sendClientConfirmationEmail).not.toHaveBeenCalled();
  });

  it("registra el alta y el resultado de cada notificación (enviada / no enviada)", async () => {
    await publicCaller().request(baseInput());
    await new Promise((r) => setTimeout(r, 20));
    const events = (db.logAppointmentEvent.mock.calls as any[][]).map((c) => c[0]);
    expect(events.find((e) => e.type === "request_submitted")?.appointmentId).toBe(99);
    const notif = events.filter((e) => e.type === "notification");
    expect(notif.find((e) => e.channel === "email" && e.audience === "client")?.result).toBe("sent");
    expect(notif.find((e) => e.channel === "whatsapp")?.result).toBe("skipped");
    expect(notif.find((e) => e.channel === "owner")?.result).toBe("skipped"); // servicio sin configurar
  });

  it("marca como FALLIDA la notificación cuando el envío da error", async () => {
    mail.sendClientConfirmationEmail.mockRejectedValueOnce(new Error("SMTP caído"));
    await publicCaller().request(baseInput());
    await new Promise((r) => setTimeout(r, 20));
    const events = (db.logAppointmentEvent.mock.calls as any[][]).map((c) => c[0]);
    const failed = events.find((e) => e.type === "notification" && e.channel === "email" && e.audience === "client");
    expect(failed.result).toBe("failed");
    expect(failed.detail).toContain("SMTP caído");
  });

  it("si no hay SMTP, lo registra como omitida (no como enviada)", async () => {
    mail.isEmailConfigured.mockReturnValue(false);
    await publicCaller().request(baseInput());
    await new Promise((r) => setTimeout(r, 20));
    const events = (db.logAppointmentEvent.mock.calls as any[][]).map((c) => c[0]);
    expect(events.find((e) => e.channel === "email" && e.audience === "client")?.result).toBe("skipped");
    expect(mail.sendClientConfirmationEmail).not.toHaveBeenCalled();
  });
});

describe("bookings.request — consultas (sin cambios de comportamiento)", () => {
  it("una consulta sigue admitiendo Zoom y hora exacta", async () => {
    await publicCaller().request({
      firstName: "Luis",
      lastName: "Pérez",
      email: "luis@example.com",
      serviceType: CONSULTA.slug,
      preferredDate: futureDate(),
      preferredTime: "11:30",
      modality: "zoom",
    });
    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    expect(created.serviceType).toBe("consulta_naturopata");
    expect(created.modality).toBe("zoom");
    expect(created.status).toBe("pending");
  });
});

describe("crm.appointments — acciones del admin", () => {
  const row = (status: string) => ({
    appointment: { id: 5, status, serviceType: "masaje", serviceLabel: "Masaje Relajante — 45 min", scheduledAt: Date.now() + 86400000, modality: "presencial" },
    client: { id: 1, firstName: "Ana", lastName: "García", email: "ana@example.com", phone: "600111222" },
  });

  it("confirmar una solicitud pendiente: cambia a confirmed, registra el cambio y notifica", async () => {
    db.getAppointmentById.mockResolvedValue(row("pending"));
    await adminCaller().appointments.accept({ id: 5 });
    expect(db.updateAppointment).toHaveBeenCalledWith(5, { status: "confirmed" });
    await new Promise((r) => setTimeout(r, 20));
    const events = (db.logAppointmentEvent.mock.calls as any[][]).map((c) => c[0]);
    expect(events.find((e) => e.type === "status_changed")).toMatchObject({ fromStatus: "pending", toStatus: "confirmed", actorUserId: 1 });
    expect(events.find((e) => e.type === "notification" && e.audience === "client")?.result).toBe("sent");
  });

  it("no se puede confirmar dos veces ni confirmar una cita cancelada", async () => {
    for (const st of ["confirmed", "cancelled", "completed", "rescheduled"]) {
      db.getAppointmentById.mockResolvedValue(row(st));
      await expect(adminCaller().appointments.accept({ id: 5 })).rejects.toThrow(/ya está/);
    }
    expect(db.updateAppointment).not.toHaveBeenCalled();
  });

  it("rechazar con motivo: cancelled + historial; no se puede cancelar lo ya cancelado o completado", async () => {
    db.getAppointmentById.mockResolvedValue(row("pending"));
    await adminCaller().appointments.cancelWithReason({ id: 5, reason: "No hay hueco ese día" });
    expect(db.updateAppointment).toHaveBeenCalledWith(5, { status: "cancelled", cancellationReason: "No hay hueco ese día" });
    for (const st of ["cancelled", "completed"]) {
      db.getAppointmentById.mockResolvedValue(row(st));
      await expect(adminCaller().appointments.cancelWithReason({ id: 5, reason: "x" })).rejects.toThrow(/ya está/);
    }
  });

  it("proponer otra fecha: rescheduled con token; rechaza fechas pasadas", async () => {
    db.getAppointmentById.mockResolvedValue(row("pending"));
    await expect(adminCaller().appointments.proposeSlots({ id: 5, slots: [{ date: "2020-01-01", time: "10:00" }] })).rejects.toThrow(/pasado/i);
    const res = await adminCaller().appointments.proposeSlots({ id: 5, slots: [{ date: futureDate(), time: "10:00" }] });
    expect(res.token).toMatch(/^[0-9a-f]{48}$/);
    expect(db.updateAppointment).toHaveBeenCalledWith(5, expect.objectContaining({ status: "rescheduled" }));
  });

  it("los usuarios sin rol admin no pueden gestionar citas (permisos intactos)", async () => {
    await expect(userCaller().appointments.accept({ id: 5 })).rejects.toThrow(/administradores/i);
    await expect(userCaller().appointments.events({ id: 5 })).rejects.toThrow(/administradores/i);
    await expect(userCaller().appointments.list({})).rejects.toThrow(/administradores/i);
  });
});

describe("bookings.selectSlot — el cliente elige una fecha propuesta", () => {
  it("vuelve a PENDIENTE (no confirma), con hora de Madrid, y avisa a Cristina", async () => {
    db.getAppointmentByRescheduleToken.mockResolvedValue({
      appointment: {
        id: 5,
        status: "rescheduled",
        serviceType: "masaje",
        serviceLabel: "Masaje Relajante — 45 min",
        modality: "presencial",
        proposedSlots: JSON.stringify([{ date: "2099-07-15", time: "10:00" }]),
      },
      client: { firstName: "Ana", lastName: "García", email: "ana@example.com", phone: null },
    });
    await publicCaller().selectSlot({ token: "tok", slotIndex: 0 });
    const upd = (db.updateAppointment.mock.calls as any[][])[0][1];
    expect(upd.status).toBe("pending");
    expect(new Date(upd.scheduledAt).toISOString()).toBe("2099-07-15T08:00:00.000Z"); // 10:00 Madrid (CEST)
    expect(upd.rescheduleToken).toBeNull();
    await new Promise((r) => setTimeout(r, 20));
    expect(mail.sendAdminSlotSelectedEmail).toHaveBeenCalled();
  });

  it("un enlace ya usado (cita no reprogramada) se rechaza", async () => {
    db.getAppointmentByRescheduleToken.mockResolvedValue({ appointment: { id: 5, status: "pending", proposedSlots: null }, client: null });
    await expect(publicCaller().selectSlot({ token: "tok", slotIndex: 0 })).rejects.toThrow(/ya no está disponible/);
  });
});

// ─── Horario de Cristina y servicio a domicilio ──────────────────────────────

/** Próxima fecha (a partir de +3 días) que cae en el día de la semana pedido (0 = domingo … 6 = sábado). */
const nextDow = (dow: number) => {
  for (let i = 3; i < 12; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const iso = todayInMadrid(d.getTime());
    if (new Date(`${iso}T12:00:00Z`).getUTCDay() === dow) return iso;
  }
  throw new Error("sin fecha");
};

describe("bookings.request — horario de Cristina", () => {
  it("entre semana: la mañana se guarda a las 10:00 y la tarde a las 16:00 (hora de Madrid)", async () => {
    const date = nextDow(3); // miércoles
    await publicCaller().request(baseInput({ preferredDate: date, timeSlot: "morning" }));
    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    const madridHour = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(created.scheduledAt);
    expect(madridHour).toBe("10:00");
  });

  it("entre semana no existe la franja de mediodía (13:00–16:00)", async () => {
    await expect(publicCaller().request(baseInput({ preferredDate: nextDow(2), timeSlot: "midday" }))).rejects.toThrow(/no está disponible/i);
    expect(db.createAppointment).not.toHaveBeenCalled();
  });

  it("sábado y domingo (10:00–19:00): admiten mañana, mediodía y tarde", async () => {
    for (const dow of [6, 0]) {
      for (const timeSlot of ["morning", "midday", "afternoon"] as const) {
        db.createAppointment.mockClear();
        db.findOpenDuplicateAppointment.mockResolvedValue(undefined);
        await publicCaller().request(baseInput({ preferredDate: nextDow(dow), timeSlot, email: `fin${dow}${timeSlot}@example.com` }));
        expect(db.createAppointment).toHaveBeenCalledTimes(1);
      }
    }
  });
});

describe("bookings.request — servicio a domicilio", () => {
  const home = (over: Record<string, unknown> = {}) =>
    baseInput({ serviceLocation: "domicilio", serviceAddress: "Calle Mayor 5, Segovia", ...over });

  it("Masaje Relajante a domicilio: 100 €, etiqueta y dirección en la cita; modalidad sigue siendo presencial", async () => {
    await publicCaller().request(home());
    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    expect(created.serviceLabel).toBe("Masaje Relajante — 45 min · a domicilio");
    expect(created.price).toBe("100.00");
    expect(created.modality).toBe("presencial");
    expect(created.internalNotes).toContain("Servicio a domicilio (100 €)");
    expect(created.internalNotes).toContain("Calle Mayor 5, Segovia");
  });

  it("Masaje Terapéutico a domicilio: 110 €", async () => {
    await publicCaller().request(home({ serviceType: MASSAGE_THERAPEUTIC.slug }));
    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    expect(created.price).toBe("110.00");
    expect(created.serviceLabel).toBe("Masaje Terapéutico 60 min · a domicilio");
  });

  it("en consulta conserva el precio de siempre (70 € / 80 €)", async () => {
    await publicCaller().request(baseInput());
    expect((db.createAppointment.mock.calls as any[][])[0][0].price).toBe("70.00");
  });

  it("exige dirección para el domicilio", async () => {
    await expect(publicCaller().request(home({ serviceAddress: "" }))).rejects.toThrow(/dirección/i);
    await expect(publicCaller().request(home({ serviceAddress: "abc" }))).rejects.toThrow(/dirección/i);
    expect(db.createAppointment).not.toHaveBeenCalled();
  });

  it("no ofrece domicilio en servicios sin tarifa a domicilio (consultas, Terapéutico 90 min)", async () => {
    db.getServiceBySlug.mockImplementation(async (slug: string) =>
      slug === "masaje_terapeutico_90_min" ? { ...MASSAGE_THERAPEUTIC, slug, name: "Masaje Terapéutico 90 min", price: "120.00", durationMinutes: 90, durationLabel: "90 min" } : SERVICES[slug] ?? null);
    await expect(publicCaller().request(home({ serviceType: "masaje_terapeutico_90_min" }))).rejects.toThrow(/no se ofrece a domicilio/i);
    await expect(publicCaller().request(home({ serviceType: CONSULTA.slug, modality: "zoom" }))).rejects.toThrow(/no se ofrece a domicilio/i);
    expect(db.createAppointment).not.toHaveBeenCalled();
  });

  it("consulta y domicilio del mismo día son solicitudes distintas (no se marcan como duplicado)", async () => {
    await publicCaller().request(home());
    const labels = (db.findOpenDuplicateAppointment.mock.calls as any[][]).map((c) => c[1]);
    expect(labels).toEqual(["Masaje Relajante — 45 min · a domicilio"]);
  });
});

describe("bookings.request — hora fija en masajes", () => {
  const madridTime = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);

  it("guarda la hora elegida (hora de Madrid) y no una franja", async () => {
    await publicCaller().request(baseInput({ preferredDate: nextDow(3), timeSlot: undefined, preferredTime: "11:30" }));
    const created = (db.createAppointment.mock.calls as any[][])[0][0];
    expect(madridTime(created.scheduledAt)).toBe("11:30");
  });

  it("rechaza una hora fuera de horario (entre semana, 14:00)", async () => {
    await expect(
      publicCaller().request(baseInput({ preferredDate: nextDow(2), timeSlot: undefined, preferredTime: "14:00" })),
    ).rejects.toThrow(/no está disponible/i);
    expect(db.createAppointment).not.toHaveBeenCalled();
  });

  it("rechaza una hora cuya sesión terminaría después de cerrar (relajante 45 min a las 12:30)", async () => {
    await expect(
      publicCaller().request(baseInput({ preferredDate: nextDow(2), timeSlot: undefined, preferredTime: "12:30" })),
    ).rejects.toThrow(/no está disponible/i);
  });

  it("un masaje sin hora ni franja se rechaza", async () => {
    await expect(publicCaller().request(baseInput({ preferredDate: nextDow(3), timeSlot: undefined }))).rejects.toThrow(/hora/i);
  });
});
