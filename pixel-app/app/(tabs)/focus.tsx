import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontSize, spacing, borderRadius } from "@/lib/theme";
import { fetchSettings } from "@/lib/api";

type TimerMode = "work" | "break";

const PRESETS = [
  { work: 25, break: 5, label: "25/5" },
  { work: 50, break: 10, label: "50/10" },
  { work: 90, break: 15, label: "90/15" },
];

export default function FocusScreen() {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>("work");
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Load settings
  useEffect(() => {
    fetchSettings().then((settings) => {
      setWorkMinutes(settings.pomodoro_work);
      setBreakMinutes(settings.pomodoro_break);
      if (!isRunning) {
        setSecondsLeft(settings.pomodoro_work * 60);
      }
    });
  }, []);

  // Handle app state (background/foreground) for accurate timing
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && endTimeRef.current && isRunning) {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          handleTimerEnd();
        }
      }
    });
    return () => subscription.remove();
  }, [isRunning, mode]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    endTimeRef.current = null;
    Vibration.vibrate([0, 500, 200, 500]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (mode === "work") {
      setSessions((s) => s + 1);
      setMode("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode("work");
      setSecondsLeft(workMinutes * 60);
    }
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      setIsRunning(false);
      endTimeRef.current = null;
    } else {
      setIsRunning(true);
      endTimeRef.current = Date.now() + secondsLeft * 1000;
    }
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    endTimeRef.current = null;
    setMode("work");
    setSecondsLeft(workMinutes * 60);
  };

  const applyPreset = (work: number, brk: number) => {
    Haptics.selectionAsync();
    setIsRunning(false);
    endTimeRef.current = null;
    setWorkMinutes(work);
    setBreakMinutes(brk);
    setMode("work");
    setSecondsLeft(work * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = (mode === "work" ? workMinutes : breakMinutes) * 60;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;

  // Circle progress
  const size = 260;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Focus</Text>

        {/* Presets */}
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={[
                styles.presetButton,
                workMinutes === p.work && breakMinutes === p.break && styles.presetActive,
              ]}
              onPress={() => applyPreset(p.work, p.break)}
            >
              <Text
                style={[
                  styles.presetText,
                  workMinutes === p.work && breakMinutes === p.break && styles.presetTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          {/* Progress ring (simplified — just background circle) */}
          <View style={[styles.timerRing, { width: size, height: size, borderRadius: size / 2 }]}>
            <View style={[
              styles.timerRingProgress,
              {
                width: size - 8,
                height: size - 8,
                borderRadius: (size - 8) / 2,
                borderWidth: strokeWidth,
                borderColor: mode === "work" ? colors.text : colors.green,
                opacity: 0.15,
              },
            ]} />
          </View>

          <View style={styles.timerTextContainer}>
            <Text style={styles.modeLabel}>
              {mode === "work" ? "WORK" : "BREAK"}
            </Text>
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
            <Feather name="rotate-ccw" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={toggleTimer} activeOpacity={0.7}>
            <Feather name={isRunning ? "pause" : "play"} size={32} color={colors.bg} />
          </TouchableOpacity>

          <View style={styles.sessionCounter}>
            <Text style={styles.sessionCount}>{sessions}</Text>
            <Text style={styles.sessionLabel}>sessions</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: "center", paddingHorizontal: spacing.xl },
  title: { fontSize: fontSize.xxl, color: colors.text, fontWeight: "600", marginTop: spacing.lg, alignSelf: "flex-start" },
  presets: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xxxl },
  presetButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  presetActive: { backgroundColor: colors.text, borderColor: colors.text },
  presetText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "500" },
  presetTextActive: { color: colors.bg },
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerRing: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  timerRingProgress: {
    position: "absolute",
  },
  timerTextContainer: { alignItems: "center" },
  modeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "600",
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  timerText: {
    fontSize: 64,
    color: colors.text,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxxl,
    paddingBottom: 60,
  },
  controlButton: { padding: spacing.md },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 4, // visual centering for play icon
  },
  sessionCounter: { alignItems: "center", width: 48 },
  sessionCount: { fontSize: fontSize.xl, color: colors.text, fontWeight: "700" },
  sessionLabel: { fontSize: 10, color: colors.textMuted },
});
