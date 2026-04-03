import { cn, urgencyColor, formatRelativeDate } from "@/lib/utils";

export function UrgencyIndicator({ dueDate, className }: { dueDate: string; className?: string }) {
  return (
    <span className={cn("text-xs font-mono", urgencyColor(dueDate), className)}>
      {formatRelativeDate(dueDate)}
    </span>
  );
}
