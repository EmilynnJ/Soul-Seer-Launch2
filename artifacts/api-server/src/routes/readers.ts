import { Router, type IRouter, type Response } from "express";
import { db, readers, users, reviews, sessions } from "@workspace/db";
import { eq, desc, and, sql, inArray, like, or } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { serializeReader, serializeReaderDetail, getReaderRecentReviews } from "../lib/serializers";
import { z } from "zod";

const router: IRouter = Router();

router.get("/readers", async (req, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const service = typeof req.query.service === "string" ? req.query.service : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";

  const filters = [];
  if (status === "online") filters.push(eq(readers.status, "online"));
  if (status === "busy") filters.push(eq(readers.status, "busy"));

  let rows = await db
    .select({ reader: readers, user: users })
    .from(readers)
    .innerJoin(users, eq(users.id, readers.userId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(readers.rating));

  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      ({ reader, user }) =>
        user.displayName.toLowerCase().includes(s) ||
        (reader.tagline ?? "").toLowerCase().includes(s) ||
        (reader.specialties ?? []).some((sp) => sp.toLowerCase().includes(s)),
    );
  }

  if (service === "chat") rows = rows.filter((r) => r.reader.ratePerMinChatCents > 0);
  if (service === "phone") rows = rows.filter((r) => r.reader.ratePerMinPhoneCents > 0);
  if (service === "video") rows = rows.filter((r) => r.reader.ratePerMinVideoCents > 0);

  res.json(rows.map(({ reader, user }) => serializeReader(reader, user)));
});

router.get("/readers/online", async (_req, res: Response) => {
  const rows = await db
    .select({ reader: readers, user: users })
    .from(readers)
    .innerJoin(users, eq(users.id, readers.userId))
    .where(eq(readers.status, "online"))
    .orderBy(desc(readers.rating));
  res.json(rows.map(({ reader, user }) => serializeReader(reader, user)));
});

router.get("/readers/me/profile", requireAuth(["reader", "admin"]), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [row] = await db
    .select({ reader: readers, user: users })
    .from(readers)
    .innerJoin(users, eq(users.id, readers.userId))
    .where(eq(readers.userId, u.id))
    .limit(1);
  if (!row) return res.status(404).json({ error: "Not a reader" });
  res.json(serializeReaderDetail(row.reader, row.user, [], []));
});

const updateReaderSchema = z.object({
  tagline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  specialties: z.array(z.string()).max(20).optional(),
  ratePerMinChatCents: z.number().int().min(0).max(99999).optional(),
  ratePerMinPhoneCents: z.number().int().min(0).max(99999).optional(),
  ratePerMinVideoCents: z.number().int().min(0).max(99999).optional(),
  status: z.enum(["online", "offline", "busy"]).optional(),
});

router.patch("/readers/me/profile", requireAuth(["reader", "admin"]), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = updateReaderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });

  const [reader] = await db
    .update(readers)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(readers.userId, u.id))
    .returning();
  if (!reader) return res.status(404).json({ error: "Not a reader" });
  res.json({ ok: true });
});

router.get("/readers/me/earnings", requireAuth(["reader", "admin"]), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({
      todayCents: sql<number>`COALESCE(SUM(CASE WHEN ${sessions.endedAt} >= ${todayStart} THEN ${sessions.billedCents} ELSE 0 END), 0)::int`,
      lifetimeCents: sql<number>`COALESCE(SUM(${sessions.billedCents}), 0)::int`,
    })
    .from(sessions)
    .where(and(eq(sessions.readerUserId, u.id), eq(sessions.status, "completed")));
  res.json({
    todayCents: row?.todayCents ?? 0,
    lifetimeCents: row?.lifetimeCents ?? 0,
    pendingPayoutCents: u.balanceCents > 0 ? u.balanceCents : 0,
  });
});

router.get("/readers/me/analytics", requireAuth(["reader", "admin"]), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [reviewRow] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)::float`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(reviews)
    .innerJoin(sessions, eq(sessions.id, reviews.sessionId))
    .where(eq(sessions.readerUserId, u.id));
  res.json({
    averageRating: reviewRow?.avg ?? 0,
    totalReviews: reviewRow?.count ?? 0,
  });
});

router.get("/readers/:readerId", async (req, res: Response) => {
  const [row] = await db
    .select({ reader: readers, user: users })
    .from(readers)
    .innerJoin(users, eq(users.id, readers.userId))
    .where(eq(readers.id, req.params.readerId))
    .limit(1);
  if (!row) return res.status(404).json({ error: "Reader not found" });
  const recentReviews = await getReaderRecentReviews(row.reader.id);
  res.json(serializeReaderDetail(row.reader, row.user, [], recentReviews));
});

router.get("/readers/:readerId/reviews", async (req, res: Response) => {
  const recent = await getReaderRecentReviews(req.params.readerId, 50);
  res.json(recent);
});

// Availability stubs (deferred from launch but keep endpoint shapes alive)
router.get("/readers/me/availability", requireAuth(["reader", "admin"]), async (_req, res: Response) => {
  res.json([]);
});
router.put("/readers/me/availability", requireAuth(["reader", "admin"]), async (_req, res: Response) => {
  res.json({ ok: true });
});

// "me" sessions and favorites under /me
router.get("/me/sessions", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await db
    .select()
    .from(sessions)
    .where(or(eq(sessions.clientUserId, u.id), eq(sessions.readerUserId, u.id)))
    .orderBy(desc(sessions.createdAt))
    .limit(limit);
  res.json(
    rows.map((s) => ({
      id: s.id,
      readerId: s.readerId,
      service: s.service,
      status: s.status,
      ratePerMinCents: s.ratePerMinCents,
      billedSeconds: s.billedSeconds,
      billedCents: s.billedCents,
      channelName: s.channelName,
      createdAt: s.createdAt.toISOString(),
      startedAt: s.startedAt?.toISOString() ?? null,
      endedAt: s.endedAt?.toISOString() ?? null,
    })),
  );
});

router.get("/me/favorites", requireAuth(), async (_req, res: Response) => {
  res.json([]);
});

const addFavoriteSchema = z.object({ readerId: z.string().uuid() });
router.post("/me/favorites", requireAuth(), async (req, res: Response) => {
  const parsed = addFavoriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  res.status(204).end();
});

router.delete("/me/favorites/:readerId", requireAuth(), async (_req, res: Response) => {
  res.status(204).end();
});

export default router;
