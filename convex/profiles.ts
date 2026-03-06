import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    profession: v.string(),
    country: v.string(),
    submittedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("profiles", {
      ...args,
      status: "published",
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();

    return Promise.all(
      profiles.map(async (p) => ({
        ...p,
        photoUrl: await ctx.storage.getUrl(p.storageId),
      }))
    );
  },
});

export const remove = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "removed" });
  },
});
