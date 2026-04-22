import { Router, type IRouter, type Request, type Response } from "express";
import { db, sessions, readers, users, reviews, transactions, sessionMessages } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { serializeSession } from "../lib/serializers";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

const requestSchema = z.object({
  readerId: z.string().uuid(),
  service: z.enum(["chat", "phone", "video"]),
});

const PLATFORM_CUT = 0.3;
const READER_CUT = 0.7;
const MIN_BALANCE_CENTS = 500;

async function loadSession(sessionId: string) {
  const [row] = await db
    .select({ s: sessions, reader: readers, readerUser: users })
    .from(sessions)
    .innerJoin(readers, eq(readers.id, sessions.readerId))
    .innerJoin(users, eq(users.id, readers.userId))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return row;
}

async function loadParticipants(s: typeof sessions.$inferSelect) {
  const rows = await db.select().from(users).where(sql`${users.id} IN (${s.readerUserId}, ${s.clientUserId})`);
  const reader = rows.find((u) => u.id === s.readerUserId)!;
  const client = rows.find((u) => u.id === s.clientUserId)!;
  return { reader, client };
}

router.post("/sessions", requireAuth(["client", "admin"]), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  if (u.balanceCents < MIN_BALANCE_CENTS) {
    return res.status(402).json({ error: `Minimum balance of $${MIN_BALANCE_CENTS / 100} required` });
  }

  const [reader] = await db.select().from(readers).where(eq(readers.id, parsed.data.readerId)).limit(1);
  if (!reader) return res.status(404).json({ error: "Reader not found" });
  if (reader.status !== "online") return res.status(409).json({ error: "Reader is not currently available" });

  const rate =
    parsed.data.service === "chat"
      ? reader.ratePerMinChatCents
      : parsed.data.service === "phone"
        ? reader.ratePerMinPhoneCents
        : reader.ratePerMinVideoCents;

  const [created] = await db
    .insert(sessions)
    .values({
      readerId: reader.id,
      readerUserId: reader.userId,
      clientUserId: u.id,
      service: parsed.data.service,
      ratePerMinCents: rate,
      channelName: `ss-${randomUUID().slice(0, 16)}`,
      status: "pending",
    })
    .returning();

  return res.status(201).json({ id: created.id, channelName: created.channelName, status: created.status });
});

router.get("/sessions/:sessionId", requireAuth(), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const row = await loadSession(req.params["sessionId"] as string);
  if (!row) return res.status(404).json({ error: "Session not found" });
  if (row.s.readerUserId !== u.id && row.s.clientUserId !== u.id && u.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { reader, client } = await loadParticipants(row.s);
  return res.json(serializeSession(row.s, reader.displayName, reader.avatarUrl, client.displayName, client.avatarUrl));
});

router.post("/sessions/:sessionId/accept", requireAuth(["reader", "admin"]), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.readerUserId !== u.id && u.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  if (s.status !== "pending") return res.status(409).json({ error: `Session is ${s.status}` });

  await db.update(sessions).set({ status: "accepted" }).where(eq(sessions.id, s.id));
  return res.json({ ok: true });
});

router.post("/sessions/:sessionId/decline", requireAuth(["reader", "admin"]), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.readerUserId !== u.id && u.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  if (s.status !== "pending") return res.status(409).json({ error: `Session is ${s.status}` });
  await db.update(sessions).set({ status: "declined" }).where(eq(sessions.id, s.id));
  return res.json({ ok: true });
});

router.post("/sessions/:sessionId/start", requireAuth(), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.readerUserId !== u.id && s.clientUserId !== u.id && u.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  if (s.status === "in_progress") return res.json({ ok: true, alreadyStarted: true });
  if (s.status !== "accepted" && s.status !== "pending")
    return res.status(409).json({ error: `Cannot start a ${s.status} session` });

  const [client] = await db.select().from(users).where(eq(users.id, s.clientUserId)).limit(1);
  await db
    .update(sessions)
    .set({
      status: "in_progress",
      startedAt: new Date(),
      lastTickAt: new Date(),
      clientBalanceAtStartCents: client?.balanceCents ?? 0,
    })
    .where(eq(sessions.id, s.id));
  return res.json({ ok: true });
});

