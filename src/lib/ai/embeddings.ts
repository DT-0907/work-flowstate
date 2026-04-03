import type { Habit, Assignment } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelineInstance: any = null;

async function getEmbedder() {
  if (pipelineInstance) return pipelineInstance;

  const { pipeline, env } = await import("@huggingface/transformers");
  env.cacheDir = "/tmp/transformers-cache";

  pipelineInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "fp32",
  });

  return pipelineInstance;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await getEmbedder();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data as Float32Array);
  } catch (error) {
    console.error("Embedding generation failed:", error);
    return [];
  }
}

export function buildHabitEmbeddingText(habit: Pick<Habit, "name" | "description" | "time_of_day" | "frequency" | "streak">): string {
  return `${habit.time_of_day} habit: ${habit.name}. ${habit.description || ""}. Frequency: ${habit.frequency}. Current streak: ${habit.streak} days.`.trim();
}

export function buildAssignmentEmbeddingText(
  assignment: Pick<Assignment, "name" | "description" | "course" | "due_date" | "estimated_minutes" | "priority">
): string {
  const due = new Date(assignment.due_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return `Assignment for ${assignment.course}: ${assignment.name}. ${assignment.description || ""}. Due: ${due}. Estimated time: ${assignment.estimated_minutes} minutes. Priority: ${assignment.priority}.`.trim();
}

export function buildContextEmbeddingText(
  timeOfDay: string,
  upcomingAssignments: string[],
  activeStreaks: string[],
  completedToday: string[]
): string {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  let text = `It's ${dayName} ${timeOfDay} at ${time}. Looking for productive ${timeOfDay} tasks.`;
  if (upcomingAssignments.length > 0) {
    text += ` Upcoming deadlines: ${upcomingAssignments.join(", ")}.`;
  }
  if (activeStreaks.length > 0) {
    text += ` Active streaks to maintain: ${activeStreaks.join(", ")}.`;
  }
  if (completedToday.length > 0) {
    text += ` Recently completed today: ${completedToday.join(", ")}.`;
  }
  return text;
}
