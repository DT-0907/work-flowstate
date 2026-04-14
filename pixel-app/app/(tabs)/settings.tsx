import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, spacing, borderRadius } from "@/lib/theme";
import { fetchSettings, updateSettings, signOut } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { UserSettings } from "@/lib/types";

export default function SettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    pomodoro_work: 25,
    pomodoro_break: 5,
  });
  const [workInput, setWorkInput] = useState("25");
  const [breakInput, setBreakInput] = useState("5");

  useEffect(() => {
    fetchSettings().then((s) => {
      setSettings(s);
      setWorkInput(String(s.pomodoro_work));
      setBreakInput(String(s.pomodoro_break));
    });
  }, []);

  const handleSavePomodoro = async () => {
    const work = parseInt(workInput) || 25;
    const brk = parseInt(breakInput) || 5;
    await updateSettings({ pomodoro_work: work, pomodoro_break: brk });
    setSettings((s) => ({ ...s, pomodoro_work: work, pomodoro_break: brk }));
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleWipeData = () => {
    Alert.alert(
      "Wipe All Data",
      "This will permanently delete all your habits, assignments, journal entries, and scores. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            // Delete in order (respecting foreign keys)
            await supabase.from("habit_completions").delete().eq("user_id", user.id);
            await supabase.from("skipped_recommendations").delete().eq("user_id", user.id);
            await supabase.from("habit_area_mappings").delete().in(
              "habit_id",
              (await supabase.from("habits").select("id").eq("user_id", user.id)).data?.map((h) => h.id) || []
            );
            await supabase.from("score_changes").delete().eq("user_id", user.id);
            await supabase.from("habits").delete().eq("user_id", user.id);
            await supabase.from("assignments").delete().eq("user_id", user.id);
            await supabase.from("journal_entries").delete().eq("user_id", user.id);
            await supabase.from("life_area_scores").delete().eq("user_id", user.id);
            await supabase.from("user_settings").delete().eq("user_id", user.id);

            Alert.alert("Done", "All data has been wiped.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Feather name="user" size={18} color={colors.textSecondary} />
              <Text style={styles.rowText}>
                {user?.user_metadata?.full_name || user?.email || "User"}
              </Text>
            </View>
            <View style={styles.row}>
              <Feather name="mail" size={18} color={colors.textSecondary} />
              <Text style={styles.rowText}>{user?.email || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Pomodoro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pomodoro Timer</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Work (min)</Text>
              <TextInput
                style={styles.numberInput}
                value={workInput}
                onChangeText={setWorkInput}
                onBlur={handleSavePomodoro}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Break (min)</Text>
              <TextInput
                style={styles.numberInput}
                value={breakInput}
                onChangeText={setBreakInput}
                onBlur={handleSavePomodoro}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Feather name="log-out" size={18} color={colors.text} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.red }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleWipeData}>
            <Feather name="trash-2" size={18} color={colors.red} />
            <Text style={styles.dangerText}>Wipe All Data</Text>
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
  title: { fontSize: fontSize.xxl, color: colors.text, fontWeight: "600", marginTop: spacing.lg, marginBottom: spacing.xxl },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600", marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 1 },
  card: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: { fontSize: fontSize.md, color: colors.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputLabel: { fontSize: fontSize.md, color: colors.text },
  numberInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "600",
    textAlign: "center",
    width: 60,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
  },
  divider: { height: 0.5, backgroundColor: colors.glassBorder },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  signOutText: { fontSize: fontSize.md, color: colors.text, fontWeight: "500" },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
  },
  dangerText: { fontSize: fontSize.md, color: colors.red, fontWeight: "500" },
});
