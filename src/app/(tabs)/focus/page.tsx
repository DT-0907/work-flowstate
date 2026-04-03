"use client";

import { useEffect, useState } from "react";
import { PomodoroTimer } from "@/components/pomodoro-timer";

export default function FocusPage() {
  const [work, setWork] = useState(25);
  const [breakTime, setBreakTime] = useState(5);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s?.pomodoro_work) setWork(s.pomodoro_work);
        if (s?.pomodoro_break) setBreakTime(s.pomodoro_break);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 flex items-center justify-center min-h-[calc(100dvh-6rem)]">
      <PomodoroTimer workMinutes={work} breakMinutes={breakTime} />
    </div>
  );
}
