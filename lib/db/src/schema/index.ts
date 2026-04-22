import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["client", "reader", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "restricted", "banned"]);
export const readerStatusEnum = pgEnum("reader_status", ["online", "offline", "busy"]);
export const serviceTypeEnum = pgEnum("service_type", ["chat", "phone", "video"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "declined",
  "cancelled",
  "failed",
]);
export const transactionKindEnum = pgEnum("transaction_kind", [
  "topup",
  "session_charge",
  "refund",
  "payout",
  "adjustment",
  "dev_credit",
]);
export const flagStatusEnum = pgEnum("flag_status", ["open", "dismissed", "removed"]);
export const flagPostTypeEnum = pgEnum("flag_post_type", ["topic", "reply"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authUserId: text("auth_user_id").notNull().unique(),
    role: userRoleEnum("role").notNull().default("client"),
    status: userStatusEnum("status").notNull().default("active"),
    displayName: text("display_name").notNull(),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    balanceCents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
    autoReloadEnabled: boolean("auto_reload_enabled").notNull().default(false),
    autoReloadThresholdCents: integer("auto_reload_threshold_cents"),
    autoReloadAmountCents: integer("auto_reload_amount_cents"),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role), index("users_auth_idx").on(t.authUserId)],
);

export const readers = pgTable(
  "readers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    tagline: text("tagline"),
    bio: text("bio"),
    specialties: text("specialties").array().notNull().default(sql`ARRAY[]::text[]`),
    yearsExperience: integer("years_experience"),
    ratePerMinChatCents: integer("rate_per_min_chat_cents").notNull().default(299),
    ratePerMinPhoneCents: integer("rate_per_min_phone_cents").notNull().default(499),
    ratePerMinVideoCents: integer("rate_per_min_video_cents").notNull().default(699),
    status: readerStatusEnum("status").notNull().default("offline"),
    rating: integer("rating_x100").notNull().default(0), // 0..500 (rating * 100)
    reviewCount: integer("review_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("readers_status_idx").on(t.status)],
);

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readerId: uuid("reader_id")
      .notNull()
      .references(() => readers.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (t) => [index("avail_reader_idx").on(t.readerId)],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readerId: uuid("reader_id")
      .notNull()
      .references(() => readers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favorites_pk").on(t.userId, t.readerId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readerId: uuid("reader_id")
      .notNull()
      .references(() => readers.id, { onDelete: "restrict" }),
    readerUserId: uuid("reader_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    clientUserId: uuid("client_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    service: serviceTypeEnum("service").notNull(),
    status: sessionStatusEnum("status").notNull().default("pending"),
    ratePerMinCents: integer("rate_per_min_cents").notNull(),
    billedSeconds: integer("billed_seconds").notNull().default(0),
    billedCents: integer("billed_cents").notNull().default(0),
    channelName: text("channel_name").notNull(),
    clientBalanceAtStartCents: integer("client_balance_at_start_cents"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    lastTickAt: timestamp("last_tick_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sessions_reader_idx").on(t.readerUserId),
    index("sessions_client_idx").on(t.clientUserId),
    index("sessions_status_idx").on(t.status),
  ],
);

export const sessionMessages = pgTable(
  "session_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("smsg_session_idx").on(t.sessionId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .unique()
      .references(() => sessions.id, { onDelete: "cascade" }),
    readerId: uuid("reader_id")
      .notNull()
      .references(() => readers.id, { onDelete: "cascade" }),
    clientUserId: uuid("client_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    rating: integer("rating").notNull(),
    body: text("body"),
    readerResponse: text("reader_response"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reviews_reader_idx").on(t.readerId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    kind: transactionKindEnum("kind").notNull(),
    amountCents: integer("amount_cents").notNull(),
    balanceAfterCents: bigint("balance_after_cents", { mode: "number" }).notNull(),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    description: text("description"),
    stripeRef: text("stripe_ref"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tx_user_idx").on(t.userId, t.createdAt),
    index("tx_kind_idx").on(t.kind, t.createdAt),
  ],
);

export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: uuid("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("threads_pair_unique").on(t.userAId, t.userBId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_thread_idx").on(t.threadId, t.createdAt)],
);

export const forumCategories = pgTable("forum_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumTopics = pgTable(
  "forum_topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => forumCategories.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    isPinned: boolean("is_pinned").notNull().default(false),
    isRemoved: boolean("is_removed").notNull().default(false),
    replyCount: integer("reply_count").notNull().default(0),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("topics_cat_idx").on(t.categoryId, t.lastActivityAt)],
);

export const forumReplies = pgTable(
  "forum_replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => forumTopics.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    isRemoved: boolean("is_removed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("replies_topic_idx").on(t.topicId, t.createdAt)],
);

export const contentFlags = pgTable(
  "content_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postType: flagPostTypeEnum("post_type").notNull(),
    postId: uuid("post_id").notNull(),
    flaggedById: uuid("flagged_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: flagStatusEnum("status").notNull().default("open"),
    resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
    resolvedNote: text("resolved_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("flags_status_idx").on(t.status, t.createdAt)],
);

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Reader = typeof readers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
