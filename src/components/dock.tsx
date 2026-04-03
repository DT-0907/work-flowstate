"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Zap,
  Calendar,
  Flame,
  TrendingUp,
  Timer,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/today", icon: Zap, label: "Today" },
  { href: "/week", icon: Calendar, label: "Week" },
  { href: "/grind", icon: Flame, label: "Grind" },
  { href: "/growth", icon: TrendingUp, label: "Growth" },
  { href: "/focus", icon: Timer, label: "Focus" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const ICON_SIZE = 36;
const MAGNIFICATION = 56;
const DISTANCE = 120;

function DockIcon({
  href,
  icon: Icon,
  label,
  active,
  mouseX,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  mouseX: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const dist = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(
    dist,
    [-DISTANCE, 0, DISTANCE],
    [ICON_SIZE, MAGNIFICATION, ICON_SIZE]
  );

  const size = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        className={cn(
          "flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150",
          active
            ? "bg-white/10 border border-white/30"
            : "hover:bg-white/5"
        )}
      >
        <Icon
          className={cn(
            "transition-colors duration-150",
            active ? "text-white" : "text-white/30"
          )}
          style={{ width: "50%", height: "50%" }}
        />
      </motion.div>
    </Link>
  );
}

export function Dock() {
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "flex items-center gap-2 p-2 rounded-2xl pointer-events-auto",
          "border-2 border-white/15 bg-black/90"
        )}
      >
        {tabs.map((tab) => (
          <DockIcon
            key={tab.href}
            {...tab}
            active={pathname === tab.href}
            mouseX={mouseX}
          />
        ))}
      </motion.div>
    </div>
  );
}
