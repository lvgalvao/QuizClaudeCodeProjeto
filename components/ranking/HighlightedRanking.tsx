"use client";

import { useSyncExternalStore } from "react";
import { RankingTable } from "@/components/ranking/RankingTable";
import type { RankingEntry } from "@/types/quiz";

const STORAGE_KEY = "ccq:lastEntryId";

export function setLastEntryId(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: id }));
  } catch {
    // ignore
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

export function HighlightedRanking({ entries }: { entries: RankingEntry[] }) {
  const highlightId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <RankingTable entries={entries} highlightId={highlightId} />;
}
