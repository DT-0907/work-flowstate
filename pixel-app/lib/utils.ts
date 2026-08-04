import type { TimeOfDay } from "./types";
import {
  pacificHour,
  todayPT,
  toPacificDate,
  daysBetweenPT,
  formatDateLabel,
  PACIFIC_TZ,
} from "./date";

export function getTimeOfDay(): TimeOfDay {
  const hour = pacificHour();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  return "night";
}

export function getTimeOfDayLabel(tod: TimeOfDay): string {
  return { morning: "Morning", midday: "Midday", night: "Night" }[tod];
}

export function getGreeting(): string {
  const tod = getTimeOfDay();
  return { morning: "Good morning", midday: "Good afternoon", night: "Good evening" }[tod];
}

export function formatRelativeDate(date: string | Date): string {
  const due = toPacificDate(new Date(date));
  const diffDays = daysBetweenPT(todayPT(), due);

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays}d`;
  return formatDateLabel(due, { month: "short", day: "numeric" });
}

export function urgencyColor(date: string | Date): string {
  const d = new Date(date);
  const hoursLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return "#f87171"; // red
  if (hoursLeft < 24) return "#fb923c"; // orange
  if (hoursLeft < 72) return "#facc15"; // yellow
  return "#a1a1aa"; // zinc
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "#f87171";
    case "high": return "#fb923c";
    case "medium": return "#facc15";
    default: return "#a1a1aa";
  }
}

export function todayISO(): string {
  return todayPT();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: PACIFIC_TZ,
  });
}
