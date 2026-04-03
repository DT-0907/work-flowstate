"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

function AnimatedTextCycle({
  words,
  interval = 3000,
}: {
  words: string[];
  interval?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState("auto");
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (measureRef.current) {
      const elements = measureRef.current.children;
      if (elements.length > currentIndex) {
        const newWidth = elements[currentIndex].getBoundingClientRect().width;
        setWidth(`${newWidth}px`);
      }
    }
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, words.length]);

  const variants = {
    hidden: { y: -20, opacity: 0, filter: "blur(8px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      y: 20,
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: 0.3, ease: "easeIn" },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return (
    <>
      <span
        ref={measureRef}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none"
        style={{ visibility: "hidden" }}
      >
        {words.map((word, i) => (
          <span key={i} className="font-light">{word}</span>
        ))}
      </span>
      <motion.span
        className="relative inline-block"
        animate={{
          width,
          transition: { type: "spring", stiffness: 150, damping: 15, mass: 1.2 },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentIndex}
            className="inline-block font-light"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ whiteSpace: "nowrap" }}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const draw: any = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 2, ease: [0.43, 0.13, 0.23, 0.96] },
      opacity: { duration: 0.3 },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const smileyDraw: any = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 0.9,
    transition: {
      pathLength: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96], delay: 3 },
      opacity: { duration: 0.2, delay: 3 },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const smileyDrawMouth: any = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 0.9,
    transition: {
      pathLength: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96], delay: 3.5 },
      opacity: { duration: 0.2, delay: 3.5 },
    },
  },
};

export default function LoginPage() {
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="relative w-full min-h-dvh flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-950" />

      {/* Smiley face — upper right corner */}
      <motion.svg
        width="80"
        height="55"
        viewBox="0 0 120 80"
        initial="hidden"
        animate="visible"
        className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20 w-[60px] h-[42px] sm:w-[80px] sm:h-[55px]"
        style={{ transform: "rotate(-8deg)" }}
      >
        {/* Left eye */}
        <motion.circle
          cx="38" cy="28" r="5"
          fill="none" strokeWidth="3" stroke="currentColor"
          variants={smileyDraw} className="text-white"
        />
        {/* Right eye */}
        <motion.circle
          cx="82" cy="22" r="5"
          fill="none" strokeWidth="3" stroke="currentColor"
          variants={smileyDraw} className="text-white"
        />
        {/* Mouth */}
        <motion.path
          d="M 30 50 C 40 68, 55 72, 65 68 C 75 64, 85 56, 90 48"
          fill="none" strokeWidth="3" stroke="currentColor" strokeLinecap="round"
          variants={smileyDrawMouth} className="text-white"
        />
      </motion.svg>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center overflow-visible">
        {/* SVG hero — "Work" */}
        <motion.svg
          width="100%"
          height="100%"
          viewBox="30 60 920 280"
          initial="hidden"
          animate="visible"
          className="w-full max-w-[min(600px,85vw)]"
        >
          <title>Work</title>

          {/* W */}
          <motion.path
            d="M 80 120 L 120 280 L 160 180 L 200 280 L 240 120"
            fill="none"
            strokeWidth="10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            className="text-white"
          />

          {/* o */}
          <motion.path
            d="M 320 200 C 320 150, 360 120, 400 120 C 440 120, 480 150, 480 200 C 480 250, 440 280, 400 280 C 360 280, 320 250, 320 200 Z"
            fill="none"
            strokeWidth="10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            className="text-white"
          />

          {/* R */}
          <motion.path
            d="M 565 280 L 565 120 L 645 120 Q 685 120, 685 160 Q 685 200, 645 200 L 565 200 M 645 200 L 705 280"
            fill="none"
            strokeWidth="10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            className="text-white"
          />

          {/* k */}
          <motion.path
            d="M 779 120 L 779 280 M 779 200 L 889 120 M 779 200 L 889 280"
            fill="none"
            strokeWidth="10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            className="text-white"
          />
        </motion.svg>

        {/* Subtitle — centered directly under the SVG */}
        <motion.div
          className="w-full text-center -mt-4"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-white/80 text-xl sm:text-2xl md:text-4xl font-extralight tracking-wide leading-relaxed">
            Building your{" "}
            <AnimatedTextCycle
              words={["Workflow", "Organization", "Results", "Knowledge"]}
              interval={3000}
            />
          </p>
        </motion.div>
      </div>

      {/* Google login — pinned to bottom */}
      <motion.div
        className="absolute bottom-8 sm:bottom-12 left-0 right-0 flex flex-col items-center gap-3 px-4 sm:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 0.6, ease: "easeOut" }}
      >
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg border-2 border-white text-white text-xs sm:text-sm font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {error && (
          <p className="text-red-400/80 text-xs font-light">{error}</p>
        )}

        <p className="text-white text-[9px] sm:text-[11px] font-light tracking-[0.2em] sm:tracking-[0.3em] uppercase">
          Workflow, Organization, Results, Knowledge
        </p>
      </motion.div>
    </div>
  );
}
