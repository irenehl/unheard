import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const CATEGORY_VALUES = v.union(
  v.literal("work"),
  v.literal("family"),
  v.literal("health"),
  v.literal("love"),
  v.literal("money"),
  v.literal("education"),
  v.literal("courage")
);

// --- Queries ---

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("honor"), v.literal("tell"))),
    category: v.optional(CATEGORY_VALUES),
    paginationOpts: v.any(),
  },
  handler: async (ctx, { type, category, paginationOpts }) => {
    try {
      // Always filter by published status first
      // Use the most specific index available, then filter by the other field if needed
      let queryBuilder;
      
      if (type && category) {
        // Both filters: use by_type index and filter by category
        queryBuilder = ctx.db
          .query("testimonies")
          .withIndex("by_type", (q) => q.eq("type", type))
          .filter((q) => q.eq(q.field("status"), "published"))
          .filter((q) => q.eq(q.field("category"), category))
          .order("desc");
      } else if (type) {
        // Only type filter: use by_type index
        queryBuilder = ctx.db
          .query("testimonies")
          .withIndex("by_type", (q) => q.eq("type", type))
          .filter((q) => q.eq(q.field("status"), "published"))
          .order("desc");
      } else if (category) {
        // Only category filter: use by_category index
        queryBuilder = ctx.db
          .query("testimonies")
          .withIndex("by_category", (q) => q.eq("category", category))
          .filter((q) => q.eq(q.field("status"), "published"))
          .order("desc");
      } else {
        // No filters: use by_createdAt index
        queryBuilder = ctx.db
          .query("testimonies")
          .withIndex("by_createdAt")
          .filter((q) => q.eq(q.field("status"), "published"))
          .order("desc");
      }

      const page = await queryBuilder.paginate({
        numItems: paginationOpts.numItems,
        cursor: paginationOpts.cursor,
      });

      return page;
    } catch (error) {
      console.error("Error in testimonies.list query:", error);
      throw error;
    }
  },
});

export const getById = query({
  args: { id: v.id("testimonies") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const listForAdmin = query({
  args: {
    paginationOpts: v.any(),
  },
  handler: async (ctx, { paginationOpts }) => {
    return ctx.db
      .query("testimonies")
      .withIndex("by_createdAt")
      .order("desc")
      .paginate({
        numItems: paginationOpts.numItems,
        cursor: paginationOpts.cursor,
      });
  },
});

// --- Mutations ---

export const create = mutation({
  args: {
    type: v.union(v.literal("honor"), v.literal("tell")),
    category: CATEGORY_VALUES,
    authorId: v.union(v.string(), v.null()),
    authorName: v.optional(v.string()),
    isAnonymous: v.boolean(),
    originalText: v.string(),
    originalLanguage: v.string(),
    editedText: v.string(),
    translatedText: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("testimonies", {
      ...args,
      status: "published",
      flagCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("testimonies"),
    status: v.union(v.literal("published"), v.literal("removed")),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status });
  },
});

export const flag = mutation({
  args: { id: v.id("testimonies") },
  handler: async (ctx, { id }) => {
    const testimony = await ctx.db.get(id);
    if (!testimony) throw new Error("Testimony not found");
    await ctx.db.patch(id, { flagCount: testimony.flagCount + 1 });
  },
});
