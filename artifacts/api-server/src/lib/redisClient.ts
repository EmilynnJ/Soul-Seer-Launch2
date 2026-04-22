import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) return client;

  const endpoint = process.env.REDIS_DB_ENDPOINT;
  const host = process.env.REDIS_DB_HOST;
  const port = parseInt(process.env.REDIS_DB_PORT || "6379", 10);
  const username = process.env.REDIS_DB_USERNAME || "default";
  const password = process.env.REDIS_DB_PASSWORD;

  if (endpoint) {
    client = new Redis(endpoint, { lazyConnect: true, maxRetriesPerRequest: 3 });
  } else if (host) {
    client = new Redis({ host, port, username, password, lazyConnect: true, maxRetriesPerRequest: 3, tls: {} });
  } else {
    console.warn("[redis] No REDIS_DB_ENDPOINT or REDIS_DB_HOST configured — Redis features disabled");
    client = new Redis({ lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 1 });
  }

  client.on("error", (err) => {
    console.warn("[redis] Connection error:", err.message);
  });

  return client;
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const r = getRedis();
    await r.ping();
    return true;
  } catch {
    return false;
  }
}

const HEARTBEAT_TTL = 90;
const HEARTBEAT_KEY = (readerId: string) => `reader:heartbeat:${readerId}`;

export async function setReaderHeartbeat(readerId: string): Promise<void> {
  const r = getRedis();
  await r.setex(HEARTBEAT_KEY(readerId), HEARTBEAT_TTL, "1");
}

export async function isReaderOnline(readerId: string): Promise<boolean> {
  try {
    const r = getRedis();
    const v = await r.get(HEARTBEAT_KEY(readerId));
    return v === "1";
  } catch {
    return false;
  }
}

export async function clearReaderHeartbeat(readerId: string): Promise<void> {
  try {
    const r = getRedis();
    await r.del(HEARTBEAT_KEY(readerId));
  } catch {
    // ignore
  }
}

const SESSION_LOCK_KEY = (sessionId: string) => `session:lock:${sessionId}`;

export async function acquireSessionLock(sessionId: string, ttlSeconds = 30): Promise<boolean> {
  try {
    const r = getRedis();
    const result = await r.set(SESSION_LOCK_KEY(sessionId), "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    return true;
  }
}

export async function releaseSessionLock(sessionId: string): Promise<void> {
  try {
    const r = getRedis();
    await r.del(SESSION_LOCK_KEY(sessionId));
  } catch {
    // ignore
  }
}
