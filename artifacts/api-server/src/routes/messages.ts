import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Direct messaging is deferred from launch per task scope.
// Admin contact channel remains available.

router.get("/messages/threads", requireAuth(), async (_req, res: Response) => {
  res.json([]);
});

router.get("/messages/threads/:threadId", requireAuth(), async (_req, res: Response) => {
  res.status(404).json({ error: "Direct messaging is not available in this launch." });
});

router.post("/messages/threads/with/:userId", requireAuth(), async (_req, res: Response) => {
  res.status(503).json({ error: "Direct messaging is not available in this launch." });
});

router.post("/messages/threads/:threadId/messages", requireAuth(), async (_req, res: Response) => {
  res.status(503).json({ error: "Direct messaging is not available in this launch." });
});

const adminMsgSchema = z.object({ body: z.string().min(1).max(4000) });
router.post("/messages/admin", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = adminMsgSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  logger.info({ userId: u.id, email: u.email, body: parsed.data.body }, "[admin-contact] received");
  res.status(201).json({ ok: true });
});

export default router;
