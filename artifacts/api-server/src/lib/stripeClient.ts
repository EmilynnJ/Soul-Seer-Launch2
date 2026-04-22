// Replit Stripe integration helper — see snippets/stripe-replit-sync..js
import Stripe from "stripe";

let cachedSettings: { publishableKey: string; secretKey: string } | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  if (cachedSettings && Date.now() - cachedAt < TTL_MS) return cachedSettings;

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Stripe connection unavailable: missing Replit connector env");
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
  });

  const data = await response.json();
  const item = data.items?.[0];
  if (!item || !item.settings?.publishable || !item.settings?.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  cachedSettings = {
    publishableKey: item.settings.publishable,
    secretKey: item.settings.secret,
  };
  cachedAt = Date.now();
  return cachedSettings;
}

export async function getStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion });
}

export async function isStripeConfigured(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}
