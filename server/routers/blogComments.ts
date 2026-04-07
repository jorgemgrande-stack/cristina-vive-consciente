/**
 * blogComments router — Cristina Vive Consciente
 * Público: submit (enviar comentario), listApproved (listar aprobados por post)
 * Admin: listAll (todos con filtros), approve, reject, delete
 */
import { z } from "zod";
import { eq, and, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogComments } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
  return db as NonNullable<typeof db>;
}

// ── Admin sub-router ──────────────────────────────────────────────────────────
const adminRouter = router({
  // List all comments with optional status filter
  listAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
        postId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const conditions = [];
      if (input.status !== "all") {
        conditions.push(eq(blogComments.status, input.status));
      }
      if (input.postId) {
        conditions.push(eq(blogComments.postId, input.postId));
      }
      return db
        .select()
        .from(blogComments)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(blogComments.createdAt));
    }),

  // Approve a comment
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db
        .update(blogComments)
        .set({ status: "approved" })
        .where(eq(blogComments.id, input.id));
      return { success: true };
    }),

  // Reject a comment
  reject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db
        .update(blogComments)
        .set({ status: "rejected" })
        .where(eq(blogComments.id, input.id));
      return { success: true };
    }),

  // Delete a comment permanently
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db.delete(blogComments).where(eq(blogComments.id, input.id));
      return { success: true };
    }),

  // Count pending comments (for badge)
  countPending: protectedProcedure.query(async () => {
    const db = await requireDb();
    const result = await db
      .select({ count: count() })
      .from(blogComments)
      .where(eq(blogComments.status, "pending"));
    return result[0]?.count ?? 0;
  }),
});

// ── Public sub-router ─────────────────────────────────────────────────────────
export const blogCommentsRouter = router({
  // Submit a new comment (goes to pending)
  submit: publicProcedure
    .input(
      z.object({
        postId: z.number(),
        authorName: z.string().min(2).max(100),
        content: z.string().min(5).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db.insert(blogComments).values({
        postId: input.postId,
        authorName: input.authorName.trim(),
        content: input.content.trim(),
        status: "pending",
      });
      // Notify admin of new comment
      try {
        await notifyOwner({
          title: `Nuevo comentario de ${input.authorName}`,
          content: `Ha llegado un nuevo comentario pendiente de moderación en el blog.\n\nAutor: ${input.authorName}\nComentario: ${input.content.slice(0, 200)}${input.content.length > 200 ? "…" : ""}`,
        });
      } catch {
        // Notification failure should not block the response
      }
      return { success: true };
    }),

  // List approved comments for a post
  listApproved: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select({
          id: blogComments.id,
          authorName: blogComments.authorName,
          content: blogComments.content,
          createdAt: blogComments.createdAt,
        })
        .from(blogComments)
        .where(
          and(
            eq(blogComments.postId, input.postId),
            eq(blogComments.status, "approved")
          )
        )
        .orderBy(desc(blogComments.createdAt));
    }),

  admin: adminRouter,
});
