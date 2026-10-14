import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export function isSlotExpired(cutoffTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = cutoffTime.split(":").map(Number);
  const cutoff = new Date(now);
  cutoff.setHours(hours, minutes, 0, 0);
  return now >= cutoff;
}

export function getTimeUntilCutoff(cutoffTime: string): {
  hours: number;
  minutes: number;
  expired: boolean;
} {
  const now = new Date();
  const [h, m] = cutoffTime.split(":").map(Number);
  const cutoff = new Date(now);
  cutoff.setHours(h, m, 0, 0);

  const diff = cutoff.getTime() - now.getTime();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true };

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    expired: false,
  };
}

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}
