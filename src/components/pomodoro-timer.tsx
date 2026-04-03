"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

interface Props {
  workMinutes?: number;
  breakMinutes?: number;
}

export function PomodoroTimer({ workMinutes = 25, breakMinutes = 5 }: Props) {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "work" ? workMinutes * 60 : breakMinutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        // Timer done
        if (mode === "work") {
          setSessions((s) => s + 1);
          setMode("break");
          return breakMinutes * 60;
        } else {
          setMode("work");
          return workMinutes * 60;
        }
      }
      return prev - 1;
    });
  }, [mode, workMinutes, breakMinutes]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  // Reset timer when settings change
  useEffect(() => {
    setSecondsLeft(workMinutes * 60);
    setMode("work");
    setRunning(false);
  }, [workMinutes, breakMinutes]);

  const toggle = () => setRunning(!running);

  const reset = () => {
    setRunning(false);
    setMode("work");
    setSecondsLeft(workMinutes * 60);
  };

  const circumference = 2 * Math.PI * 150;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex items-center gap-2">
        <Timer className="w-5 h-5 text-white/60" />
        <h1 className="text-2xl font-bold text-white">Focus</h1>
      </div>

      {/* Circular timer */}
      <div className="relative w-80 h-80">
        <svg className="w-80 h-80 -rotate-90" viewBox="0 0 320 320">
          {/* Background ring */}
          <circle
            cx="160" cy="160" r="150"
            fill="none" stroke="currentColor" strokeWidth="4"
            className="text-white/10"
          />
          {/* Progress ring */}
          <circle
            cx="160" cy="160" r="150"
            fill="none" strokeWidth="4" strokeLinecap="round"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn(
              "transition-all duration-1000",
              mode === "work" ? "text-white" : "text-white/60"
            )}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-[10px] uppercase tracking-[0.2em] font-medium mb-2",
            mode === "work" ? "text-white" : "text-white/60"
          )}>
            {mode}
          </span>
          <span className="text-6xl font-mono font-bold text-white tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-white/30 font-mono mt-2">
            Session {sessions + 1}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="w-12 h-12 rounded-lg border-2 border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={toggle}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
            running
              ? "border-2 border-white/40 text-white hover:bg-white/10"
              : "bg-white text-black hover:bg-white/90"
          )}
        >
          {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <div className="w-12 h-12 rounded-lg border-2 border-white/20 flex items-center justify-center">
          <span className="text-xs font-mono text-white/40">
            {workMinutes}/{breakMinutes}
          </span>
        </div>
      </div>
    </div>
  );
}
