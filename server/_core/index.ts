import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeCheckoutCompleted } from "../routers/ebooks";
import { getPendingLeadSequences, updateLeadSequence, createAutomationLog, updateAutomationLog } from "../db";
import { sendLeadSequenceEmail } from "../email";
import { generateInvoicePdf } from "../invoicePdf";
import { sdk } from "./sdk";
import { uploadRouter } from "../upload";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Stripe Webhook (MUST be before express.json) ───────────────────────────
  // Stripe requires the raw body for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";

    if (!stripeKey) {
      return res.status(200).json({ received: true, note: "Stripe not configured" });
    }

    let event: any;
    try {
      const Stripe = require("stripe");
      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Webhook] Signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Test events — return immediately for verification
    if (event.id?.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    try {
      if (event.type === "checkout.session.completed") {
        await handleStripeCheckoutCompleted(event.data.object);
      }
    } catch (err) {
      console.error("[Webhook] Error processing event:", err);
      // Return 200 to avoid Stripe retries for processing errors
    }

    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Factura PDF ─────────────────────────────────────────────────────────────
  // GET /api/invoices/:id/pdf — descarga la factura como PDF (solo admin)
  app.get("/api/invoices/:id/pdf", async (req: any, res: any) => {
    try {
      // Verificar sesión usando el SDK (mismo mecanismo que tRPC)
      let user: any = null;
      try { user = await sdk.authenticateRequest(req); } catch {}
      if (!user || user.role !== "admin") {
        return res.status(401).json({ error: "No autorizado" });
      }
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
      const pdfBuffer = await generateInvoicePdf(id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="factura-${id}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (err: any) {
      console.error("[PDF] Error generating invoice PDF:", err);
      return res.status(500).json({ error: err.message ?? "Error generando PDF" });
    }
  });

  // File upload endpoint (admin only)
  app.use("/api/upload", uploadRouter);

  // ─── Admin Login / Logout ────────────────────────────────────────────────────
  app.post("/api/admin/login", async (req: any, res: any) => {
    const { email, password } = req.body ?? {};
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: "Credenciales de admin no configuradas" });
    }
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const OPEN_ID = "admin-local";
    const { upsertUser, getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    await upsertUser({ openId: OPEN_ID, name: "Admin", email: adminEmail, loginMethod: "password", lastSignedIn: new Date() });
    const db2 = await getDb();
    if (db2) await db2.update(users).set({ role: "admin" }).where(eq(users.openId, OPEN_ID));

    const appId = process.env.VITE_APP_ID || "local-dev";
    const token = await sdk.signSession({ openId: OPEN_ID, appId, name: "Admin" });
    res.cookie("app_session_id", token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365, path: "/" });
    return res.json({ ok: true });
  });

  app.post("/api/admin/logout", (_: any, res: any) => {
    res.clearCookie("app_session_id", { path: "/" });
    res.json({ ok: true });
  });

  // ─── Dev Login (solo desarrollo local) ──────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    app.get("/api/dev-login", async (req: any, res: any) => {
      const OPEN_ID = "admin-local";
      const { upsertUser, getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await upsertUser({ openId: OPEN_ID, name: "Admin", email: "admin@local.dev", loginMethod: "dev", lastSignedIn: new Date() });
      const db2 = await getDb();
      if (db2) await db2.update(users).set({ role: "admin" }).where(eq(users.openId, OPEN_ID));
      const token = await sdk.signSession({ openId: OPEN_ID, appId: "local-dev", name: "Admin" });
      res.cookie("app_session_id", token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365, path: "/" });
      res.redirect("/crm");
    });
  }

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // ─── Scheduler: procesar secuencias de emails pendientes cada hora ──────────
  setInterval(async () => {
    try {
      const pending = await getPendingLeadSequences();
      if (pending.length === 0) return;
      console.log(`[Scheduler] Processing ${pending.length} pending lead sequences...`);

      for (const seq of pending) {
        const step = seq.sequenceStep as 1 | 2 | 3;
        const firstName = seq.clientName.split(" ")[0];
        const logId = await createAutomationLog({
          event: `lead_sequence_${step}` as "lead_sequence_1" | "lead_sequence_2" | "lead_sequence_3",
          channel: "email",
          recipientEmail: seq.clientEmail,
          clientId: seq.clientId,
          subject: `Secuencia lead paso ${step}`,
          status: "pending",
        });
        try {
          await sendLeadSequenceEmail(step, { email: seq.clientEmail, firstName });
          await updateLeadSequence(seq.id, { status: "sent", sentAt: Date.now() });
          await updateAutomationLog(logId, { status: "sent", sentAt: Date.now() });
          console.log(`[Scheduler] Sent sequence step ${step} to ${seq.clientEmail}`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          await updateLeadSequence(seq.id, { status: "failed", errorMessage });
          await updateAutomationLog(logId, { status: "failed", errorMessage });
          console.error(`[Scheduler] Failed to send sequence step ${step} to ${seq.clientEmail}:`, errorMessage);
        }
      }
    } catch (err) {
      console.error("[Scheduler] Error processing sequences:", err);
    }
  }, 60 * 60 * 1000); // cada hora
}

startServer().catch(console.error);
