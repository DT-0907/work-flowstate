import type { Quote } from "@/lib/quotes";

interface Props {
  quote: Quote;
  index: number;
}

export function QuoteCard({ quote, index }: Props) {
  return (
    <div
      className="h-[calc(100dvh-4rem)] w-full snap-start flex items-center justify-center p-8 bg-black"
    >
      <div className="max-w-md text-center animate-fade-up">
        <blockquote className="text-2xl sm:text-4xl font-bold text-white leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        {quote.author && (
          <cite className="block mt-4 text-base font-mono text-white/30 not-italic">
            &mdash; {quote.author}
          </cite>
        )}
      </div>
    </div>
  );
}
