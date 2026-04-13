import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontSize, spacing, borderRadius } from "@/lib/theme";
import { getGreeting, getTimeOfDay, formatRelativeDate, urgencyColor, priorityColor } from "@/lib/utils";
import {
  fetchHabits,
  fetchAssignments,
  fetchGroupings,
  fetchRecommendations,
  fetchStats,
  createHabit,
  createAssignment,
  createGrouping,
  completeHabit,
  uncompleteHabit,
  completeAssignment,
  skipRecommendation,
} from "@/lib/api";
import type { Habit, Assignment, AssignmentGrouping, Recommendation } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

export default function TodayScreen() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groupings, setGroupings] = useState<AssignmentGrouping[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [recommendations, setRecs] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState({ activeStreaks: 0, completionRate: 0, assignmentsDueThisWeek: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddGrouping, setShowAddGrouping] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentCourse, setNewAssignmentCourse] = useState("");
  const [newAssignmentRepeats, setNewAssignmentRepeats] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");

  const loadData = useCallback(async () => {
    const [h, a, g, r, s] = await Promise.all([
      fetchHabits(),
      fetchAssignments(),
      fetchGroupings(),
      fetchRecommendations(),
      fetchStats(),
    ]);
    setHabits(h);
    setAssignments(a);
    setGroupings(g);
    setRecs(r);
    setStats(s);
    // Expand all groups by default on first load
    setExpandedGroups((prev) => {
      if (prev.size === 0) return new Set(g.map((gr) => gr.id));
      return prev;
    });
    if (!selectedGroupId && g.length > 0) {
      setSelectedGroupId(g[0].id);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleHabit = async (habit: Habit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (habit.completed_today) {
      await uncompleteHabit(habit.id);
    } else {
      await completeHabit(habit.id);
    }
    await loadData();
  };

  const handleCompleteAssignment = async (id: string, status: string) => {
    // Prevent unchecking
    if (status === "completed") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeAssignment(id);
    await loadData();
  };

  const handleSkipRec = async (rec: Recommendation) => {
    await skipRecommendation(rec.id, rec.type);
    await loadData();
  };

  const handleCompleteRec = async (rec: Recommendation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (rec.type === "habit") {
      await completeHabit(rec.id);
    } else {
      await completeAssignment(rec.id);
    }
    await loadData();
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    await createHabit({
      name: newHabitName.trim(),
      time_of_day: getTimeOfDay(),
      frequency: "daily",
    });
    setNewHabitName("");
    setShowAddHabit(false);
    await loadData();
  };

  const handleAddAssignment = async () => {
    if (!newAssignmentName.trim()) return;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    await createAssignment({
      name: newAssignmentName.trim(),
      course: newAssignmentCourse.trim(),
      due_date: nextWeek.toISOString(),
      priority: "medium",
      group_id: selectedGroupId || undefined,
      repeats_weekly: newAssignmentRepeats,
    });
    setNewAssignmentName("");
    setNewAssignmentCourse("");
    setNewAssignmentRepeats(false);
    setShowAddAssignment(false);
    await loadData();
  };

  const handleAddGrouping = async () => {
    if (!newGroupName.trim()) return;
    await createGrouping(newGroupName.trim());
    setNewGroupName("");
    setShowAddGrouping(false);
    await loadData();
  };

  // Group assignments by group_id
  const assignmentsByGroup = new Map<string, Assignment[]>();
  const ungrouped: Assignment[] = [];
  for (const a of assignments) {
    if (a.group_id) {
      const list = assignmentsByGroup.get(a.group_id) || [];
      list.push(a);
      assignmentsByGroup.set(a.group_id, list);
    } else {
      ungrouped.push(a);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Header */}
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.name}>{user?.user_metadata?.full_name || "there"}</Text>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeStreaks}</Text>
            <Text style={styles.statLabel}>Streaks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.assignmentsDueThisWeek}</Text>
            <Text style={styles.statLabel}>Due this week</Text>
          </View>
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do right now</Text>
            <View style={styles.recRow}>
              {recommendations.map((rec) => (
                <View key={rec.id} style={styles.recCard}>
                  <View style={styles.recHeader}>
                    <View style={[styles.recBadge, { backgroundColor: rec.type === "habit" ? colors.blue : colors.purple }]}>
                      <Text style={styles.recBadgeText}>
                        {rec.type === "habit" ? "Habit" : "Task"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recName} numberOfLines={2}>{rec.name}</Text>
                  <Text style={styles.recReason} numberOfLines={1}>{rec.reason}</Text>
                  <View style={styles.recActions}>
                    <TouchableOpacity onPress={() => handleCompleteRec(rec)} style={styles.recAction}>
                      <Feather name="check" size={16} color={colors.green} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSkipRec(rec)} style={styles.recAction}>
                      <Feather name="x" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {recommendations.length === 0 && (
          <View style={styles.caughtUpCard}>
            <Feather name="check-circle" size={24} color={colors.textMuted} />
            <Text style={styles.caughtUpText}>You're all caught up!</Text>
            <Text style={styles.caughtUpSub}>Add habits or assignments to get recommendations.</Text>
          </View>
        )}

        {/* Habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habits</Text>
            <TouchableOpacity onPress={() => setShowAddHabit(!showAddHabit)}>
              <Feather name={showAddHabit ? "x" : "plus"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showAddHabit && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="New habit name..."
                placeholderTextColor={colors.textMuted}
                value={newHabitName}
                onChangeText={setNewHabitName}
                onSubmitEditing={handleAddHabit}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity onPress={handleAddHabit} style={styles.addButton}>
                <Feather name="plus" size={18} color={colors.bg} />
              </TouchableOpacity>
            </View>
          )}

          {habits.length === 0 ? (
            <Text style={styles.emptyText}>No habits yet. Add one above!</Text>
          ) : (
            habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.habitRow}
                onPress={() => handleToggleHabit(habit)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, habit.completed_today && styles.checkboxChecked]}>
                  {habit.completed_today && <Feather name="check" size={14} color={colors.bg} />}
                </View>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, habit.completed_today && styles.habitCompleted]}>
                    {habit.name}
                  </Text>
                  <Text style={styles.habitMeta}>
                    {habit.time_of_day} {habit.streak > 0 ? `· ${habit.streak}d streak` : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Assignments — Grouped */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assignments</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <TouchableOpacity onPress={() => setShowAddGrouping(!showAddGrouping)}>
                <Feather name="folder-plus" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddAssignment(!showAddAssignment)}>
                <Feather name={showAddAssignment ? "x" : "plus"} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* New grouping form */}
          {showAddGrouping && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="New grouping name (e.g. CS 61B)..."
                placeholderTextColor={colors.textMuted}
                value={newGroupName}
                onChangeText={setNewGroupName}
                onSubmitEditing={handleAddGrouping}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity onPress={handleAddGrouping} style={styles.addButton}>
                <Feather name="plus" size={18} color={colors.bg} />
              </TouchableOpacity>
            </View>
          )}

          {/* Add assignment form */}
          {showAddAssignment && (
            <View style={[styles.addForm, { flexDirection: "column", alignItems: "stretch" }]}>
              <TextInput
                style={styles.input}
                placeholder="Assignment name..."
                placeholderTextColor={colors.textMuted}
                value={newAssignmentName}
                onChangeText={setNewAssignmentName}
                autoFocus
              />
              <TextInput
                style={styles.input}
                placeholder="Course (optional)"
                placeholderTextColor={colors.textMuted}
                value={newAssignmentCourse}
                onChangeText={setNewAssignmentCourse}
              />
              {/* Grouping picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.xs }}>
                <View style={{ flexDirection: "row", gap: spacing.xs }}>
                  {groupings.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => setSelectedGroupId(g.id)}
                      style={[
                        styles.groupChip,
                        selectedGroupId === g.id && styles.groupChipSelected,
                      ]}
                    >
                      <Text style={[
                        styles.groupChipText,
                        selectedGroupId === g.id && styles.groupChipTextSelected,
                      ]}>
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Switch
                    value={newAssignmentRepeats}
                    onValueChange={setNewAssignmentRepeats}
                    trackColor={{ false: colors.surface, true: colors.text }}
                    thumbColor={colors.bg}
                  />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Repeats weekly</Text>
                </View>
                <TouchableOpacity onPress={handleAddAssignment} style={styles.addButton}>
                  <Feather name="plus" size={18} color={colors.bg} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Grouped assignment list */}
          {groupings.map((group) => {
            const groupAssignments = assignmentsByGroup.get(group.id) || [];
            const pendingCount = groupAssignments.filter((a) => a.status !== "completed").length;
            const isExpanded = expandedGroups.has(group.id);

            return (
              <View key={group.id}>
                <TouchableOpacity
                  style={styles.groupHeader}
                  onPress={() => toggleGroup(group.id)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={isExpanded ? "chevron-down" : "chevron-right"}
                    size={16}
                    color={colors.textMuted}
                  />
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupCount}>{pendingCount}</Text>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.groupContent}>
                    {groupAssignments.length === 0 ? (
                      <Text style={[styles.emptyText, { paddingLeft: spacing.xl }]}>No assignments</Text>
                    ) : (
                      groupAssignments.map((a) => {
                        const isCompleted = a.status === "completed";
                        return (
                          <TouchableOpacity
                            key={a.id}
                            style={styles.assignmentRow}
                            onPress={() => handleCompleteAssignment(a.id, a.status)}
                            activeOpacity={isCompleted ? 1 : 0.7}
                          >
                            <View style={[
                              styles.assignmentCheckbox,
                              isCompleted && styles.assignmentCheckboxDone,
                            ]}>
                              {isCompleted && <Feather name="check" size={12} color={colors.textMuted} />}
                            </View>
                            <View style={styles.assignmentInfo}>
                              <Text
                                style={[
                                  styles.assignmentName,
                                  isCompleted && styles.assignmentCompleted,
                                ]}
                                numberOfLines={1}
                              >
                                {a.name}
                              </Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                                <Text style={[styles.assignmentMeta, isCompleted && { color: colors.textMuted }]}>
                                  {a.course ? `${a.course} · ` : ""}{formatRelativeDate(a.due_date)}
                                </Text>
                                {a.repeats_weekly && (
                                  <Feather name="repeat" size={10} color={isCompleted ? colors.textMuted : colors.textSecondary} />
                                )}
                              </View>
                            </View>
                            {!isCompleted && (
                              <View style={[styles.priorityDot, { backgroundColor: priorityColor(a.priority) }]} />
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Ungrouped fallback */}
          {ungrouped.map((a) => {
            const isCompleted = a.status === "completed";
            return (
              <TouchableOpacity
                key={a.id}
                style={styles.assignmentRow}
                onPress={() => handleCompleteAssignment(a.id, a.status)}
                activeOpacity={isCompleted ? 1 : 0.7}
              >
                <View style={[styles.assignmentCheckbox, isCompleted && styles.assignmentCheckboxDone]}>
                  {isCompleted && <Feather name="check" size={12} color={colors.textMuted} />}
                </View>
                <View style={styles.assignmentInfo}>
                  <Text style={[styles.assignmentName, isCompleted && styles.assignmentCompleted]} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={styles.assignmentMeta}>
                    {a.course ? `${a.course} · ` : ""}{formatRelativeDate(a.due_date)}
                  </Text>
                </View>
                {!isCompleted && (
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor(a.priority) }]} />
                )}
              </TouchableOpacity>
            );
          })}

          {assignments.length === 0 && groupings.length === 0 && (
            <Text style={styles.emptyText}>No assignments. Enjoy the free time!</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  greeting: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.lg, fontWeight: "300" },
  name: { fontSize: fontSize.xxl, color: colors.text, fontWeight: "600", marginBottom: spacing.lg },
  statsBar: {
    flexDirection: "row",
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: fontSize.xl, color: colors.text, fontWeight: "700" },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: colors.glassBorder, marginHorizontal: spacing.md },
  section: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, color: colors.text, fontWeight: "600" },
  recRow: { flexDirection: "row", gap: spacing.sm },
  recCard: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  recHeader: { marginBottom: spacing.sm },
  recBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  recBadgeText: { fontSize: 9, color: colors.text, fontWeight: "600", textTransform: "uppercase" },
  recName: { fontSize: fontSize.sm, color: colors.text, fontWeight: "500", marginBottom: 4 },
  recReason: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.sm },
  recActions: { flexDirection: "row", gap: spacing.sm },
  recAction: { padding: spacing.xs },
  caughtUpCard: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  caughtUpText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: "500" },
  caughtUpSub: { fontSize: fontSize.xs, color: colors.textMuted },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: colors.text, borderColor: colors.text },
  habitInfo: { flex: 1 },
  habitName: { fontSize: fontSize.md, color: colors.text, fontWeight: "400" },
  habitCompleted: { textDecorationLine: "line-through", color: colors.textMuted },
  habitMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  addForm: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "flex-end" },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
  },
  addButton: {
    backgroundColor: colors.text,
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: "italic", paddingVertical: spacing.lg },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
    gap: spacing.sm,
  },
  groupName: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: "500", flex: 1 },
  groupCount: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: "monospace" },
  groupContent: { paddingLeft: spacing.md },
  groupChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  groupChipSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  groupChipText: { fontSize: fontSize.xs, color: colors.textMuted },
  groupChipTextSelected: { color: colors.bg, fontWeight: "600" },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
    gap: spacing.md,
  },
  assignmentCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  assignmentCheckboxDone: {
    borderColor: colors.textMuted,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  assignmentInfo: { flex: 1 },
  assignmentName: { fontSize: fontSize.md, color: colors.text },
  assignmentCompleted: { textDecorationLine: "line-through", color: colors.textMuted },
  assignmentMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
});
