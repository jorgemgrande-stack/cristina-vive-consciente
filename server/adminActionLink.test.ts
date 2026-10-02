import { describe, it, expect } from "vitest";
import { signAdminActionToken, verifyAdminActionToken, buildAdminActionUrl, ADMIN_LINK_TTL_DAYS } from "./adminActionLink";

const SECRET = "secreto-de-prueba";
const NOW = Date.UTC(2099, 0, 1);

describe("adminActionLink — token firmado", () => {
  it("un token recién firmado se verifica y devuelve el id de la cita", () => {
    const t = signAdminActionToken(42, SECRET, NOW);
    expect(verifyAdminActionToken(t, SECRET, NOW + 1000)).toEqual({ appointmentId: 42 });
  });
  it("rechaza un token firmado con otro secreto", () => {
    expect(verifyAdminActionToken(signAdminActionToken(42, "otro", NOW), SECRET, NOW)).toBeNull();
  });
  it("rechaza si se cambia el id de la cita (no se puede usar el enlace de una cita para otra)", () => {
    const [, exp, sig] = signAdminActionToken(42, SECRET, NOW).split(".");
    expect(verifyAdminActionToken(`43.${exp}.${sig}`, SECRET, NOW)).toBeNull();
  });
  it("rechaza si se alarga la caducidad", () => {
    const [id, , sig] = signAdminActionToken(42, SECRET, NOW).split(".");
    expect(verifyAdminActionToken(`${id}.99999999999.${sig}`, SECRET, NOW)).toBeNull();
  });
  it("caduca a los 14 días", () => {
    const t = signAdminActionToken(42, SECRET, NOW);
    expect(verifyAdminActionToken(t, SECRET, NOW + (ADMIN_LINK_TTL_DAYS * 24 - 1) * 3600 * 1000)).not.toBeNull();
    expect(verifyAdminActionToken(t, SECRET, NOW + (ADMIN_LINK_TTL_DAYS * 24 + 1) * 3600 * 1000)).toBeNull();
  });
  it("rechaza basura y tokens sin secreto configurado", () => {
    for (const bad of ["", "abc", "1.2", "1.2.3.4", "x.y.z", "1".repeat(300)]) expect(verifyAdminActionToken(bad, SECRET, NOW)).toBeNull();
    expect(verifyAdminActionToken(signAdminActionToken(1, SECRET, NOW), "", NOW)).toBeNull();
  });
  it("sin secreto no se genera enlace; con secreto, apunta a /a/<token>", () => {
    expect(buildAdminActionUrl(1, undefined, "https://x.es", NOW)).toBeNull();
    expect(buildAdminActionUrl(1, "", "https://x.es", NOW)).toBeNull();
    expect(buildAdminActionUrl(7, SECRET, "https://x.es", NOW)).toMatch(/^https:\/\/x\.es\/a\/7\.\d+\.[\w-]+$/);
  });
});
