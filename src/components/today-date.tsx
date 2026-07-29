"use client";

import { useEffect, useState } from "react";
import { todayPT, formatDateLabel } from "@/lib/date";

/**
 * Rendered on the client so the date is current. The Today page is statically
 * prerendered, so computing this during render would freeze it at build time.
 */
export function TodayDate() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () =>
      setLabel(formatDateLabel(todayPT(), { weekday: "long", month: "short", day: "numeric" }));
    update();
    const id = setInterval(update, 60_000); // keep it right across midnight PT
    return () => clearInterval(id);
  }, []);

  return <p className="text-sm text-white/30 font-mono h-5">{label}</p>;
}
