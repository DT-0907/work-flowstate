"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}

export function JournalCalendar({ open, onClose, onSelectDate, selectedDate }: Props) {
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    if (!open) return;
    fetch("/api/journal/dates")
      .then((r) => r.json())
      .then((dates: string[]) => setEntryDates(new Set(dates)));
  }, [open]);

  if (!open) return null;

  const { year, month } = viewMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => {
    setViewMonth((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
    );
  };

  const nextMonth = () => {
    setViewMonth((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="border-2 border-white/30 bg-black rounded-lg p-4 w-[320px] space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="text-white/40 hover:text-white p-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white">{monthLabel}</span>
          <div className="flex items-center gap-1">
            <button onClick={nextMonth} className="text-white/40 hover:text-white p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-white/30 hover:text-white p-1 ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-[10px] text-white/30 font-medium py-1">{d}</div>
          ))}
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasEntry = entryDates.has(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split("T")[0];

            return (
              <button
                key={dateStr}
                disabled={!hasEntry}
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-mono transition-all mx-auto flex items-center justify-center",
                  isSelected && "bg-white text-black",
                  !isSelected && hasEntry && "text-white hover:bg-white/10 cursor-pointer",
                  !isSelected && !hasEntry && "text-white/20 cursor-default",
                  isToday && !isSelected && "ring-1 ring-white/40"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
