import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, spacing, borderRadius } from "@/lib/theme";
import { LIFE_AREAS, AREA_LABELS, type LifeAreaScore, type JournalEntry } from "@/lib/types";
import { fetchScores, fetchJournalEntry, saveJournalEntry } from "@/lib/api";
import { todayISO } from "@/lib/utils";

const AREA_COLORS: Record<string, string> = {
  intellectual: "#60a5fa",
  mental: "#c084fc",
  spiritual: "#facc15",
  financial: "#4ade80",
  physical: "#f87171",
  social: "#fb923c",
};

export default function GrowthScreen() {
  const [scores, setScores] = useState<LifeAreaScore[]>([]);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [goals, setGoals] = useState(["", "", ""]);
  const [appreciation, setAppreciation] = useState("");
  const [learned, setLearned] = useState("");
  const [improve, setImprove] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [s, j] = await Promise.all([fetchScores(), fetchJournalEntry()]);
    setScores(s);
    if (j) {
      setJournal(j);
      setGoals(j.goals.length >= 3 ? j.goals.slice(0, 3) : [...j.goals, ...Array(3 - j.goals.length).fill("")]);
      setAppreciation(j.appreciation || "");
      setLearned(j.learned || "");
      setImprove(j.improve || "");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveJournal = async () => {
    setSaving(true);
    await saveJournalEntry({
      date: todayISO(),
      goals: goals.filter((g) => g.trim()),
      appreciation,
      learned,
      improve,
    });
    setSaving(false);
  };

  const updateGoal = (index: number, value: string) => {
    const updated = [...goals];
    updated[index] = value;
    setGoals(updated);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        <Text style={styles.title}>Growth</Text>

        {/* Life Area Grid */}
        <View style={styles.areaGrid}>
          {LIFE_AREAS.map((area) => {
            const score = scores.find((s) => s.area === area)?.score ?? 50;
            const color = AREA_COLORS[area] || colors.textSecondary;

            return (
              <View key={area} style={styles.areaCard}>
                <View style={styles.areaHeader}>
                  <Text style={[styles.areaLabel, { color }]}>{AREA_LABELS[area]}</Text>
                  <Text style={[styles.areaScore, { color }]}>{Math.round(score)}</Text>
                </View>
                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Journal */}
        <View style={styles.journalSection}>
          <Text style={styles.sectionTitle}>Daily Journal</Text>
          <Text style={styles.journalDate}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>

          <Text style={styles.journalPrompt}>3 things I want to accomplish today:</Text>
          {goals.map((goal, i) => (
            <TextInput
              key={i}
              style={styles.journalInput}
              placeholder={`Goal ${i + 1}...`}
              placeholderTextColor={colors.textMuted}
              value={goal}
              onChangeText={(v) => updateGoal(i, v)}
              onBlur={handleSaveJournal}
            />
          ))}

          <Text style={styles.journalPrompt}>Something I appreciate:</Text>
          <TextInput
            style={[styles.journalInput, styles.journalInputMulti]}
            placeholder="What are you grateful for?"
            placeholderTextColor={colors.textMuted}
            value={appreciation}
            onChangeText={setAppreciation}
            onBlur={handleSaveJournal}
            multiline
          />

          <Text style={styles.journalPrompt}>Something I learned:</Text>
          <TextInput
            style={[styles.journalInput, styles.journalInputMulti]}
            placeholder="What did you learn today?"
            placeholderTextColor={colors.textMuted}
            value={learned}
            onChangeText={setLearned}
            onBlur={handleSaveJournal}
            multiline
          />

          <Text style={styles.journalPrompt}>Something I can improve:</Text>
          <TextInput
            style={[styles.journalInput, styles.journalInputMulti]}
            placeholder="What could be better?"
            placeholderTextColor={colors.textMuted}
            value={improve}
            onChangeText={setImprove}
            onBlur={handleSaveJournal}
            multiline
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveJournal}
            disabled={saving}
          >
            <Feather name="save" size={16} color={colors.bg} />
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Journal"}</Text>
          </TouchableOpacity>
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
  title: { fontSize: fontSize.xxl, color: colors.text, fontWeight: "600", marginTop: spacing.lg, marginBottom: spacing.xl },
  areaGrid: { gap: spacing.sm, marginBottom: spacing.xxxl },
  areaCard: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  areaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  areaLabel: { fontSize: fontSize.md, fontWeight: "500" },
  areaScore: { fontSize: fontSize.xl, fontWeight: "700" },
  scoreBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 2 },
  journalSection: { marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, color: colors.text, fontWeight: "600", marginBottom: spacing.xs },
  journalDate: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xl },
  journalPrompt: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "500", marginBottom: spacing.sm, marginTop: spacing.lg },
  journalInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    marginBottom: spacing.sm,
  },
  journalInputMulti: { minHeight: 60, textAlignVertical: "top" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: fontSize.sm, color: colors.bg, fontWeight: "600" },
});
