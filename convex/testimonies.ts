import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

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
    paginationOpts: paginationOptsValidator,
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

      const page = await queryBuilder.paginate(paginationOpts);

      return page;
    } catch (error) {
      console.error("Error in testimonies.list query:", error);
      throw error;
    }
  },
});

const FEED_EXCERPT_LENGTH = 360;

function toExcerpt(text: string) {
  if (text.length <= FEED_EXCERPT_LENGTH) return text;
  return text.slice(0, FEED_EXCERPT_LENGTH).trimEnd() + "…";
}

export const listFeed = query({
  args: {
    type: v.optional(v.union(v.literal("honor"), v.literal("tell"))),
    category: v.optional(CATEGORY_VALUES),
    locale: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { type, category, locale, paginationOpts }) => {
    let queryBuilder;

    if (type && category) {
      queryBuilder = ctx.db
        .query("testimonies")
        .withIndex("by_status_type_createdAt", (q) =>
          q.eq("status", "published").eq("type", type)
        )
        .filter((q) => q.eq(q.field("category"), category))
        .order("desc");
    } else if (type) {
      queryBuilder = ctx.db
        .query("testimonies")
        .withIndex("by_status_type_createdAt", (q) =>
          q.eq("status", "published").eq("type", type)
        )
        .order("desc");
    } else if (category) {
      queryBuilder = ctx.db
        .query("testimonies")
        .withIndex("by_status_category_createdAt", (q) =>
          q.eq("status", "published").eq("category", category)
        )
        .order("desc");
    } else {
      queryBuilder = ctx.db
        .query("testimonies")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .order("desc");
    }

    const page = await queryBuilder.paginate(paginationOpts);

    return {
      ...page,
      page: page.page.map((testimony) => {
        const translatedForLocale = testimony.translatedText[locale];
        return {
          _id: testimony._id,
          _creationTime: testimony._creationTime,
          type: testimony.type,
          category: testimony.category,
          authorId: testimony.authorId,
          authorName: testimony.authorName,
          isAnonymous: testimony.isAnonymous,
          status: testimony.status,
          flagCount: testimony.flagCount,
          createdAt: testimony.createdAt,
          editedAt: testimony.editedAt,
          originalLanguage: testimony.originalLanguage,
          originalText: toExcerpt(testimony.originalText),
          editedText: toExcerpt(testimony.editedText),
          translatedText: translatedForLocale
            ? { [locale]: toExcerpt(translatedForLocale) }
            : {},
          hasMoreContent:
            testimony.originalText.length > FEED_EXCERPT_LENGTH ||
            testimony.editedText.length > FEED_EXCERPT_LENGTH ||
            (translatedForLocale?.length ?? 0) > FEED_EXCERPT_LENGTH,
        };
      }),
    };
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
    authorId: v.string(),
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

export const update = mutation({
  args: {
    id: v.id("testimonies"),
    authorId: v.string(),
    category: CATEGORY_VALUES,
    originalText: v.string(),
    originalLanguage: v.string(),
    editedText: v.string(),
    translatedText: v.record(v.string(), v.string()),
  },
  handler: async (ctx, { id, authorId, ...fields }) => {
    const testimony = await ctx.db.get(id);
    if (!testimony) throw new Error("Testimony not found");
    if (!testimony.authorId || testimony.authorId !== authorId) throw new Error("Unauthorized");
    if (Date.now() - testimony.createdAt >= 86_400_000) throw new Error("Edit window expired");
    await ctx.db.patch(id, { ...fields, editedAt: Date.now() });
  },
});

export const deleteOwn = mutation({
  args: {
    id: v.id("testimonies"),
    authorId: v.string(),
  },
  handler: async (ctx, { id, authorId }) => {
    const testimony = await ctx.db.get(id);
    if (!testimony) throw new Error("Testimony not found");
    if (!testimony.authorId || testimony.authorId !== authorId) throw new Error("Unauthorized");
    await ctx.db.patch(id, { status: "removed" });
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

// Migration: Fix specific documents with null authorId by marking them as removed
// This works around schema validation by using direct patch operations
export const removeTestimonyById = mutation({
  args: { id: v.id("testimonies") },
  handler: async (ctx, { id }) => {
    // Use patch to only update status, avoiding authorId validation
    await ctx.db.patch(id, { status: "removed" });
    return { success: true };
  },
});
