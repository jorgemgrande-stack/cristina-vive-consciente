import { describe, it, expect } from "vitest";
import {
  madridLocalToEpoch,
  todayInMadrid,
  validateRequestedDate,
  resolveAppointmentServiceType,
  allowedModalities,
  buildServiceLabel,
  canTransition,
  ACCEPTABLE_FROM,
  CANCELLABLE_FROM,
  MASSAGE_TIME_SLOTS,
} from "./bookingRules";

describe("madridLocalToEpoch", () => {
  it("verano (CEST, UTC+2): 10:00 en Madrid = 08:00 UTC", () => {
    expect(new Date(madridLocalToEpoch("2026-07-15", "10:00")).toISOString()).toBe("2026-07-15T08:00:00.000Z");
  });
  it("invierno (CET, UTC+1): 10:00 en Madrid = 09:00 UTC", () => {
    expect(new Date(madridLocalToEpoch("2026-01-15", "10:00")).toISOString()).toBe("2026-01-15T09:00:00.000Z");
  });
  it("respeta el cambio de hora (último domingo de octubre 2026 = día 25)", () => {
    expect(new Date(madridLocalToEpoch("2026-10-24", "12:00")).toISOString()).toBe("2026-10-24T10:00:00.000Z");
    expect(new Date(madridLocalToEpoch("2026-10-26", "12:00")).toISOString()).toBe("2026-10-26T11:00:00.000Z");
  });
  it("formato inválido → NaN", () => {
    expect(madridLocalToEpoch("15/07/2026", "10:00")).toBeNaN();
    expect(madridLocalToEpoch("2026-07-15", "10h")).toBeNaN();
    expect(madridLocalToEpoch("2026-13-15", "10:00")).toBeNaN();
  });
});

describe("validateRequestedDate", () => {
  const now = Date.UTC(2026, 9, 2, 22, 30); // 2 oct 22:30 UTC = 3 oct 00:30 en Madrid
  it("usa el día de Madrid, no el de UTC", () => {
    expect(todayInMadrid(now)).toBe("2026-10-03");
    expect(validateRequestedDate("2026-10-02", now)).toMatch(/pasado/);
    expect(validateRequestedDate("2026-10-03", now)).toBeNull();
  });
  it("rechaza fechas mal formadas", () => {
    expect(validateRequestedDate("mañana", now)).toBe("Fecha no válida");
  });
});

describe("resolveAppointmentServiceType", () => {
  it("cualquier masaje (slug libre) se guarda como masaje", () => {
    expect(resolveAppointmentServiceType({ slug: "masaje_relajante_navas_de_rio_frio_segovia", type: "masaje" })).toBe("masaje");
    expect(resolveAppointmentServiceType({ slug: "masaje_terapeutico_90_min", type: "masaje" })).toBe("masaje");
    expect(resolveAppointmentServiceType({ slug: "masaje" })).toBe("masaje");
  });
  it("las consultas conservan su slug si está en el enum", () => {
    expect(resolveAppointmentServiceType({ slug: "consulta_naturopata", type: "consulta" })).toBe("consulta_naturopata");
  });
  it("un servicio desconocido cae en otro", () => {
    expect(resolveAppointmentServiceType({ slug: "servicio_nuevo", type: "otro" })).toBe("otro");
  });
});

describe("modalidades", () => {
  it("un masaje solo admite presencial (nada de Zoom/teléfono/WhatsApp)", () => {
    expect(allowedModalities("masaje")).toEqual(["presencial"]);
  });
  it("las consultas siguen admitiendo las 4", () => {
    expect(allowedModalities("consulta_naturopata")).toHaveLength(4);
  });
});

describe("buildServiceLabel", () => {
  it("añade la duración sin duplicarla", () => {
    expect(buildServiceLabel("Masaje Relajante", "45 min")).toBe("Masaje Relajante — 45 min");
    expect(buildServiceLabel("Masaje Terapéutico 60 min", "60 min")).toBe("Masaje Terapéutico 60 min");
    expect(buildServiceLabel("Biohabitabilidad", null, null)).toBe("Biohabitabilidad");
  });
});

describe("transiciones de estado", () => {
  it("solo una solicitud pendiente se puede aceptar", () => {
    expect(canTransition("pending", ACCEPTABLE_FROM)).toBe(true);
    for (const s of ["confirmed", "completed", "cancelled", "rescheduled"] as const) {
      expect(canTransition(s, ACCEPTABLE_FROM)).toBe(false);
    }
  });
  it("una cita completada o ya cancelada no se puede cancelar", () => {
    expect(canTransition("completed", CANCELLABLE_FROM)).toBe(false);
    expect(canTransition("cancelled", CANCELLABLE_FROM)).toBe(false);
    expect(canTransition("confirmed", CANCELLABLE_FROM)).toBe(true);
  });
});

describe("franjas de masaje", () => {
  it("tienen una hora de referencia válida", () => {
    for (const s of Object.values(MASSAGE_TIME_SLOTS)) expect(s.start).toMatch(/^\d{2}:\d{2}$/);
  });
});
