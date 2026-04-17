import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import logo from "@/asset/logo.png";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Container className="flex flex-1 flex-col justify-center py-16">
        <div className="space-y-10">
          <header className="space-y-4">
            <p className="font-mono text-sm uppercase tracking-[0.2em] text-accent">
              Verdadeiro ou Falso
            </p>
            <h1 className="sr-only">Claude Code Quiz</h1>
            <Image
              src={logo}
              alt="Claude Code Quiz"
              priority
              placeholder="blur"
              className="h-auto w-full max-w-[12rem] opacity-90"
            />
            <p className="max-w-xl text-pretty text-lg text-fg-muted">
              15 perguntas, 15 segundos cada. Você começa com 2 vidas ❤️❤️ —
              errou duas, acabou a partida. A cada 5 acertos, ganha uma vida extra.
            </p>
          </header>

          <Link
            href="/quiz"
            className="group inline-flex w-full items-center justify-between gap-4 rounded-2xl bg-accent px-6 py-5 text-lg font-semibold text-bg-base shadow-lg shadow-accent/20 transition-transform hover:-translate-y-0.5 sm:w-auto sm:min-w-[18rem]"
            aria-label="Iniciar uma nova partida do quiz"
          >
            Iniciar Quiz
            <span aria-hidden="true" className="text-2xl transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/ranking"
              className="rounded-2xl border border-border-subtle bg-bg-card p-6 transition-colors hover:bg-bg-card-hover"
            >
              <h2 className="text-lg font-medium">Ver Ranking</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Top 50 jogadores globais ordenados por pontuação.
              </p>
            </Link>
            <Link
              href="/sobre"
              className="rounded-2xl border border-border-subtle bg-bg-card p-6 transition-colors hover:bg-bg-card-hover"
            >
              <h2 className="text-lg font-medium">Como Funciona</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Regras, pontuação e o porquê do projeto.
              </p>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
