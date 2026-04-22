import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, sessions } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { RtcRole, RtcTokenBuilder } from "agora-token";

const router: IRouter = Router();

const tokenSchema = z.object({ sessionId: z.string().uuid() });

router.post("/rtc/agora-token", requireAuth(), async (req, res: Response) => {
  const u = (req as AuthenticatedRequest).user;
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [s] = await db.select().from(sessions).where(eq(sessions.id, parsed.data.sessionId)).limit(1);
  if (!s) return res.status(404).json({ error: "Session not found" });
  if (s.clientUserId !== u.id && s.readerUserId !== u.id && u.role !== "admin")
    return res.status(403).json({ error: "Forbidden — not a session participant" });

  const appId = process.env.AGORA_APP_ID;
  const appCert = process.env.AGORA_SECURITY_CERTIFICATE || process.env.AGORA_APP_CERTIFICATE;
  if (!appId || !appCert) {
    return res.status(503).json({ error: "Agora not configured. Set AGORA_APP_ID and AGORA_SECURITY_CERTIFICATE." });
  }

  const expiresInSeconds = 3600;
  const expireAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const uid = u.id.replace(/-/g, "").slice(0, 8); // short unique id per user
  const numericUid = parseInt(uid, 16) % 2_000_000_000;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCert,
    s.channelName,
    numericUid,
    RtcRole.PUBLISHER,
    expireAt,
    expireAt,
  );
  res.json({ appId, channel: s.channelName, uid: numericUid, token, expireAt });
});

router.post("/rtc/ably-token", requireAuth(), async (_req, res: Response) => {
  res.status(503).json({ error: "Ably not configured for this launch — chat uses RTM." });
});

export default router;
