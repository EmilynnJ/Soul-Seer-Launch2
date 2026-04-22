import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, users, transactions } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { getStripeClient, isStripeConfigured } from "../lib/stripeClient";

const router: IRouter = Router();

const topupSchema = z.object({ amountCents: z.number().int().min(500).max(100000) });

router.post("/billing/topup", requireAuth(["client", "admin"]), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = topupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body — amountCents must be 500-100000" });

  if (!(await isStripeConfigured())) {
    return res.status(503).json({ error: "Stripe is not configured for this environment." });
  }

  const stripe = await getStripeClient();
  const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: u.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: parsed.data.amountCents,
          product_data: { name: "SoulSeer balance top-up" },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/wallet?topup=success`,
    cancel_url: `${origin}/wallet?topup=cancel`,
    metadata: { userId: u.id, kind: "balance_topup" },
  });
  res.json({ url: session.url });
});

const autoReloadSchema = z.object({
  enabled: z.boolean(),
  thresholdCents: z.number().int().min(500).max(50000).optional(),
  amountCents: z.number().int().min(500).max(100000).optional(),
});

router.post("/billing/auto-reload", requireAuth(["client", "admin"]), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = autoReloadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  await db
    .update(users)
    .set({
      autoReloadEnabled: parsed.data.enabled,
      autoReloadThresholdCents: parsed.data.thresholdCents ?? null,
      autoReloadAmountCents: parsed.data.amountCents ?? null,
    })
    .where(eq(users.id, u.id));
  res.json({ ok: true });
});

const devCreditSchema = z.object({ amountCents: z.number().int().min(100).max(50000) });

router.post("/billing/dev-credit", requireAuth(), async (req, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Dev credit disabled in production" });
  }
  const u = (req as AuthenticatedRequest).user;
  const parsed = devCreditSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(users).where(eq(users.id, u.id)).for("update").limit(1);
    if (!current) throw new Error("user missing");
    const newBal = current.balanceCents + parsed.data.amountCents;
    await tx.update(users).set({ balanceCents: newBal }).where(eq(users.id, u.id));
    await tx.insert(transactions).values({
      userId: u.id,
      kind: "dev_credit",
      amountCents: parsed.data.amountCents,
      balanceAfterCents: newBal,
      description: "Developer-granted credit",
    });
  });
  res.json({ ok: true });
});

// Stripe webhook (raw body parsed in app.ts)
router.post("/webhooks/stripe", async (req, res: Response) => {
  const sig = req.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return res.status(400).json({ error: "Missing signature or webhook secret" });

  const stripe = await getStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook verification failed: ${(err as Error).message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { userId?: string; kind?: string }; amount_total?: number; payment_intent?: string };
    const userId = session.metadata?.userId;
    const kind = session.metadata?.kind;
    const amountCents = session.amount_total ?? 0;
    if (kind === "balance_topup" && userId && amountCents > 0) {
      await db.transaction(async (tx) => {
        const [current] = await tx.select().from(users).where(eq(users.id, userId)).for("update").limit(1);
        if (!current) return;
        const newBal = current.balanceCents + amountCents;
        await tx.update(users).set({ balanceCents: newBal, stripeCustomerId: current.stripeCustomerId ?? null }).where(eq(users.id, userId));
        await tx.insert(transactions).values({
          userId,
          kind: "topup",
          amountCents,
          balanceAfterCents: newBal,
          stripeRef: typeof session.payment_intent === "string" ? session.payment_intent : null,
          description: "Stripe top-up",
        });
      });
    }
  }
  res.json({ received: true });
});

export default router;
