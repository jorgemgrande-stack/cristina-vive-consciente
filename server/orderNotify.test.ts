import { afterEach, describe, expect, it } from "vitest";
import { __setMailTransportForTests, orderNotifyRecipients, sendOrderAdminEmail } from "./email";

describe("aviso de pedido nuevo a Cristina", () => {
  afterEach(() => { __setMailTransportForTests(null); delete process.env.ORDER_NOTIFY_EMAILS; });

  it("suma los destinatarios configurados al administrador, sin repetir ni aceptar basura", () => {
    expect(orderNotifyRecipients("a@x.es", "b@x.es, A@x.es; sin-arroba ,c@x.es")).toEqual(["a@x.es", "b@x.es", "c@x.es"]);
    expect(orderNotifyRecipients("", "b@x.es")).toEqual(["b@x.es"]);
    expect(orderNotifyRecipients("", "")).toEqual([]);
  });

  it("pedido impreso: el aviso lleva desglose, dirección y destinatarios", async () => {
    process.env.ORDER_NOTIFY_EMAILS = "cristinabattistelli@gmail.com";
    const sent: any[] = [];
    __setMailTransportForTests({ sendMail: async (o) => { sent.push(o); } });
    await sendOrderAdminEmail({
      reference: "T1234", customerName: "Ana Pérez", customerEmail: "ana@example.com", customerPhone: "600123456",
      productTitle: "Los cuatro regalos de la Tierra · Edición impresa", amountCents: 2000, printed: true, shippingCents: 450,
      shippingAddress: { street: "Calle Mayor 1", details: "2º B", postalCode: "40001", city: "Segovia", province: "Segovia", country: "España" },
    });
    expect(sent).toHaveLength(1);
    expect(String(sent[0].to)).toContain("cristinabattistelli@gmail.com");
    for (const body of [sent[0].html, sent[0].text]) {
      expect(body).toContain("20,00 €");
      expect(body).toContain("15,50 €");
      expect(body).toContain("4,50 €");
      expect(body).toContain("Calle Mayor 1, 2º B");
      expect(body).toContain("40001 Segovia");
    }
  });

  it("pedido digital: aviso sin datos de envío", async () => {
    process.env.ORDER_NOTIFY_EMAILS = "cristinabattistelli@gmail.com";
    const sent: any[] = [];
    __setMailTransportForTests({ sendMail: async (o) => { sent.push(o); } });
    await sendOrderAdminEmail({ reference: "T5678", customerName: "Luis", customerEmail: "l@example.com", productTitle: "Guía Digital del Agua", amountCents: 1200 });
    expect(sent[0].text).not.toContain("Envío a:");
    expect(sent[0].html).toContain("recibirá la guía");
  });
});
