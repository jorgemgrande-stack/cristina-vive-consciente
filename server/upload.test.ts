/**
 * POST /api/upload: los PDF deben aceptarse aunque el navegador/Windows declare otro tipo MIME
 * (application/x-pdf, octet-stream...), y los rechazos deben ser JSON legible (no HTML → «Error desconocido»).
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import os from "os";
import fs from "fs";
import path from "path";
import type { Server } from "http";

const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvc-upload-"));
vi.hoisted(() => {
  process.env.JWT_SECRET = "secreto-de-prueba";
});
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn(async () => ({ role: "admin" })) } }));
vi.mock("./storage", () => ({
  getUploadDir: () => uploadDir,
  storagePut: async (key: string, data: Buffer) => {
    const f = path.join(uploadDir, key);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, data);
    return { key, url: `/uploads/${key}` };
  },
}));

let server: Server;
let base = "";

beforeAll(async () => {
  const { uploadRouter } = await import("./upload");
  const app = express();
  app.use("/api/upload", uploadRouter);
  await new Promise<void>((ok) => {
    server = app.listen(0, () => ok());
  });
  base = `http://127.0.0.1:${(server.address() as any).port}/api/upload`;
});
afterAll(() => {
  server.close();
  fs.rmSync(uploadDir, { recursive: true, force: true });
});

const PDF = Buffer.from("%PDF-1.7\n%test\n%%EOF");
async function send(name: string, type: string, data: Buffer = PDF) {
  const fd = new FormData();
  fd.append("file", new Blob([data], { type }), name);
  const res = await fetch(base, { method: "POST", body: fd });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* no JSON */
  }
  return { status: res.status, json, text };
}

describe("subida de archivos del CRM", () => {
  it.each([
    ["application/pdf"],
    ["application/x-pdf"],
    ["application/acrobat"],
    ["application/octet-stream"],
    [""],
  ])("acepta un .pdf declarado como «%s»", async (type) => {
    const r = await send("guia.pdf", type);
    expect(r.status).toBe(200);
    expect(r.json.url).toMatch(/\.pdf$/);
  });

  it("acepta imágenes", async () => {
    const r = await send("a.png", "image/png", Buffer.from("x"));
    expect(r.status).toBe(200);
  });

  it("rechaza tipos no permitidos con JSON legible", async () => {
    const r = await send("virus.exe", "application/x-msdownload", Buffer.from("MZ"));
    expect(r.status).toBe(400);
    expect(r.json?.error).toMatch(/no permitido/i);
  });

  it("no acepta un .exe disfrazado de octet-stream", async () => {
    const r = await send("virus.exe", "application/octet-stream", Buffer.from("MZ"));
    expect(r.status).toBe(400);
    expect(r.json?.error).toBeTruthy();
  });

  it("un PDF de 60 MB (como la guía original del agua) se acepta", async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(60 * 1024 * 1024, 1)]);
    const r = await send("guia-grande.pdf", "application/pdf", big);
    expect(r.status).toBe(200);
  });

  it("una imagen de más de 20 MB da JSON 413", async () => {
    const big = Buffer.alloc(21 * 1024 * 1024, 1);
    const r = await send("grande.png", "image/png", big);
    expect(r.status).toBe(413);
    expect(r.json?.error).toMatch(/20 MB/);
  });
});
