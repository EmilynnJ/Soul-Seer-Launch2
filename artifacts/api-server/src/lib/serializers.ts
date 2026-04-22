import { db, users, readers, reviews, sessions } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

export function serializeMe(u: typeof users.$inferSelect, readerId: string | null, unreadMessages = 0) {
  return {
    id: u.id,
    role: u.role,
    displayName: u.displayName,
    email: u.email ?? undefined,
    avatarUrl: u.avatarUrl,
    balanceCents: u.balanceCents,
    readerId,
    unreadMessages,
  };
}

export function serializeReader(
  r: typeof readers.$inferSelect,
  u: typeof users.$inferSelect,
) {
  return {
    id: r.id,
    displayName: u.displayName,
    tagline: r.tagline,
    avatarUrl: u.avatarUrl,
    status: r.status,
    specialties: r.specialties ?? [],
    ratePerMinChatCents: r.ratePerMinChatCents,
    ratePerMinPhoneCents: r.ratePerMinPhoneCents,
    ratePerMinVideoCents: r.ratePerMinVideoCents,
    rating: r.rating / 100,
    reviewCount: r.reviewCount,
  };
}

export function serializeReaderDetail(
  r: typeof readers.$inferSelect,
  u: typeof users.$inferSelect,
  availability: Array<{ id: string; dayOfWeek: number; startMinute: number; endMinute: number }>,
  recentReviews: Array<unknown>,
) {
  return {
    ...serializeReader(r, u),
    bio: r.bio,
    yearsExperience: r.yearsExperience,
    availability,
    recentReviews,
  };
}

export function serializeSession(s: typeof sessions.$inferSelect, readerName: string, readerAvatar: string | null, clientName: string, clientAvatar: string | null) {
  return {
    id: s.id,
    readerId: s.readerId,
    readerName,
    readerAvatarUrl: readerAvatar,
    clientId: s.clientUserId,
    clientName,
    clientAvatarUrl: clientAvatar,
    service: s.service,
    status: s.status,
    ratePerMinCents: s.ratePerMinCents,
    billedSeconds: s.billedSeconds,
    billedCents: s.billedCents,
    channelName: s.channelName,
    createdAt: s.createdAt.toISOString(),
    startedAt: s.startedAt?.toISOString() ?? null,
    endedAt: s.endedAt?.toISOString() ?? null,
    clientBalanceCentsAtStart: s.clientBalanceAtStartCents,
  };
}

export async function getReaderRecentReviews(readerId: string, limit = 5) {
  const rows = await db
    .select({
      review: reviews,
      client: users,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.clientUserId))
    .where(eq(reviews.readerId, readerId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
  return rows.map(({ review, client }) => ({
    id: review.id,
    sessionId: review.sessionId,
    readerId: review.readerId,
    clientId: review.clientUserId,
    clientName: client.displayName,
    rating: review.rating,
    body: review.body,
    readerResponse: review.readerResponse,
    createdAt: review.createdAt.toISOString(),
  }));
}
