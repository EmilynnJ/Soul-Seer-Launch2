import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, forumCategories, forumTopics, forumReplies, users, contentFlags } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/forum/categories", async (_req, res: Response) => {
  const rows = await db.select().from(forumCategories).orderBy(forumCategories.sortOrder);
  // Seed defaults if empty
  if (rows.length === 0) {
    const defaults = [
      { slug: "general", name: "General", description: "Open discussion for the community.", sortOrder: 1 },
      { slug: "readings", name: "Readings", description: "Share and discuss your reading experiences.", sortOrder: 2 },
      { slug: "spiritual-growth", name: "Spiritual Growth", description: "Practices, paths, and personal evolution.", sortOrder: 3 },
      { slug: "ask-a-reader", name: "Ask a Reader", description: "Pose questions to our roster.", sortOrder: 4 },
      { slug: "announcements", name: "Announcements", description: "Platform updates from the SoulSeer team.", sortOrder: 5 },
    ];
    const inserted = await db.insert(forumCategories).values(defaults).returning();
    return res.json(inserted);
  }
  res.json(rows);
});

router.get("/forum/topics", async (req, res: Response) => {
  const categorySlug = typeof req.query.category === "string" ? req.query.category : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = 10;

  let categoryId: string | undefined;
  if (categorySlug) {
    const [cat] = await db.select().from(forumCategories).where(eq(forumCategories.slug, categorySlug)).limit(1);
    if (!cat) return res.json({ items: [], page, pageSize, total: 0 });
    categoryId = cat.id;
  }

  const filter = categoryId
    ? and(eq(forumTopics.categoryId, categoryId), eq(forumTopics.isRemoved, false))
    : eq(forumTopics.isRemoved, false);

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)::int` })
    .from(forumTopics)
    .where(filter);

  const rows = await db
    .select({ topic: forumTopics, author: users, category: forumCategories })
    .from(forumTopics)
    .innerJoin(users, eq(users.id, forumTopics.authorId))
    .innerJoin(forumCategories, eq(forumCategories.id, forumTopics.categoryId))
    .where(filter)
    .orderBy(desc(forumTopics.lastActivityAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  res.json({
    items: rows.map(({ topic, author, category }) => ({
      id: topic.id,
      title: topic.title,
      categoryId: topic.categoryId,
      categorySlug: category.slug,
      categoryName: category.name,
      authorId: topic.authorId,
      authorName: author.displayName,
      authorAvatarUrl: author.avatarUrl,
      isPinned: topic.isPinned,
      replyCount: topic.replyCount,
      lastActivityAt: topic.lastActivityAt.toISOString(),
      createdAt: topic.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
  });
});

const createTopicSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(1).max(10000),
  categoryId: z.string().uuid(),
});

router.post("/forum/topics", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = createTopicSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [cat] = await db.select().from(forumCategories).where(eq(forumCategories.id, parsed.data.categoryId)).limit(1);
  if (!cat) return res.status(404).json({ error: "Category not found" });
  if (cat.slug === "announcements" && u.role !== "admin") {
    return res.status(403).json({ error: "Only admins may post in Announcements" });
  }

  const [topic] = await db
    .insert(forumTopics)
    .values({
      title: parsed.data.title,
      body: parsed.data.body,
      categoryId: parsed.data.categoryId,
      authorId: u.id,
    })
    .returning();
  res.status(201).json({ id: topic.id });
});

router.get("/forum/topics/:topicId", async (req, res: Response) => {
  const [row] = await db
    .select({ topic: forumTopics, author: users, category: forumCategories })
    .from(forumTopics)
    .innerJoin(users, eq(users.id, forumTopics.authorId))
    .innerJoin(forumCategories, eq(forumCategories.id, forumTopics.categoryId))
    .where(eq(forumTopics.id, req.params.topicId))
    .limit(1);
  if (!row || row.topic.isRemoved) return res.status(404).json({ error: "Topic not found" });

  const replies = await db
    .select({ reply: forumReplies, author: users })
    .from(forumReplies)
    .innerJoin(users, eq(users.id, forumReplies.authorId))
    .where(and(eq(forumReplies.topicId, row.topic.id), eq(forumReplies.isRemoved, false)))
    .orderBy(forumReplies.createdAt);

  res.json({
    id: row.topic.id,
    title: row.topic.title,
    body: row.topic.body,
    categoryId: row.topic.categoryId,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    authorId: row.topic.authorId,
    authorName: row.author.displayName,
    authorAvatarUrl: row.author.avatarUrl,
    isPinned: row.topic.isPinned,
    createdAt: row.topic.createdAt.toISOString(),
    replies: replies.map(({ reply, author }) => ({
      id: reply.id,
      body: reply.body,
      authorId: reply.authorId,
      authorName: author.displayName,
      authorAvatarUrl: author.avatarUrl,
      createdAt: reply.createdAt.toISOString(),
    })),
  });
});

const replySchema = z.object({ body: z.string().min(1).max(10000) });
router.post("/forum/topics/:topicId/replies", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [topic] = await db.select().from(forumTopics).where(eq(forumTopics.id, req.params.topicId)).limit(1);
  if (!topic || topic.isRemoved) return res.status(404).json({ error: "Topic not found" });

  await db.transaction(async (tx) => {
    await tx.insert(forumReplies).values({ topicId: topic.id, authorId: u.id, body: parsed.data.body });
    await tx
      .update(forumTopics)
      .set({ replyCount: topic.replyCount + 1, lastActivityAt: new Date() })
      .where(eq(forumTopics.id, topic.id));
  });
  res.status(201).json({ ok: true });
});

const flagSchema = z.object({ reason: z.string().min(3).max(500), postType: z.enum(["topic", "reply"]) });
router.post("/forum/posts/:postId/flag", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = flagSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  await db.insert(contentFlags).values({
    postType: parsed.data.postType,
    postId: req.params.postId,
    flaggedById: u.id,
    reason: parsed.data.reason,
  });
  res.status(201).json({ ok: true });
});

export default router;
