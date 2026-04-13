export type TimeOfDay = "morning" | "midday" | "night";
export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";
export type AssignmentPriority = "low" | "medium" | "high" | "urgent";
export type AssignmentStatus = "pending" | "in_progress" | "completed";
export type TaskType = "habit" | "assignment";
export type LifeArea =
  | "intellectual"
  | "mental"
  | "spiritual"
  | "financial"
  | "physical"
  | "social";
export type Theme = "dark" | "light";

export const LIFE_AREAS: LifeArea[] = [
  "intellectual",
  "mental",
  "spiritual",
  "financial",
  "physical",
  "social",
];

export const AREA_LABELS: Record<LifeArea, string> = {
  intellectual: "Intellectual",
  mental: "Mental",
  spiritual: "Spiritual",
  financial: "Financial",
  physical: "Physical",
  social: "Social",
};

export const AREA_ICONS: Record<LifeArea, string> = {
  intellectual: "book",
  mental: "brain",
  spiritual: "heart",
  financial: "dollar-sign",
  physical: "activity",
  social: "users",
};

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  time_of_day: TimeOfDay;
  frequency: HabitFrequency;
  custom_days: number[];
  streak: number;
  is_active: boolean;
  completion_count: number;
  embedding_text: string | null;
  created_at: string;
  updated_at: string;
  completed_today?: boolean;
}

export interface AssignmentGrouping {
  id: string;
  user_id: string;
  name: string;
  course: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  description: string;
  course: string;
  due_date: string;
  estimated_minutes: number;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  repeats_weekly: boolean;
  completed_at: string | null;
  embedding_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  name: string;
  type: TaskType;
  description?: string;
  time_of_day?: TimeOfDay;
  streak?: number;
  course?: string;
  due_date?: string;
  estimated_minutes?: number;
  priority?: AssignmentPriority;
  reason?: string;
  score?: number;
}

export interface LifeAreaScore {
  area: LifeArea;
  score: number;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  goals: string[];
  appreciation: string;
  learned: string;
  improve: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  theme: Theme;
  pomodoro_work: number;
  pomodoro_break: number;
}

export interface DayOverview {
  date: string;
  dayName: string;
  habits: { total: number; completed: number };
  assignments: Assignment[];
}
