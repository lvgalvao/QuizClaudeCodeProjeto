"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setLastEntryId } from "@/components/ranking/HighlightedRanking";
import { useGameStore } from "@/lib/store";
import { nicknameSchema } from "@/lib/validation";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; rank: number | null }
  | { kind: "error"; message: string };

export function NicknameForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const token = useGameStore((s) => s.token);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setState({ kind: "error", message: "Sessão expirada. Jogue uma nova partida." });
      return;
    }

    const parsed = nicknameSchema.safeParse(nickname);
    if (!parsed.success) {
      setState({ kind: "error", message: parsed.error.issues[0]?.message ?? "Nickname inválido" });
      return;
    }

    setState({ kind: "submitting" });

    try {
      const res = await fetch("/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nickname: parsed.data }),
      });

      if (res.status === 503) {
        setState({
          kind: "error",
          message: "Ranking não configurado neste ambiente.",
        });
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setState({ kind: "error", message: data?.error ?? "Erro ao enviar." });
        return;
      }

      if (data?.entry?.id) {
        setLastEntryId(data.entry.id);
      }
      setState({ kind: "success", rank: data?.rank ?? null });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="space-y-4 rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
        <p className="text-base font-semibold text-success">
          Pontuação salva no ranking{state.rank ? ` em #${state.rank}` : ""} 🎉
        </p>
        <button
          type="button"
          onClick={() => router.push("/ranking")}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg-base"
        >
          Ver ranking
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-border-subtle bg-bg-card p-5"
    >
      <label htmlFor="nickname" className="block text-sm font-medium">
        Salvar no ranking global
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="seu_nickname"
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 rounded-xl border border-border-subtle bg-bg-base px-4 py-3 font-mono text-base outline-none focus:border-accent"
          aria-describedby="nickname-help"
        />
        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="rounded-xl bg-accent px-5 py-3 font-semibold text-bg-base disabled:opacity-60"
        >
          {state.kind === "submitting" ? "Enviando…" : "Salvar"}
        </button>
      </div>
      <p id="nickname-help" className="text-xs text-fg-subtle">
        2–20 caracteres, letras, números, _ ou -.
      </p>
      {state.kind === "error" && (
        <p className="text-sm text-error" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
