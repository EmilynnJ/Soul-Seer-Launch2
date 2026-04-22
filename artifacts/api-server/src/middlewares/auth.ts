import type { Request, Response, NextFunction } from "express";
import { auth as jwtAuth, type AuthResult } from "express-oauth2-jwt-bearer";
import { db, users, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || process.env.AUTH0_APP_ID || "";
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || process.env.AUTH0_IDENTIFIER || "";

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
  // eslint-disable-next-line no-console
  console.warn("[auth] Missing AUTH0_DOMAIN/AUTH0_APP_ID or AUTH0_AUDIENCE/AUTH0_IDENTIFIER; auth will fail until configured");
}

const issuerBaseURL = AUTH0_DOMAIN
  ? AUTH0_DOMAIN.startsWith("http")
    ? AUTH0_DOMAIN
    : `https://${AUTH0_DOMAIN}`
  : undefined;

export const verifyJwt = jwtAuth({
  audience: AUTH0_AUDIENCE,
  issuerBaseURL,
  tokenSigningAlg: "RS256",
});

export interface AuthenticatedRequest extends Request {
  auth?: AuthResult;
  authUserSub: string;
  user: User;
}

interface Claims {
  sub?: string;
  email?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  given_name?: string;
  [key: string]: unknown;
}

async function ensureUser(claims: Claims): Promise<User> {
  const sub = claims.sub!;
  const existing = await db.select().from(users).where(eq(users.authUserId, sub)).limit(1);
  if (existing.length > 0) return existing[0];

  const displayName =
    claims.given_name ||
    claims.nickname ||
    claims.name ||
    (claims.email?.split("@")[0]) ||
    "Seeker";

  const inserted = await db
    .insert(users)
    .values({
      authUserId: sub,
      role: "client",
      displayName,
      email: claims.email ?? null,
      avatarUrl: claims.picture ?? null,
    })
    .returning();
  return inserted[0];
}

export function requireAuth(roles?: Array<"client" | "reader" | "admin">) {
  return [
    verifyJwt,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = (req as AuthenticatedRequest).auth?.payload as Claims | undefined;
        if (!payload?.sub) return res.status(401).json({ error: "Unauthorized" });

        const user = await ensureUser(payload);
        if (user.status === "banned") return res.status(403).json({ error: "Account banned" });
        if (roles && !roles.includes(user.role))
          return res.status(403).json({ error: `Forbidden — requires role ${roles.join("/")}` });

        (req as AuthenticatedRequest).authUserSub = payload.sub;
        (req as AuthenticatedRequest).user = user;
        next();
      } catch (err) {
        (req as Request).log?.error({ err }, "auth middleware error");
        if ((err as { status?: number }).status === 401) {
          return res.status(401).json({ error: "Invalid or expired token" });
        }
        res.status(500).json({ error: "Auth error" });
      }
    },
  ];
}
