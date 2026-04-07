/**
 * BlogPost — Cristina Vive Consciente
 * Página pública de detalle de artículo del blog
 * Design: "Luz Botánica"
 */
import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, Tag, Calendar, MessageCircle, User, Send, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { useState } from "react";
import { toast } from "sonner";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";

  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-[oklch(0.55_0.04_75)] font-body text-sm">Cargando artículo...</p>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-[oklch(0.55_0.04_75)] font-body text-sm">Artículo no encontrado.</p>
          <Link href="/blog" className="text-[oklch(0.52_0.08_148)] font-body text-sm underline no-underline hover:underline">
            Volver al blog
          </Link>
        </div>
      </Layout>
    );
  }

  // Prioridad: writtenAt (fecha real de escritura) > publishedAt > createdAt
  const displayDate = (post as any).writtenAt || post.publishedAt || post.createdAt;
  const dateStr = new Date(displayDate).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const authorName = (post as any).author as string | null | undefined;

  return (
    <Layout>
      {/* Hero image */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={post.coverImage || FALLBACK_IMG}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* Back button */}
        <Link
          href="/blog"
          className="absolute top-6 left-6 flex items-center gap-2 text-white/90 hover:text-white text-sm font-body no-underline bg-black/20 px-3 py-1.5 backdrop-blur-sm transition-colors"
          style={{ borderRadius: 0 }}
        >
          <ArrowLeft size={14} />
          Blog
        </Link>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-[oklch(0.55_0.04_75)] font-body">
          {post.categoryName && (
            <span className="flex items-center gap-1.5 text-[oklch(0.52_0.08_148)] uppercase tracking-wide font-medium">
              <Tag size={11} />
              {post.categoryName}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={11} />
            {dateStr}
          </span>
          {authorName && (
            <span className="flex items-center gap-1.5">
              <span className="text-[oklch(0.55_0.04_75)]">Por</span>
              <span className="font-medium text-[oklch(0.35_0.04_75)]">{authorName}</span>
            </span>
          )}
          {post.readTimeMinutes && (
            <span className="flex items-center gap-1.5">
              <Clock size={11} />
              {post.readTimeMinutes} min de lectura
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl sm:text-4xl text-[oklch(0.22_0.03_75)] leading-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg font-body text-[oklch(0.45_0.03_75)] leading-relaxed mb-8 border-l-2 border-[oklch(0.52_0.08_148)] pl-4 italic">
            {post.excerpt}
          </p>
        )}

        {/* Featured Image (after excerpt) */}
        {(post as any).featuredImage && (
          <div className="my-8 flex justify-center">
            <img
              src={(post as any).featuredImage}
              alt={post.title}
              className="w-full max-w-2xl rounded-sm object-cover shadow-md"
              style={{ maxHeight: "480px" }}
            />
          </div>
        )}

        {/* Divider */}
        <div className="w-12 h-px bg-[oklch(0.52_0.08_148)] mb-8" />

        {/* Content */}
        {post.content ? (
          <div
            className="prose prose-stone max-w-none font-body text-[oklch(0.35_0.03_75)] leading-relaxed"
            style={{
              fontSize: "1rem",
              lineHeight: "1.8",
            }}
            dangerouslySetInnerHTML={{
              __html: post.content
                // Basic Markdown-like rendering
                .replace(/^## (.+)$/gm, '<h2 class="font-heading text-2xl text-[oklch(0.25_0.04_75)] mt-10 mb-4">$1</h2>')
                .replace(/^### (.+)$/gm, '<h3 class="font-heading text-xl text-[oklch(0.25_0.04_75)] mt-8 mb-3">$1</h3>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[oklch(0.52_0.08_148)] underline hover:text-[oklch(0.38_0.07_148)]" target="_blank" rel="noopener">$1</a>')
                .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
                .replace(/\n\n/g, '</p><p class="mb-4">')
                .replace(/^(?!<[h|l])(.+)$/gm, (match) => match.startsWith('<') ? match : match)
            }}
          />
        ) : (
          <p className="text-[oklch(0.55_0.04_75)] font-body italic">Contenido próximamente...</p>
        )}

        {/* ── Sección de Comentarios ──────────────────────────────────── */}
        <CommentsSection postId={post.id} />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[oklch(0.90_0.01_75)]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-sm font-body no-underline hover:gap-3 transition-all"
          >
            <ArrowLeft size={14} />
            Volver a todos los artículos
          </Link>
        </div>
      </article>
    </Layout>
  );
}

// ── CommentsSection ────────────────────────────────────────────────────────────
function CommentsSection({ postId }: { postId: number }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: comments = [], refetch } = trpc.blogComments.listApproved.useQuery({ postId });

  const submitMutation = trpc.blogComments.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setContent("");
    },
    onError: (err) => {
      toast.error(err.message || "Error al enviar el comentario");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      toast.error("Por favor, rellena tu nombre y comentario");
      return;
    }
    submitMutation.mutate({ postId, authorName: name.trim(), content: content.trim() });
  };

  return (
    <section className="mt-16 pt-10 border-t border-[oklch(0.90_0.01_75)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle size={20} className="text-[oklch(0.52_0.08_148)]" />
        <h3 className="font-heading text-xl text-[oklch(0.25_0.04_75)]">
          {comments.length > 0 ? `${comments.length} comentario${comments.length !== 1 ? "s" : ""}` : "Comentarios"}
        </h3>
      </div>

      {/* Lista de comentarios aprobados */}
      {comments.length > 0 && (
        <div className="space-y-6 mb-12">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[oklch(0.93_0.03_148)] flex items-center justify-center">
                <User size={16} className="text-[oklch(0.52_0.08_148)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-heading text-sm font-semibold text-[oklch(0.25_0.04_75)]">{c.authorName}</span>
                  <span className="text-xs text-[oklch(0.65_0.02_75)]">
                    {new Date(c.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
                <p className="font-body text-sm text-[oklch(0.40_0.03_75)] leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de comentario */}
      <div className="bg-[oklch(0.97_0.01_75)] rounded-2xl p-6 border border-[oklch(0.91_0.01_75)]">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={32} className="text-[oklch(0.52_0.08_148)]" />
            <p className="font-heading text-base text-[oklch(0.25_0.04_75)]">¡Gracias por tu comentario!</p>
            <p className="font-body text-sm text-[oklch(0.55_0.04_75)]">Está pendiente de moderación y aparecerá pronto.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs text-[oklch(0.52_0.08_148)] underline font-body"
            >
              Escribir otro comentario
            </button>
          </div>
        ) : (
          <>
            <h4 className="font-heading text-base text-[oklch(0.25_0.04_75)] mb-5">Deja tu comentario</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs text-[oklch(0.50_0.03_75)] mb-1.5 uppercase tracking-wide">Tu nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: María García"
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-xl border border-[oklch(0.88_0.01_75)] bg-white font-body text-sm text-[oklch(0.25_0.04_75)] placeholder:text-[oklch(0.75_0.02_75)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.08_148)] focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-[oklch(0.50_0.03_75)] mb-1.5 uppercase tracking-wide">Comentario</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Comparte tu reflexión sobre este artículo..."
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 rounded-xl border border-[oklch(0.88_0.01_75)] bg-white font-body text-sm text-[oklch(0.25_0.04_75)] placeholder:text-[oklch(0.75_0.02_75)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.08_148)] focus:border-transparent transition resize-none"
                />
                <p className="text-right text-xs text-[oklch(0.70_0.02_75)] mt-1">{content.length}/2000</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[oklch(0.52_0.08_148)] text-white font-body text-sm rounded-xl hover:bg-[oklch(0.44_0.07_148)] disabled:opacity-60 transition-colors"
                >
                  {submitMutation.isPending ? (
                    <span>Enviando...</span>
                  ) : (
                    <><Send size={14} /> Enviar comentario</>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
