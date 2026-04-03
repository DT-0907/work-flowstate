"use client";

import { useMemo } from "react";
import { QuoteCard } from "./quote-card";
import { shuffleQuotes } from "@/lib/quotes";

export function QuoteFeed() {
  const shuffled = useMemo(() => {
    const q = shuffleQuotes();
    return [...q, ...q];
  }, []);

  return (
    <div
      className="h-[calc(100dvh-5rem)] overflow-y-scroll scrollbar-none"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {shuffled.map((quote, i) => (
        <div key={`${quote.text}-${i}`} style={{ scrollSnapAlign: "start" }}>
          <QuoteCard quote={quote} index={i} />
        </div>
      ))}
    </div>
  );
}
