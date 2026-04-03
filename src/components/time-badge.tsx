import { cn } from "@/lib/utils";
import type { TimeOfDay } from "@/lib/types";
import { Sun, CloudSun, Moon } from "lucide-react";

const config: Record<TimeOfDay, { icon: typeof Sun; color: string; label: string }> = {
  morning: { icon: Sun, color: "text-white/50 bg-transparent border-white/20", label: "Morning" },
  midday: { icon: CloudSun, color: "text-white/40 bg-transparent border-white/20", label: "Midday" },
  night: { icon: Moon, color: "text-white/30 bg-transparent border-white/20", label: "Night" },
};

export function TimeBadge({ timeOfDay, className }: { timeOfDay: TimeOfDay; className?: string }) {
  const { icon: Icon, color, label } = config[timeOfDay];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border", color, className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
