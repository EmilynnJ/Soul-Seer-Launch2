import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import {
  db,
  users,
  readers,
  sessions,
  transactions,
  contentFlags,
  announcements,
  forumTopics,
  forumReplies,
} from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { randomBytes } from "node:crypto";

const router: IRouter = Router();

router.get("/admin/overview", requireAuth(["admin"]), async (_req, res: Response) => {
  const [counts] = await db
    .select({
      totalUsers: sql<number>`(SELECT COUNT(*)::int FROM ${users})`,
      totalReaders: sql<number>`(SELECT COUNT(*)::int FROM ${users} WHERE ${users.role} = 'reader')`,
      totalClients: sql<number>`(SELECT COUNT(*)::int FROM ${users} WHERE ${users.role} = 'client')`,
      readersOnline: sql<number>`(SELECT COUNT(*)::int FROM ${readers} WHERE ${readers.status} = 'online')`,
      sessionsToday: sql<number>`(SELECT COUNT(*)::int FROM ${sessions} WHERE ${sessions.createdAt} >= CURRENT_DATE)`,
      sessionsLast7Days: sql<number>`(SELECT COUNT(*)::int FROM ${sessions} WHERE ${sessions.createdAt} >= CURRENT_DATE - INTERVAL '7 days')`,
      revenueTodayCents: sql<number>`(SELECT COALESCE(SUM(${sessions.billedCents}), 0)::int FROM ${sessions} WHERE ${sessions.endedAt} >= CURRENT_DATE)`,
      revenueMonthCents: sql<number>`(SELECT COALESCE(SUM(${sessions.billedCents}), 0)::int FROM ${sessions} WHERE ${sessions.endedAt} >= date_trunc('month', CURRENT_DATE))`,
      openFlags: sql<number>`(SELECT COUNT(*)::int FROM ${contentFlags} WHERE ${contentFlags.status} = 'open')`,
    })
    .from(sql`(SELECT 1) AS dummy`);

  const platformShare = Math.floor((counts.revenueMonthCents ?? 0) * 0.3);
  const readerShare = (counts.revenueMonthCents ?? 0) - platformShare;

  const dailyRows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${sessions.endedAt}), 'YYYY-MM-DD')`,
      revenueCents: sql<number>`COALESCE(SUM(${sessions.billedCents}), 0)::int`,
      sessions: sql<number>`COUNT(*)::int`,
    })
    .from(sessions)
    .where(sql`${sessions.endedAt} >= CURRENT_DATE - INTERVAL '30 days' AND ${sessions.status} = 'completed'`)
    .groupBy(sql`date_trunc('day', ${sessions.endedAt})`)
    .orderBy(sql`date_trunc('day', ${sessions.endedAt})`);

  res.json({
    ...counts,
    platformShareCents: platformShare,
    readerShareCents: readerShare,
    revenueByDay: dailyRows,
  });
});

router.get("/admin/users", requireAuth(["admin"]), async (req, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
  res.json(
    rows.map((u) => ({
      id: u.id,
      role: u.role,
      status: u.status,
      displayName: u.displayName,
      email: u.email,
      balanceCents: u.balanceCents,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

const updateUserSchema = z.object({
  status: z.enum(["active", "restricted", "banned"]).optional(),
  role: z.enum(["client", "reader", "admin"]).optional(),
  balanceAdjustmentCents: z.number().int().optional(),
  adjustmentReason: z.string().max(500).optional(),
});

router.patch("/admin/users/:userId", requireAuth(["admin"]), async (req, res: Response) => {
  const admin = (req as AuthenticatedRequest).user;
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  await db.transaction(async (tx) => {
    const [u] = await tx.select().from(users).where(eq(users.id, req.params.userId)).for("update").limit(1);
    if (!u) throw new Error("User not found");
    const updates: Partial<typeof users.$inferInsert> = {};
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.role) updates.role = parsed.data.role;
    if (parsed.data.balanceAdjustmentCents) {
      const newBal = u.balanceCents + parsed.data.balanceAdjustmentCents;
      updates.balanceCents = newBal;
      await tx.insert(transactions).values({
        userId: u.id,
        kind: "adjustment",
        amountCents: parsed.data.balanceAdjustmentCents,
        balanceAfterCents: newBal,
        description: parsed.data.adjustmentReason
          ? `Admin adjustment: ${parsed.data.adjustmentReason}`
          : `Admin adjustment by ${admin.displayName}`,
      });
    }
    if (Object.keys(updates).length > 0) {
      await tx.update(users).set(updates).where(eq(users.id, u.id));
    }
  });
  res.json({ ok: true });
});

const createReaderSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  authUserId: z.string().min(1).max(200),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  specialties: z.array(z.string()).max(20).optional(),
  ratePerMinChatCents: z.number().int().min(0).max(99999).optional(),
  ratePerMinPhoneCents: z.number().int().min(0).max(99999).optional(),
  ratePerMinVideoCents: z.number().int().min(0).max(99999).optional(),
  avatarUrl: z.string().url().optional(),
});

router.post("/admin/readers", requireAuth(["admin"]), async (req, res: Response) => {
  const parsed = createReaderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });

  const generatedPassword = randomBytes(9).toString("base64url");

  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        authUserId: parsed.data.authUserId,
        role: "reader",
        displayName: parsed.data.displayName,
        email: parsed.data.email,
        avatarUrl: parsed.data.avatarUrl ?? null,
      })
      .returning();
    const [reader] = await tx
      .insert(readers)
      .values({
        userId: user.id,
        tagline: parsed.data.tagline ?? null,
        bio: parsed.data.bio ?? null,
        specialties: parsed.data.specialties ?? [],
        ratePerMinChatCents: parsed.data.ratePerMinChatCents ?? 299,
        ratePerMinPhoneCents: parsed.data.ratePerMinPhoneCents ?? 499,
        ratePerMinVideoCents: parsed.data.ratePerMinVideoCents ?? 699,
      })
      .returning();
    return { userId: user.id, readerId: reader.id };
  });

  res.status(201).json({
    ...result,
    initialPassword: generatedPassword,
    note: "Hand the initial password to the reader. They should change it on first sign-in.",
  });
});

const adminUpdateReaderSchema = z.object({
  tagline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  specialties: z.array(z.string()).max(20).optional(),
  ratePerMinChatCents: z.number().int().min(0).max(99999).optional(),
  ratePerMinPhoneCents: z.number().int().min(0).max(99999).optional(),
  ratePerMinVideoCents: z.number().int().min(0).max(99999).optional(),
  status: z.enum(["online", "offline", "busy"]).optional(),
});

router.patch("/admin/readers/:readerId", requireAuth(["admin"]), async (req, res: Response) => {
  const parsed = adminUpdateReaderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const [updated] = await db
    .update(readers)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(readers.id, req.params.readerId))
    .returning();
  if (!updated) return res.status(404).json({ error: "Reader not found" });
  res.json({ ok: true });
});

router.get("/admin/transactions", requireAuth(["admin"]), async (req, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = await db
    .select({ tx: transactions, user: users })
    .from(transactions)
    .innerJoin(users, eq(users.id, transactions.userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
  res.json(
    rows.map(({ tx, user }) => ({
      id: tx.id,
      userId: tx.userId,
      userName: user.displayName,
      kind: tx.kind,
      amountCents: tx.amountCents,
      balanceAfterCents: tx.balanceAfterCents,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
    })),
  );
});

const refundSchema = z.object({ reason: z.string().min(3).max(500) });
router.post("/admin/transactions/:transactionId/refund", requireAuth(["admin"]), async (req, res: Response) => {
  const parsed = refundSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  await db.transaction(async (tx) => {
    const [original] = await tx.select().from(transactions).where(eq(transactions.id, req.params.transactionId)).limit(1);
    if (!original) throw new Error("Transaction not found");
    const [user] = await tx.select().from(users).where(eq(users.id, original.userId)).for("update").limit(1);
    if (!user) throw new Error("User not found");
    const refundAmount = -original.amountCents;
    const newBal = user.balanceCents + refundAmount;
    await tx.update(users).set({ balanceCents: newBal }).where(eq(users.id, user.id));
    await tx.insert(transactions).values({
      userId: user.id,
      kind: "refund",
      amountCents: refundAmount,
      balanceAfterCents: newBal,
      description: `Refund: ${parsed.data.reason}`,
    });
  });
  res.json({ ok: true });
});

router.get("/admin/flags", requireAuth(["admin"]), async (_req, res: Response) => {
  const rows = await db
    .select({ flag: contentFlags, flaggedBy: users })
    .from(contentFlags)
    .innerJoin(users, eq(users.id, contentFlags.flaggedById))
    .orderBy(desc(contentFlags.createdAt));
  res.json(
    rows.map(({ flag, flaggedBy }) => ({
      id: flag.id,
      postType: flag.postType,
      postId: flag.postId,
      reason: flag.reason,
      status: flag.status,
      flaggedByName: flaggedBy.displayName,
      createdAt: flag.createdAt.toISOString(),
    })),
  );
});

const resolveFlagSchema = z.object({
  action: z.enum(["dismiss", "remove"]),
  note: z.string().max(500).optional(),
});

router.post("/admin/flags/:flagId/resolve", requireAuth(["admin"]), async (req, res: Response) => {
  const admin = (req as AuthenticatedRequest).user;
  const parsed = resolveFlagSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  await db.transaction(async (tx) => {
    const [flag] = await tx.select().from(contentFlags).where(eq(contentFlags.id, req.params.flagId)).limit(1);
    if (!flag) throw new Error("Flag not found");

    if (parsed.data.action === "remove") {
      if (flag.postType === "topic")
        await tx.update(forumTopics).set({ isRemoved: true }).where(eq(forumTopics.id, flag.postId));
      else
        await tx.update(forumReplies).set({ isRemoved: true }).where(eq(forumReplies.id, flag.postId));
    }
    await tx
      .update(contentFlags)
      .set({
        status: parsed.data.action === "remove" ? "removed" : "dismissed",
        resolvedById: admin.id,
        resolvedNote: parsed.data.note ?? null,
        resolvedAt: new Date(),
      })
      .where(eq(contentFlags.id, flag.id));
  });
  res.json({ ok: true });
});

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  isPinned: z.boolean().optional(),
});

router.post("/admin/announcements", requireAuth(["admin"]), async (req, res: Response) => {
  const admin = (req as AuthenticatedRequest).user;
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const [a] = await db
    .insert(announcements)
    .values({
      title: parsed.data.title,
      body: parsed.data.body,
      isPinned: parsed.data.isPinned ?? false,
      createdById: admin.id,
    })
    .returning();
  res.status(201).json({ id: a.id });
});

export default router;