// Per-minute billing tick — atomic. Either party (or a server cron) can call.
router.post("/sessions/:sessionId/tick", requireAuth(), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.readerUserId !== u.id && s.clientUserId !== u.id && u.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  if (s.status !== "in_progress") return res.status(409).json({ error: `Session is ${s.status}` });

  const result = await db.transaction(async (tx) => {
    const [client] = await tx.select().from(users).where(eq(users.id, s.clientUserId)).for("update").limit(1);
    const [reader] = await tx.select().from(users).where(eq(users.id, s.readerUserId)).for("update").limit(1);
    if (!client || !reader) throw new Error("missing participant");

    if (client.balanceCents < s.ratePerMinCents) {
      // insufficient balance — auto end
      await tx
        .update(sessions)
        .set({ status: "completed", endedAt: new Date() })
        .where(eq(sessions.id, s.id));
      return { ended: true, billedCents: s.billedCents } as const;
    }

    const charge = s.ratePerMinCents;
    const readerEarn = Math.floor(charge * READER_CUT);

    const newClientBalance = client.balanceCents - charge;
    const newReaderBalance = reader.balanceCents + readerEarn;
    await tx.update(users).set({ balanceCents: newClientBalance }).where(eq(users.id, client.id));
    await tx.update(users).set({ balanceCents: newReaderBalance }).where(eq(users.id, reader.id));

    await tx.insert(transactions).values([
      {
        userId: client.id,
        kind: "session_charge",
        amountCents: -charge,
        balanceAfterCents: newClientBalance,
        sessionId: s.id,
        description: "Reading minute charge",
      },
      {
        userId: reader.id,
        kind: "session_charge",
        amountCents: readerEarn,
        balanceAfterCents: newReaderBalance,
        sessionId: s.id,
        description: "Reading minute earnings",
      },
    ]);

    await tx
      .update(sessions)
      .set({
        billedSeconds: s.billedSeconds + 60,
        billedCents: s.billedCents + charge,
        lastTickAt: new Date(),
      })
      .where(eq(sessions.id, s.id));

    return { ended: false, billedCents: s.billedCents + charge, remainingBalanceCents: newClientBalance } as const;
  });

  res.json(result);
});

router.post("/sessions/:sessionId/end", requireAuth(), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.readerUserId !== u.id && s.clientUserId !== u.id && u.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  if (s.status === "completed") return res.json({ ok: true, alreadyCompleted: true });

  await db
    .update(sessions)
    .set({ status: "completed", endedAt: new Date() })
    .where(eq(sessions.id, s.id));
  return res.json({ ok: true });
});

router.get("/sessions/:sessionId/messages", requireAuth(), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.readerUserId !== u.id && s.clientUserId !== u.id && u.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const rows = await db
    .select()
    .from(sessionMessages)
    .where(eq(sessionMessages.sessionId, s.id))
    .orderBy(sessionMessages.createdAt);
  return res.json(
    rows.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  );
});

const postMessageSchema = z.object({ body: z.string().min(1).max(4000) });
router.post("/sessions/:sessionId/messages", requireAuth(), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = postMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.readerUserId !== u.id && s.clientUserId !== u.id) return res.status(403).json({ error: "Forbidden" });
  const [m] = await db
    .insert(sessionMessages)
    .values({ sessionId: s.id, senderId: u.id, body: parsed.data.body })
    .returning();
  return res.status(201).json({ id: m.id, body: m.body, senderId: m.senderId, createdAt: m.createdAt.toISOString() });
});

const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), body: z.string().max(2000).optional() });
router.post("/sessions/:sessionId/review", requireAuth(["client", "admin"]), async (req: Request, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const [s] = await db.select().from(sessions).where(eq(sessions.id, req.params["sessionId"] as string)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.clientUserId !== u.id) return res.status(403).json({ error: "Forbidden" });

  await db.transaction(async (tx) => {
    await tx
      .insert(reviews)
      .values({
        sessionId: s.id,
        readerId: s.readerId,
        clientUserId: u.id,
        rating: parsed.data.rating,
        body: parsed.data.body ?? null,
      })
      .onConflictDoUpdate({
        target: reviews.sessionId,
        set: { rating: parsed.data.rating, body: parsed.data.body ?? null },
      });
    // Recompute reader rating
    const [stat] = await tx
      .select({
        avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)::float`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.readerId, s.readerId));
    await tx
      .update(readers)
      .set({ rating: Math.round((stat.avg ?? 0) * 100), reviewCount: stat.count ?? 0 })
      .where(eq(readers.id, s.readerId));
  });
  return res.status(201).json({ ok: true });
});

export default router;
