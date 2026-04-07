/**
 * Blog router — Cristina Vive Consciente
 * Procedures: public (list, getBySlug) + admin (CRUD categories, CRUD posts, reorder)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogCategories, blogPosts } from "../../drizzle/schema";

async function requireDb(): Promise<ReturnType<typeof import("drizzle-orm/mysql2").drizzle>> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db as NonNullable<typeof db>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(220).optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  categoryId: z.number().int().optional().nullable(),
  readTimeMinutes: z.number().int().min(1).max(120).default(5),
  featured: z.number().int().min(0).max(1).default(0),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  sortOrder: z.number().int().default(0),
  publishedAt: z.date().optional().nullable(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const blogRouter = router({
  // ── PUBLIC ────────────────────────────────────────────────────────────────

  /** Lista de artículos publicados (con filtros opcionales) */
  list: publicProcedure
    .input(
      z.object({
        categoryId: z.number().int().optional(),
        featured: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const conditions = [eq(blogPosts.status, "published")];
      if (input?.categoryId) conditions.push(eq(blogPosts.categoryId, input.categoryId));
      if (input?.featured !== undefined) conditions.push(eq(blogPosts.featured, input.featured ? 1 : 0));
      if (input?.search) {
        const q = `%${input.search}%`;
        conditions.push(
          sql`(${blogPosts.title} LIKE ${q} OR ${blogPosts.excerpt} LIKE ${q})`
        );
      }
      const posts = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          coverImage: blogPosts.coverImage,
          featuredImage: blogPosts.featuredImage,
          categoryId: blogPosts.categoryId,
          readTimeMinutes: blogPosts.readTimeMinutes,
          featured: blogPosts.featured,
          sortOrder: blogPosts.sortOrder,
          publishedAt: blogPosts.publishedAt,
          createdAt: blogPosts.createdAt,
          categoryName: blogCategories.name,
        })
        .from(blogPosts)
        .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
        .where(and(...conditions))
        .orderBy(desc(blogPosts.featured), asc(blogPosts.sortOrder), desc(blogPosts.publishedAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);
      return posts;
    }),

  /** Artículo completo por slug */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [post] = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          content: blogPosts.content,
          coverImage: blogPosts.coverImage,
          featuredImage: blogPosts.featuredImage,
          categoryId: blogPosts.categoryId,
          readTimeMinutes: blogPosts.readTimeMinutes,
          featured: blogPosts.featured,
          status: blogPosts.status,
          publishedAt: blogPosts.publishedAt,
          createdAt: blogPosts.createdAt,
          categoryName: blogCategories.name,
          categorySlug: blogCategories.slug,
        })
        .from(blogPosts)
        .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.status, "published")))
        .limit(1);
      return post ?? null;
    }),

  /** Lista de categorías (públicas) */
  categories: publicProcedure.query(async () => {
    const db = await requireDb();
    return db.select().from(blogCategories).orderBy(asc(blogCategories.sortOrder), asc(blogCategories.name));
  }),

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  admin: router({
    // ── Categorías ──────────────────────────────────────────────────────────

    listCategories: protectedProcedure.query(async () => {
      const db = await requireDb();
      return db.select().from(blogCategories).orderBy(asc(blogCategories.sortOrder), asc(blogCategories.name));
    }),

    createCategory: protectedProcedure
      .input(categorySchema)
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const slug = input.slug || toSlug(input.name);
        await db.insert(blogCategories).values({ ...input, slug });
        return { success: true };
      }),

    updateCategory: protectedProcedure
      .input(z.object({ id: z.number().int(), data: categorySchema }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const slug = input.data.slug || toSlug(input.data.name);
        await db.update(blogCategories).set({ ...input.data, slug }).where(eq(blogCategories.id, input.id));
        return { success: true };
      }),

    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.delete(blogCategories).where(eq(blogCategories.id, input.id));
        return { success: true };
      }),

    // ── Posts ────────────────────────────────────────────────────────────────

    listPosts: protectedProcedure
      .input(
        z.object({
          status: z.enum(["draft", "published", "archived", "all"]).default("all"),
          categoryId: z.number().int().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await requireDb();
        const conditions = [];
        if (input?.status && input.status !== "all") {
          conditions.push(eq(blogPosts.status, input.status));
        }
        if (input?.categoryId) conditions.push(eq(blogPosts.categoryId, input.categoryId));
        if (input?.search) {
          const q = `%${input.search}%`;
          conditions.push(sql`(${blogPosts.title} LIKE ${q} OR ${blogPosts.excerpt} LIKE ${q})`);
        }
        const posts = await db
          .select({
            id: blogPosts.id,
            title: blogPosts.title,
            slug: blogPosts.slug,
            excerpt: blogPosts.excerpt,
            coverImage: blogPosts.coverImage,
            featuredImage: blogPosts.featuredImage,
            categoryId: blogPosts.categoryId,
            readTimeMinutes: blogPosts.readTimeMinutes,
            featured: blogPosts.featured,
            status: blogPosts.status,
            sortOrder: blogPosts.sortOrder,
            publishedAt: blogPosts.publishedAt,
            createdAt: blogPosts.createdAt,
            updatedAt: blogPosts.updatedAt,
            categoryName: blogCategories.name,
          })
          .from(blogPosts)
          .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(blogPosts.sortOrder), desc(blogPosts.createdAt));
        return posts;
      }),

    getPost: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const db = await requireDb();
        const [post] = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.id, input.id))
          .limit(1);
        return post ?? null;
      }),

    createPost: protectedProcedure
      .input(postSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await requireDb();
        const slug = input.slug || toSlug(input.title);
        // Auto-set publishedAt when publishing
        const publishedAt = input.status === "published" && !input.publishedAt ? new Date() : input.publishedAt;
        await db.insert(blogPosts).values({
          ...input,
          slug,
          publishedAt: publishedAt ?? null,
          createdBy: ctx.user?.id ?? null,
        });
        return { success: true };
      }),

    updatePost: protectedProcedure
      .input(z.object({ id: z.number().int(), data: postSchema }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const slug = input.data.slug || toSlug(input.data.title);
        const publishedAt = input.data.status === "published" && !input.data.publishedAt ? new Date() : input.data.publishedAt;
        await db.update(blogPosts).set({
          ...input.data,
          slug,
          publishedAt: publishedAt ?? null,
        }).where(eq(blogPosts.id, input.id));
        return { success: true };
      }),

    deletePost: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
        return { success: true };
      }),

    /** Intercambia sortOrder entre dos artículos para reordenar */
    reorderPost: protectedProcedure
      .input(z.object({ postId: z.number().int(), direction: z.enum(["up", "down"]) }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const allPosts = await db
          .select({ id: blogPosts.id, sortOrder: blogPosts.sortOrder })
          .from(blogPosts)
          .orderBy(asc(blogPosts.sortOrder), desc(blogPosts.createdAt));
        const idx = allPosts.findIndex((p: { id: number; sortOrder: number }) => p.id === input.postId);
        if (idx === -1) return { success: false };
        const swapIdx = input.direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= allPosts.length) return { success: false };
        const current = allPosts[idx];
        const swap = allPosts[swapIdx];
        await db.update(blogPosts).set({ sortOrder: swap.sortOrder }).where(eq(blogPosts.id, current.id));
        await db.update(blogPosts).set({ sortOrder: current.sortOrder }).where(eq(blogPosts.id, swap.id));
        return { success: true };
      }),

    /** Lista de slugs existentes para validación en formulario */
    existingSlugs: protectedProcedure
      .input(z.object({ excludeId: z.number().int().optional() }))
      .query(async ({ input }) => {
        const db = await requireDb();
        const rows = await db.select({ id: blogPosts.id, slug: blogPosts.slug }).from(blogPosts);
        return rows.filter((r: { id: number; slug: string }) => r.id !== input?.excludeId).map((r: { id: number; slug: string }) => r.slug);
      }),
  }),
});
