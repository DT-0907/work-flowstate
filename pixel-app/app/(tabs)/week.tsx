import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontSize, spacing, borderRadius } from "@/lib/theme";
import { fetchWeekOverview, fetchHabits, completeHabit, uncompleteHabit } from "@/lib/api";
import { formatRelativeDate, urgencyColor } from "@/lib/utils";
import type { DayOverview, Habit } from "@/lib/types";

export default function WeekScreen() {
  const [days, setDays] = useState<DayOverview[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dayHabits, setDayHabits] = useState<Habit[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const overview = await fetchWeekOverview();
    setDays(overview);
    if (!selectedDate && overview.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedDate) {
      fetchHabits().then(setDayHabits);
    }
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const selectedDay = days.find((d) => d.date === selectedDate);
  const todayStr = new Date().toISOString().split("T")[0];

  const handleToggleHabit = async (habit: Habit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (habit.completed_today) {
      await uncompleteHabit(habit.id, selectedDate);
    } else {
      await completeHabit(habit.id, selectedDate);
    }
    const habits = await fetchHabits();
    setDayHabits(habits);
    await loadData();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        <Text style={styles.title}>This Week</Text>

        {/* Week strip */}
        <View style={styles.weekStrip}>
          {days.map((day) => {
            const isToday = day.date === todayStr;
            const isSelected = day.date === selectedDate;
            const completionRatio = day.habits.total > 0
              ? day.habits.completed / day.habits.total
              : 0;

            return (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(day.date);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {day.dayName}
                </Text>
                <Text style={[styles.dayDate, isSelected && styles.dayDateSelected]}>
                  {new Date(day.date + "T12:00:00").getDate()}
                </Text>
                {/* Completion indicator */}
                <View style={styles.completionBar}>
                  <View
                    style={[
                      styles.completionFill,
                      { width: `${completionRatio * 100}%` },
                    ]}
                  />
                </View>
                {day.assignments.length > 0 && (
                  <Text style={styles.assignmentCount}>{day.assignments.length}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected day detail */}
        {selectedDay && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>
              {selectedDate === todayStr ? "Today" : selectedDay.dayName},{" "}
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>

            {/* Habits for this day */}
            <Text style={styles.subsectionTitle}>
              Habits ({selectedDay.habits.completed}/{selectedDay.habits.total})
            </Text>
            {dayHabits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.habitRow}
                onPress={() => handleToggleHabit(habit)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, habit.completed_today && styles.checkboxChecked]}>
                  {habit.completed_today && <Feather name="check" size={14} color={colors.bg} />}
                </View>
                <Text style={[styles.habitName, habit.completed_today && styles.habitCompleted]}>
                  {habit.name}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Assignments due this day */}
            <Text style={styles.subsectionTitle}>
              Assignments ({selectedDay.assignments.length})
            </Text>
            {selectedDay.assignments.length === 0 ? (
              <Text style={styles.emptyText}>No assignments due</Text>
            ) : (
              selectedDay.assignments.map((a) => (
                <View key={a.id} style={styles.assignmentRow}>
                  <Feather name="file-text" size={16} color={urgencyColor(a.due_date)} />
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.assignmentName}>{a.name}</Text>
                    <Text style={styles.assignmentMeta}>
                      {a.course ? `${a.course} · ` : ""}{a.priority}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  title: { fontSize: fontSize.xxl, color: colors.text, fontWeight: "600", marginTop: spacing.lg, marginBottom: spacing.xl },
  weekStrip: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xxl },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    gap: 4,
  },
  dayCellSelected: { backgroundColor: colors.text, borderColor: colors.text },
  dayCellToday: { borderColor: colors.textSecondary },
  dayName: { fontSize: 10, color: colors.textMuted, fontWeight: "500" },
  dayNameSelected: { color: colors.bg },
  dayDate: { fontSize: fontSize.lg, color: colors.text, fontWeight: "600" },
  dayDateSelected: { color: colors.bg },
  completionBar: {
    width: 20,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  completionFill: { height: "100%", backgroundColor: colors.green, borderRadius: 2 },
  assignmentCount: { fontSize: 9, color: colors.textMuted },
  dayDetail: { marginTop: spacing.sm },
  dayDetailTitle: { fontSize: fontSize.xl, color: colors.text, fontWeight: "600", marginBottom: spacing.xl },
  subsectionTitle: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "500", marginBottom: spacing.sm, marginTop: spacing.lg },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: colors.text, borderColor: colors.text },
  habitName: { fontSize: fontSize.md, color: colors.text },
  habitCompleted: { textDecorationLine: "line-through", color: colors.textMuted },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  assignmentInfo: { flex: 1 },
  assignmentName: { fontSize: fontSize.md, color: colors.text },
  assignmentMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: "italic", paddingVertical: spacing.sm },
});
