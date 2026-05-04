import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { heroImages } from "../../drizzle/schema";

export const heroRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(heroImages)
      .orderBy(heroImages.sortOrder, heroImages.createdAt);
  }),

  add: protectedProcedure
    .input(z.object({ url: z.string().min(1), key: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await db.select({ id: heroImages.id }).from(heroImages);
      const sortOrder = existing.length;
      await db.insert(heroImages).values({ url: input.url, key: input.key, sortOrder });
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(heroImages).where(eq(heroImages.id, input.id));
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(z.array(z.object({ id: z.number(), sortOrder: z.number() })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await Promise.all(
        input.map(({ id, sortOrder }) =>
          db.update(heroImages).set({ sortOrder }).where(eq(heroImages.id, id))
        )
      );
      return { success: true };
    }),
});
