/**
 * HomeMasajes — módulo de la Home con las cajas de los masajes activos.
 * Misma estructura que el resto de módulos: cabecera (etiqueta + título + línea + texto) y rejilla de
 * tarjetas `card-natural` (imagen 16/9 con etiqueta, título, texto, enlace). Los datos salen de la tabla
 * `services` (type = masaje, activos), así que si Cristina añade, oculta o edita un masaje desde el CRM
 * la Home se actualiza sola. Los precios y el lugar usan las mismas reglas que /masajes.
 */
import { Link } from "wouter";
import { ChevronRight, Clock, Leaf, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SITE_IMAGES } from "@/lib/siteImages";
import { getHomePrice, massagePlaceLabel } from "@shared/booking";

/** "70.00" → "70"; "72.50" → "72,50" */
function formatEuro(price?: string | number | null): string | null {
  if (price == null || price === "") return null;
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

export default function HomeMasajes() {
  const { data: services = [], isLoading } = trpc.services.list.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const masajes = services.filter((s) => s.type === "masaje");

  // Sin masajes activos (o cargando) el módulo no ocupa espacio
  if (isLoading || masajes.length === 0) return null;

  const cols = masajes.length >= 3 ? "lg:grid-cols-3" : masajes.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-xl";

  return (
    <section className="section-padding bg-[oklch(0.94_0.012_80)]" aria-labelledby="home-masajes-title">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-lg mb-16">
          <p
            className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body"
            style={{ fontWeight: 500 }}
          >
            Masajes
          </p>
          <h2 id="home-masajes-title" className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
            Masajes en Navas de Riofrío
          </h2>
          <div className="section-divider" />
          <p className="text-[oklch(0.52_0.02_60)] leading-relaxed font-body mt-4" style={{ fontWeight: 300 }}>
            Elige tu masaje y solicita tu cita: Cristina la confirma contigo personalmente.
          </p>
        </div>

        {/* Masajes Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-6 lg:gap-8`}>
          {masajes.map((m) => {
            const price = formatEuro(m.price);
            const home = getHomePrice(m);
            return (
              <Link
                key={m.slug}
                href={`/masajes/${m.slug}`}
                className="group card-natural overflow-hidden flex flex-col no-underline"
                style={{ textDecoration: "none" }}
              >
                {/* Image */}
                <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: "16/9" }}>
                  {m.imageUrl ? (
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      loading="lazy"
                      onError={(e) => {
                        // Si la foto subida ya no existe, se muestra la imagen fija de masajes (nunca una imagen rota)
                        const img = e.currentTarget;
                        if (!img.src.endsWith(SITE_IMAGES.heroMasajes)) img.src = SITE_IMAGES.heroMasajes;
                      }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={SITE_IMAGES.heroMasajes}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.018_55)]/40 to-transparent" />
                  {/* Tag */}
                  <span
                    className="absolute top-4 left-4 px-3 py-1 bg-[oklch(0.985_0.006_85)]/90 text-[oklch(0.52_0.08_148)] text-[0.65rem] tracking-widest uppercase font-body"
                    style={{ fontWeight: 500, letterSpacing: "0.12em" }}
                  >
                    {m.durationLabel ?? (m.durationMinutes ? `${m.durationMinutes} min` : "Masaje")}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <h3
                    className="font-display text-[oklch(0.18_0.018_55)] mb-2 group-hover:text-[oklch(0.52_0.08_148)] transition-colors duration-300"
                    style={{ fontWeight: 400, fontSize: "1.25rem" }}
                  >
                    {m.name}
                  </h3>
                  {m.shortDescription && (
                    <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
                      {m.shortDescription}
                    </p>
                  )}

                  <div className="mt-auto">
                    {/* Chips: lugar y duración */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.42_0.02_55)] bg-[oklch(0.94_0.012_80)] px-2 py-1 font-body">
                        <MapPin size={9} className="text-[oklch(0.52_0.08_148)]" />
                        {massagePlaceLabel(m)}
                      </span>
                      {m.durationLabel && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.42_0.02_55)] bg-[oklch(0.94_0.012_80)] px-2 py-1 font-body">
                          <Clock size={9} className="text-[oklch(0.52_0.08_148)]" />
                          {m.durationLabel}
                        </span>
                      )}
                    </div>

                    {/* Precios: protagonistas de la tarjeta */}
                    {(price || home !== null) && (
                      <div
                        className="flex items-end gap-x-8 gap-y-3 flex-wrap mb-5 py-4 border-y border-[oklch(0.52_0.08_148)]/20"
                        aria-label={`Precios de ${m.name}`}
                      >
                        {price && (
                          <div>
                            <p
                              className="text-[oklch(0.52_0.02_60)] text-[0.65rem] tracking-[0.15em] uppercase font-body mb-1"
                              style={{ fontWeight: 500 }}
                            >
                              En consulta
                            </p>
                            <p
                              className="font-display text-[oklch(0.52_0.08_148)] leading-none"
                              style={{ fontWeight: 500, fontSize: "2.5rem" }}
                            >
                              {price}
                              <span style={{ fontSize: "1.5rem", marginLeft: "0.2rem" }}>€</span>
                            </p>
                          </div>
                        )}
                        {home !== null && (
                          <div>
                            <p
                              className="text-[oklch(0.52_0.02_60)] text-[0.65rem] tracking-[0.15em] uppercase font-body mb-1"
                              style={{ fontWeight: 500 }}
                            >
                              A domicilio
                            </p>
                            <p
                              className="font-display text-[oklch(0.18_0.018_55)] leading-none"
                              style={{ fontWeight: 500, fontSize: "1.9rem" }}
                            >
                              {formatEuro(home)}
                              <span style={{ fontSize: "1.2rem", marginLeft: "0.2rem" }}>€</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  <span
                    className="inline-flex items-center gap-1.5 text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body"
                    style={{ fontWeight: 500, letterSpacing: "0.1em" }}
                  >
                    Ver masaje y reservar
                    <ChevronRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* More */}
        <div className="mt-10">
          <Link href="/masajes" className="btn-outline text-sm" style={{ textDecoration: "none" }}>
            <Leaf size={15} />
            Ver todos los masajes
          </Link>
        </div>
      </div>
    </section>
  );
}
