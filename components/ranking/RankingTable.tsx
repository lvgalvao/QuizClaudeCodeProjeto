import type { RankingEntry } from "@/types/quiz";

interface RankingTableProps {
  entries: RankingEntry[];
  highlightId?: string | null;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

export function RankingTable({ entries, highlightId }: RankingTableProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-border-subtle bg-bg-card p-8 text-center text-fg-muted">
        Nenhuma pontuação registrada ainda. Seja o primeiro!
      </p>
    );
  }

  return (
    <ol className="overflow-hidden rounded-2xl border border-border-subtle">
      {entries.map((entry, i) => {
        const isHighlight = entry.id === highlightId;
        return (
          <li
            key={entry.id}
            className={`flex items-center gap-4 border-b border-border-subtle px-4 py-3 last:border-0 sm:px-6 ${
              isHighlight ? "bg-accent/10" : "bg-bg-card"
            }`}
          >
            <span
              className="w-8 shrink-0 font-mono text-sm tabular-nums text-fg-muted sm:w-10"
              aria-label={`Posição ${i + 1}`}
            >
              {i + 1}
            </span>
            <span className="flex-1 truncate font-medium">{entry.nickname}</span>
            <span className="hidden text-sm text-fg-muted sm:inline">
              {entry.correctCount}/15
            </span>
            <span className="hidden text-xs text-fg-subtle sm:inline">
              {dateFmt.format(new Date(entry.createdAt))}
            </span>
            <span className="w-20 text-right font-mono font-semibold tabular-nums sm:w-24">
              {entry.score.toLocaleString("pt-BR")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
