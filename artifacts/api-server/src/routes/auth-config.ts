import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/auth/config", (_req, res) => {
  const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_APP_ID || "";
  const clientId = process.env.AUTH0_CLIENT_ID || "";
  const audience = process.env.AUTH0_AUDIENCE || process.env.AUTH0_IDENTIFIER || "";
  res.json({
    domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    clientId,
    audience,
    configured: Boolean(domain && clientId && audience),
  });
});

export default router;
