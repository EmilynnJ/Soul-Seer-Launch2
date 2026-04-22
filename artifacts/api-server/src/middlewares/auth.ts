import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, users, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  clerkUserId: string;
  user: User;
}

async function ensureUser(clerkUserId: string, claims: Record<string, unknown> | undefined): Promise<User> {
  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (existing.length > 0) return existing[0];

  const displayName =
    (claims?.firstName as string) ||
    (claims?.username as string) ||
    (claims?.fullName as string) ||
    (claims?.email as string)?.split("@")[0] ||
    "Seeker";
  const email = (claims?.email as string) || null;
  const avatarUrl = (claims?.imageUrl as string) || null;

  const inserted = await db
    .insert(users)
    .values({
      clerkUserId,
      role: "client",
      displayName,
      email,
      avatarUrl,
    })
    .returning();
  return inserted[0];
}

export function requireAuth(roles?: Array<"client" | "reader" | "admin">) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const claims = (auth?.sessionClaims ?? {}) as Record<string, unknown>;
      const user = await ensureUser(clerkUserId, claims);

      if (user.status === "banned") {
        return res.status(403).json({ error: "Account banned" });
      }
      if (roles && !roles.includes(user.role)) {
        return res.status(403).json({ error: `Forbidden — requires role ${roles.join("/")}` });
      }

      (req as AuthenticatedRequest).clerkUserId = clerkUserId;
      (req as AuthenticatedRequest).user = user;
      next();
    } catch (err) {
      req.log?.error({ err }, "auth middleware error");
      res.status(500).json({ error: "Auth error" });
    }
  };
}

export async function getOptionalUser(req: Request): Promise<User | null> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return null;
  const claims = (auth?.sessionClaims ?? {}) as Record<string, unknown>;
  return ensureUser(clerkUserId, claims);
}
