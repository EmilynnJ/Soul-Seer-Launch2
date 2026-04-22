import { Router, type IRouter, type Response } from "express";
import { db, users, readers, transactions } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/me", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const [reader] = await db.select().from(readers).where(eq(readers.userId, u.id)).limit(1);

  res.json({
    id: u.id,
    role: u.role,
    displayName: u.displayName,
    email: u.email ?? undefined,
    avatarUrl: u.avatarUrl,
    balanceCents: u.balanceCents,
    readerId: reader?.id ?? null,
    unreadMessages: 0,
  });
});

router.get("/me/balance", requireAuth(["client", "admin"]), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  res.json({
    balanceCents: u.balanceCents,
    autoReloadEnabled: u.autoReloadEnabled,
    autoReloadThresholdCents: u.autoReloadThresholdCents ?? null,
    autoReloadAmountCents: u.autoReloadAmountCents ?? null,
  });
});

router.get("/me/transactions", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, u.id))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
  res.json(
    rows.map((t) => ({
      id: t.id,
      kind: t.kind,
      amountCents: t.amountCents,
      balanceAfterCents: t.balanceAfterCents,
      sessionId: t.sessionId ?? null,
      description: t.description ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  );
});

export default router;
