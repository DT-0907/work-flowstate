import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TimeOfDay = "morning" | "midday" | "night";

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  return "night";
}

export function getTimeOfDayLabel(tod: TimeOfDay): string {
  return { morning: "Morning", midday: "Midday", night: "Night" }[tod];
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function urgencyColor(date: string | Date): string {
  const d = new Date(date);
  const hoursLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return "text-red-400 border-red-400/30";
  if (hoursLeft < 24) return "text-orange-400 border-orange-400/30";
  if (hoursLeft < 72) return "text-yellow-400 border-yellow-400/30";
  return "text-zinc-400 border-zinc-400/30";
}
