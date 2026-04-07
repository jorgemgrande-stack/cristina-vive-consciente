/**
 * BlogArticulos — Gestor CRM de artículos del blog
 * Cristina Vive Consciente
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-600",
};

export default function BlogArticulos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");

  const utils = trpc.useUtils();

  const { data: posts = [], isLoading } = trpc.blog.admin.listPosts.useQuery({
    status: statusFilter,
    search: search || undefined,
  });

  const deleteMutation = trpc.blog.admin.deletePost.useMutation({
    onSuccess: () => {
      utils.blog.admin.listPosts.invalidate();
      toast.success("Artículo eliminado");
    },
    onError: () => toast.error("Error al eliminar el artículo"),
  });

  const updateMutation = trpc.blog.admin.updatePost.useMutation({
    onSuccess: () => {
      utils.blog.admin.listPosts.invalidate();
    },
    onError: () => toast.error("Error al actualizar el artículo"),
  });

  const reorderMutation = trpc.blog.admin.reorderPost.useMutation({
    onSuccess: () => utils.blog.admin.listPosts.invalidate(),
    onError: () => toast.error("Error al reordenar"),
  });

  function handleDelete(id: number, title: string) {
    if (!confirm(`¿Eliminar el artículo "${title}"?`)) return;
    deleteMutation.mutate({ id });
  }

  function handleToggleStatus(post: typeof posts[0]) {
    const newStatus = post.status === "published" ? "draft" : "published";
    updateMutation.mutate({
      id: post.id,
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? undefined,
        content: undefined,
        coverImage: post.coverImage ?? undefined,
        categoryId: post.categoryId ?? undefined,
        readTimeMinutes: post.readTimeMinutes ?? 5,
        featured: post.featured ?? 0,
        status: newStatus,
        sortOrder: post.sortOrder ?? 0,
      },
    });
    toast.success(newStatus === "published" ? "Artículo publicado" : "Artículo guardado como borrador");
  }

  function handleToggleFeatured(post: typeof posts[0]) {
    const newFeatured = post.featured === 1 ? 0 : 1;
    updateMutation.mutate({
      id: post.id,
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? undefined,
        content: undefined,
        coverImage: post.coverImage ?? undefined,
        categoryId: post.categoryId ?? undefined,
        readTimeMinutes: post.readTimeMinutes ?? 5,
        featured: newFeatured,
        status: post.status,
        sortOrder: post.sortOrder ?? 0,
      },
    });
    toast.success(newFeatured === 1 ? "Marcado como destacado" : "Quitado de destacados");
  }

  return (
    <CRMLayout title="Blog — Artículos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading text-[oklch(0.35_0.05_148)]">Artículos del Blog</h1>
            <p className="text-sm text-gray-500 font-body mt-1">Gestiona los artículos publicados en el blog</p>
          </div>
          <Link
            href="/crm/blog/articulos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-sm font-body hover:bg-[oklch(0.45_0.08_148)] transition-colors no-underline"
            style={{ borderRadius: 0 }}
          >
            <Plus size={16} />
            Nuevo artículo
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
              style={{ borderRadius: 0 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 text-sm border border-gray-200 font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)] bg-white"
            style={{ borderRadius: 0 }}
          >
            <option value="all">Todos los estados</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="archived">Archivados</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 font-body text-sm">Cargando artículos...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200">
            <p className="text-gray-400 font-body text-sm mb-4">No hay artículos todavía</p>
            <Link
              href="/crm/blog/articulos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[oklch(0.52_0.08_148)] text-white text-sm font-body no-underline"
              style={{ borderRadius: 0 }}
            >
              <Plus size={14} />
              Crear primer artículo
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Artículo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post, idx) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    {/* Reorder */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => reorderMutation.mutate({ postId: post.id, direction: "up" })}
                          disabled={idx === 0 || !!search}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Subir"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => reorderMutation.mutate({ postId: post.id, direction: "down" })}
                          disabled={idx === posts.length - 1 || !!search}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Bajar"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </td>
                    {/* Title + image */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.coverImage && (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-10 h-10 object-cover flex-shrink-0"
                            style={{ borderRadius: 0 }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{post.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {post.categoryName ?? <span className="text-gray-300">—</span>}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status]}`}>
                        {STATUS_LABELS[post.status]}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
                        : new Date(post.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Featured toggle */}
                        <button
                          onClick={() => handleToggleFeatured(post)}
                          className={`p-1.5 transition-colors ${post.featured === 1 ? "text-amber-500 hover:text-amber-700" : "text-gray-300 hover:text-amber-400"}`}
                          title={post.featured === 1 ? "Quitar destacado" : "Marcar como destacado"}
                        >
                          {post.featured === 1 ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                        </button>
                        {/* Publish/unpublish toggle */}
                        <button
                          onClick={() => handleToggleStatus(post)}
                          className={`p-1.5 transition-colors ${post.status === "published" ? "text-green-600 hover:text-red-500" : "text-gray-400 hover:text-green-600"}`}
                          title={post.status === "published" ? "Despublicar" : "Publicar"}
                        >
                          {post.status === "published" ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        {/* Edit */}
                        <Link
                          href={`/crm/blog/articulos/${post.id}/editar`}
                          className="p-1.5 text-gray-400 hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </Link>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
