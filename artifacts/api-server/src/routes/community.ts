import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, announcements, newsletterSubscribers } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/community/announcements", async (_req, res: Response) => {
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt))
    .limit(20);
  res.json(
    rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      isPinned: a.isPinned,
      createdAt: a.createdAt.toISOString(),
    })),
  );
});

router.get("/community/links", async (_req, res: Response) => {
  res.json({
    discordUrl: process.env.SOULSEER_DISCORD_URL || "https://discord.gg/soulseer",
    facebookUrl: process.env.SOULSEER_FACEBOOK_URL || "https://facebook.com/soulseer",
  });
});

const newsletterSchema = z.object({ email: z.string().email() });
router.post("/community/newsletter", async (req, res: Response) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email" });
  await db.insert(newsletterSubscribers).values({ email: parsed.data.email }).onConflictDoNothing();
  res.status(201).json({ ok: true });
});

export default router;
