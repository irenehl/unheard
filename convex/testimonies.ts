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
      const pageWithPhotoUrls = await Promise.all(
        page.page.map(async (testimony) => ({
          ...testimony,
          photoUrl: testimony.photoStorageId
            ? await ctx.storage.getUrl(testimony.photoStorageId)
            : null,
        }))
      );

      return {
        ...page,
        page: pageWithPhotoUrls,
      };
    } catch (error) {
      console.error("Error in testimonies.list query:", error);
      throw error;
    }
  },
});

const FEED_EXCERPT_LENGTH = 510;

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

    const feedItems = await Promise.all(
      page.page.map(async (testimony) => {
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
          hasMoreOriginal: testimony.originalText.length > FEED_EXCERPT_LENGTH,
          hasMoreEdited: testimony.editedText.length > FEED_EXCERPT_LENGTH,
          hasMoreTranslated: (translatedForLocale?.length ?? 0) > FEED_EXCERPT_LENGTH,
          hasMoreContent:
            testimony.originalText.length > FEED_EXCERPT_LENGTH ||
            testimony.editedText.length > FEED_EXCERPT_LENGTH ||
            (translatedForLocale?.length ?? 0) > FEED_EXCERPT_LENGTH,
          photoUrl: testimony.photoStorageId
            ? await ctx.storage.getUrl(testimony.photoStorageId)
            : null,
        };
      })
    );

    return {
      ...page,
      page: feedItems,
    };
  },
});

export const getById = query({
  args: { id: v.id("testimonies") },
  handler: async (ctx, { id }) => {
    const testimony = await ctx.db.get(id);
    if (!testimony) return null;

    return {
      ...testimony,
      photoUrl: testimony.photoStorageId
        ? await ctx.storage.getUrl(testimony.photoStorageId)
        : null,
    };
  },
});

export const listCarouselPhotos = query({
  args: {},
  handler: async (ctx) => {
    const testimonies = await ctx.db
      .query("testimonies")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();

    const withPhotos = testimonies.filter((t) => t.photoStorageId != null);
    const recent = withPhotos.slice(0, 40);

    return Promise.all(
      recent.map(async (t) => ({
        _id: t._id,
        type: t.type,
        isAnonymous: t.isAnonymous,
        createdAt: t.createdAt,
        authorName: t.authorName ?? null,
        authorProfession: t.authorProfession ?? null,
        authorCountry: t.authorCountry ?? null,
        subjectName: t.subjectName ?? null,
        subjectProfession: t.subjectProfession ?? null,
        subjectCountry: t.subjectCountry ?? null,
        photoUrl: await ctx.storage.getUrl(t.photoStorageId!),
      }))
    );
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
    authorId: v.optional(v.string()),
    authorName: v.optional(v.string()),
    isAnonymous: v.boolean(),
    originalText: v.string(),
    originalLanguage: v.string(),
    editedText: v.string(),
    translatedText: v.record(v.string(), v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    subjectName: v.optional(v.string()),
    subjectProfession: v.optional(v.string()),
    subjectCountry: v.optional(v.string()),
    authorProfession: v.optional(v.string()),
    authorCountry: v.optional(v.string()),
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
    photoStorageId: v.optional(v.id("_storage")),
    photoAction: v.optional(
      v.union(v.literal("keep"), v.literal("replace"), v.literal("remove"))
    ),
    subjectName: v.optional(v.string()),
    subjectProfession: v.optional(v.string()),
    subjectCountry: v.optional(v.string()),
    authorProfession: v.optional(v.string()),
    authorCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      id,
      authorId,
      category,
      originalText,
      originalLanguage,
      editedText,
      translatedText,
      photoStorageId,
      photoAction = "keep",
      subjectName,
      subjectProfession,
      subjectCountry,
      authorProfession,
      authorCountry,
    } = args;
    const testimony = await ctx.db.get(id);
    if (!testimony) throw new Error("Testimony not found");
    if (!testimony.authorId || testimony.authorId !== authorId) throw new Error("Unauthorized");
    if (Date.now() - testimony.createdAt >= 86_400_000) throw new Error("Edit window expired");
    if (photoAction === "replace" && !photoStorageId) {
      throw new Error("Missing photo for replace action");
    }

    const photoPatch =
      photoAction === "replace"
        ? { photoStorageId }
        : photoAction === "remove"
          ? { photoStorageId: undefined }
          : {};

    await ctx.db.patch(id, {
      category,
      originalText,
      originalLanguage,
      editedText,
      translatedText,
      subjectName,
      subjectProfession,
      subjectCountry,
      authorProfession,
      authorCountry,
      ...photoPatch,
      editedAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
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
