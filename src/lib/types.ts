export type TimeOfDay = "morning" | "midday" | "night";
export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";
export type AssignmentPriority = "low" | "medium" | "high" | "urgent";
export type AssignmentStatus = "pending" | "in_progress" | "completed";
export type TaskType = "habit" | "assignment";
export type LifeArea = "intellectual" | "mental" | "spiritual" | "financial" | "physical" | "social";
export type Theme = "dark" | "light";

export const LIFE_AREAS: LifeArea[] = ["intellectual", "mental", "spiritual", "financial", "physical", "social"];

export const AREA_LABELS: Record<LifeArea, string> = {
  intellectual: "Intellectual",
  mental: "Mental",
  spiritual: "Spiritual",
  financial: "Financial",
  physical: "Physical",
  social: "Social",
};

export const AREA_KEYWORDS: Record<LifeArea, string[]> = {
  intellectual: ["study", "read", "learn", "research", "homework", "class", "lecture", "write", "code", "programming", "book", "course"],
  mental: ["meditate", "mindful", "therapy", "journal", "reflect", "breathe", "calm", "stress", "sleep", "rest", "break"],
  spiritual: ["pray", "gratitude", "church", "temple", "faith", "purpose", "spiritual", "yoga", "thankful"],
  financial: ["budget", "save", "invest", "money", "finance", "income", "side project", "freelance", "startup", "business"],
  physical: ["exercise", "gym", "run", "walk", "sport", "nutrition", "stretch", "workout", "fitness", "hike", "swim", "lift"],
  social: ["friend", "family", "network", "volunteer", "community", "call", "meet", "social", "club", "team", "group"],
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

export interface Assignment {
  id: string;
  user_id: string;
  name: string;
  description: string;
  course: string;
  due_date: string;
  estimated_minutes: number;
  priority: AssignmentPriority;
  status: AssignmentStatus;
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
  similarity?: number;
  urgency_score?: number;
  final_score?: number;
  reason?: string;
}

export interface LifeAreaScore {
  area: LifeArea;
  score: number;
  updated_at: string;
}

export interface HabitAreaMapping {
  habit_id: string;
  area: LifeArea;
  relevance: number;
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
  aiSuggestions: Recommendation[];
}

export interface WeekOverview {
  days: DayOverview[];
}
