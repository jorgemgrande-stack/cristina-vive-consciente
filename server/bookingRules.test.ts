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
import {
  isWeekend,
  slotsForDate,
  massagePageMeta,
  massagePlaceAnswer,
  whatsappContactMessage,
  homeServiceWhatsAppMessage,
  HOME_SERVICE_ON_REQUEST,
  MASSAGE_TIME_SLOTS as SLOTS,
} from "../shared/booking";

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

describe("horario de Cristina (shared/booking)", () => {
  it("detecta fin de semana sin depender de la zona horaria", () => {
    expect(isWeekend("2026-10-03")).toBe(true); // sábado
    expect(isWeekend("2026-10-04")).toBe(true); // domingo
    expect(isWeekend("2026-10-05")).toBe(false); // lunes
    expect(isWeekend("2026-10-09")).toBe(false); // viernes
  });
  it("entre semana: mañana y tarde; fin de semana: además mediodía", () => {
    expect(slotsForDate("2026-10-07")).toEqual(["morning", "afternoon", "any"]);
    expect(slotsForDate("2026-10-03")).toEqual(["morning", "midday", "afternoon", "any"]);
    expect(slotsForDate(undefined)).toEqual(["morning", "afternoon", "any"]);
  });
  it("las franjas coinciden con el horario facilitado", () => {
    expect(SLOTS.morning.start).toBe("10:00");
    expect(SLOTS.afternoon.start).toBe("16:00");
    expect(SLOTS.midday.start).toBe("13:00");
    expect(SLOTS.morning.label).toContain("10:00 – 13:00");
    expect(SLOTS.afternoon.label).toContain("16:00 – 19:00");
  });
});

import { bookableTimes, isBookableTime } from "../shared/booking";

describe("bookableTimes — horas fijas", () => {
  const NOW = Date.UTC(2026, 0, 1, 0, 0); // pasado: no filtra "hoy"
  it("entre semana: 10–13 y 16–19, cada 30 min, la sesión termina antes de cerrar (60 min)", () => {
    expect(bookableTimes("2099-07-15", 60, NOW)).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00", "16:00", "16:30", "17:00", "17:30", "18:00"]);
  });
  it("45 min: la última de la mañana es 12:00 (termina 12:45) y la de la tarde 18:00", () => {
    const t = bookableTimes("2099-07-15", 45, NOW);
    expect(t).toContain("12:00");
    expect(t).not.toContain("12:30");
    expect(t[t.length - 1]).toBe("18:00");
  });
  it("fin de semana: sin pausa del mediodía (10:00–19:00)", () => {
    const t = bookableTimes("2099-07-18", 60, NOW); // sábado
    expect(t).toContain("13:00");
    expect(t).toContain("14:30");
    expect(t[t.length - 1]).toBe("18:00");
  });
  it("hoy descarta las horas ya pasadas (hora de Madrid)", () => {
    const now = Date.UTC(2099, 6, 15, 8, 30); // 10:30 en Madrid (CEST)
    const t = bookableTimes("2099-07-15", 60, now);
    expect(t[0]).toBe("11:00");
    expect(isBookableTime("2099-07-15", "10:00", 60, now)).toBe(false);
  });
  it("fecha mal formada: sin horas", () => {
    expect(bookableTimes("15/07/2099")).toEqual([]);
  });
});

import { formatEuros } from "../shared/booking";

describe("formatEuros — precio de las tarjetas", () => {
  it("enteros sin decimales y con coma si hay céntimos; vacío si no es un número", () => {
    expect(formatEuros("80.00")).toBe("80 €");
    expect(formatEuros(110)).toBe("110 €");
    expect(formatEuros("72.5")).toBe("72,50 €");
    for (const v of [null, undefined, "", "abc"]) expect(formatEuros(v as any)).toBe("");
  });
});

describe("metadatos de la ficha de masaje", () => {
  const relajante = {
    name: "Masaje Relajante",
    shortDescription: "Un espacio de calma y desconexión para liberar las tensiones del día a día y disfrutar de una experiencia de bienestar corporal.",
    price: "70.00",
    durationLabel: "45 min",
  };

  it("título con servicio, lugar y precio reales", () => {
    expect(massagePageMeta(relajante).title).toBe("Masaje Relajante en Navas de Riofrío (Segovia) · 70 € | Cristina Vive Consciente");
  });

  it("descripción de 160 caracteres como máximo, con duración y precio", () => {
    const { description } = massagePageMeta(relajante);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain("45 min · 70 € en consulta.");
    expect(description.endsWith("Reserva online y paga el día de tu cita.")).toBe(true);
  });

  it("sin precio ni descripción no inventa datos", () => {
    const meta = massagePageMeta({ name: "Masaje", price: null });
    expect(meta.title).toBe("Masaje en Navas de Riofrío (Segovia) | Cristina Vive Consciente");
    expect(meta.description).toBe("Reserva online y paga el día de tu cita.");
  });
});

describe("mensaje del globo de WhatsApp", () => {
  it("nombra el servicio de la página, sin identificadores", () => {
    expect(whatsappContactMessage("Masaje Relajante")).toBe(
      "Hola Cristina, te escribo desde tu web, desde la página de Masaje Relajante. Me gustaría más información. 🌿",
    );
  });

  it("fuera de una ficha mantiene el mensaje genérico", () => {
    expect(whatsappContactMessage()).toBe("Hola Cristina, me gustaría obtener más información sobre tus servicios de bienestar. 🌿");
  });
});

describe("servicio a domicilio sin tarifa publicada", () => {
  it("la respuesta deja claro que se consulta por WhatsApp y que el formulario no lo reserva", () => {
    const a = massagePlaceAnswer({ homePrice: null });
    expect(a).toContain("En consulta, en Navas de Riofrío (Segovia).");
    expect(a).toContain("se consultan con Cristina por WhatsApp");
    expect(a).toContain("solo reserva sesiones en consulta");
  });

  it("con tarifa publicada mantiene el precio y no menciona la consulta por WhatsApp", () => {
    const a = massagePlaceAnswer({ homePrice: "100.00" });
    expect(a).toContain("100 €");
    expect(a).not.toContain(HOME_SERVICE_ON_REQUEST);
  });

  it("el mensaje para pedir domicilio nombra el servicio y no incluye datos personales", () => {
    expect(homeServiceWhatsAppMessage("Masaje Relajante")).toBe(
      "Hola Cristina, me interesa el Masaje Relajante a domicilio. ¿Me dices la tarifa y si tienes disponibilidad para mi zona? 🌿",
    );
  });
});
