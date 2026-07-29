import { RecommendationRow } from "@/components/recommendation-row";
import { HabitList } from "@/components/habit-list";
import { AssignmentList } from "@/components/assignment-list";
import { StatsBar } from "@/components/stats-bar";
import { TodayDate } from "@/components/today-date";

export default function TodayPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-widest uppercase">FlowState</h1>
          <TodayDate />
        </div>
      </header>

      <RecommendationRow />

      {/* Desktop: side by side. Mobile: stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitList />
        <AssignmentList />
      </div>

      <StatsBar />
    </div>
  );
}
