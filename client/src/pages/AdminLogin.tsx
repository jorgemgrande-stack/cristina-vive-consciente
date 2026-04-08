import { useState } from "react";
import { useLocation } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/logo-bion-original_f6b56924.avif";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas");
      } else {
        navigate("/crm");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[oklch(0.97_0.006_85)] gap-8 px-4">
      <img src={LOGO_URL} alt="Cristina Vive Consciente" className="w-36 object-contain" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow-md p-8 flex flex-col gap-5"
      >
        <h1 className="text-xl font-serif text-[oklch(0.25_0.02_55)] text-center tracking-wide">
          Acceso al Panel
        </h1>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-[oklch(0.55_0.02_55)] font-body">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[oklch(0.88_0.01_85)] rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.08_148)]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-[oklch(0.55_0.02_55)] font-body">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[oklch(0.88_0.01_85)] rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.08_148)]"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center font-body">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body py-3 rounded-lg hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
