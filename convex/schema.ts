import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  testimonies: defineTable({
    // Entry type and category
    type: v.union(v.literal("honor"), v.literal("tell")),
    category: v.union(
      v.literal("work"),
      v.literal("family"),
      v.literal("health"),
      v.literal("love"),
      v.literal("money"),
      v.literal("education"),
      v.literal("courage")
    ),

    // Author fields
    authorId: v.optional(v.string()),
    authorName: v.optional(v.string()),
    isAnonymous: v.boolean(),

    // Text versions — originalText is sacred and never modified
    originalText: v.string(),
    originalLanguage: v.string(),
    editedText: v.string(),
    translatedText: v.record(v.string(), v.string()),

    // Moderation and metadata
    status: v.union(v.literal("published"), v.literal("removed")),
    flagCount: v.number(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_type", ["type", "createdAt"])
    .index("by_category", ["category", "createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_status_type_createdAt", ["status", "type", "createdAt"])
    .index("by_status_category_createdAt", ["status", "category", "createdAt"])
    .index("by_authorId", ["authorId", "createdAt"]),

  profiles: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    profession: v.string(),
    country: v.string(),
    submittedBy: v.string(),
    status: v.union(v.literal("published"), v.literal("removed")),
    createdAt: v.number(),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_submittedBy", ["submittedBy", "createdAt"]),
});
