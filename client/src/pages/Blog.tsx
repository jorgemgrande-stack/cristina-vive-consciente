/**
 * Blog — Cristina Vive Consciente
 * Página pública con artículos dinámicos desde la base de datos
 * Design: "Luz Botánica"
 */
import { useState } from "react";
import { Link } from "wouter";
import { Clock, Tag, ArrowRight, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-main-T6UmVzyg8XHyq4zLvU5RfZ.webp";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80";

// ─── Post Card Component ──────────────────────────────────────────────────────

interface PostCardProps {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    categoryName?: string | null;
    readTimeMinutes?: number | null;
    publishedAt?: Date | null;
    createdAt: Date;
  };
  featured?: boolean;
}

function PostCard({ post, featured }: PostCardProps) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : new Date(post.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white border border-[oklch(0.92_0.01_75)] hover:border-[oklch(0.52_0.08_148)] transition-all duration-300 no-underline overflow-hidden"
      style={{ borderRadius: 0 }}
    >
      <div className={`overflow-hidden ${featured ? "h-52" : "h-44"}`}>
        <img
          src={post.coverImage || FALLBACK_IMG}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        {post.categoryName && (
          <div className="flex items-center gap-1.5 mb-3">
            <Tag size={11} className="text-[oklch(0.52_0.08_148)]" />
            <span className="text-xs font-body text-[oklch(0.52_0.08_148)] uppercase tracking-wide">
              {post.categoryName}
            </span>
          </div>
        )}
        <h3 className={`font-heading text-[oklch(0.25_0.04_75)] group-hover:text-[oklch(0.35_0.08_148)] transition-colors leading-snug mb-2 ${featured ? "text-xl" : "text-base"}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm font-body text-[oklch(0.45_0.03_75)] line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-[oklch(0.60_0.03_75)] font-body">
            <span>{dateStr}</span>
            {post.readTimeMinutes && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {post.readTimeMinutes} min
                </span>
              </>
            )}
          </div>
          <ArrowRight size={14} className="text-[oklch(0.52_0.08_148)] group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}



export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: categories = [] } = trpc.blog.categories.useQuery();
  const { data: posts = [], isLoading } = trpc.blog.list.useQuery({
    categoryId: selectedCategory ?? undefined,
    search: search || undefined,
    limit: 50,
  });

  const featuredPosts = posts.filter((p) => p.featured === 1);
  const regularPosts = posts.filter((p) => p.featured !== 1);
  const showFiltered = !!(search || selectedCategory);

  return (
    <Layout>
      <PageHero
        title="Blog"
        subtitle="Reflexiones, guías y conocimiento para vivir con más consciencia y bienestar"
        image={HERO}
      />

      <section className="py-16 bg-[oklch(0.98_0.008_75)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.55_0.04_75)]" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[oklch(0.88_0.015_75)] bg-white font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
                style={{ borderRadius: 0 }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 text-xs font-body transition-colors ${
                  selectedCategory === null
                    ? "bg-[oklch(0.52_0.08_148)] text-white"
                    : "bg-white border border-[oklch(0.88_0.015_75)] text-[oklch(0.45_0.04_75)] hover:border-[oklch(0.52_0.08_148)]"
                }`}
                style={{ borderRadius: 0 }}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-body transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-[oklch(0.52_0.08_148)] text-white"
                      : "bg-white border border-[oklch(0.88_0.015_75)] text-[oklch(0.45_0.04_75)] hover:border-[oklch(0.52_0.08_148)]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-[oklch(0.55_0.04_75)] font-body text-sm">
              Cargando artículos...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[oklch(0.55_0.04_75)] font-body text-sm mb-2">
                {search || selectedCategory ? "No se encontraron artículos con esos filtros." : "Próximamente habrá artículos aquí."}
              </p>
              {(search || selectedCategory) && (
                <button
                  onClick={() => { setSearch(""); setSelectedCategory(null); }}
                  className="text-[oklch(0.52_0.08_148)] text-sm font-body underline"
                >
                  Ver todos los artículos
                </button>
              )}
            </div>
          ) : showFiltered ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <>
              {/* Featured posts */}
              {featuredPosts.length > 0 && (
                <div className="mb-12">
                  <p className="text-xs font-body uppercase tracking-widest text-[oklch(0.52_0.08_148)] mb-6">
                    Artículos destacados
                  </p>
                  <div className={`grid gap-6 ${featuredPosts.length === 1 ? "grid-cols-1 max-w-2xl" : "grid-cols-1 md:grid-cols-2"}`}>
                    {featuredPosts.map((post) => (
                      <PostCard key={post.id} post={post} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular posts */}
              {regularPosts.length > 0 && (
                <div>
                  {featuredPosts.length > 0 && (
                    <p className="text-xs font-body uppercase tracking-widest text-[oklch(0.55_0.04_75)] mb-6">
                      Más artículos
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
