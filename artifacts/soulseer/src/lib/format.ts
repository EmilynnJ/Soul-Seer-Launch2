import { format as dateFnsFormat } from "date-fns";

export function formatCents(cents: number | undefined | null): string {
  if (cents == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(dateString: string | undefined | null, formatStr: string = "MMM d, yyyy"): string {
  if (!dateString) return "";
  try {
    return dateFnsFormat(new Date(dateString), formatStr);
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  return formatDate(dateString, "MMM d, yyyy h:mm a");
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds == null) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
