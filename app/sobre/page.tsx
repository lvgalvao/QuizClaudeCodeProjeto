import Link from "next/link";
import { Container } from "@/components/Container";

export const metadata = {
  title: "Como Funciona",
  description: "Regras, pontuação e propósito do Claude Code Quiz.",
};

export default function SobrePage() {
  return (
    <main className="py-16">
      <Container className="space-y-10">
        <header className="space-y-3">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-accent hover:underline"
          >
            ← Início
          </Link>
          <h1 className="text-4xl font-semibold">Como Funciona</h1>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-accent-soft">O quiz</h2>
          <p className="text-fg-muted">
            Cada partida tem 15 perguntas Verdadeiro ou Falso sobre o Claude Code, Claude API
            e Agent SDK. A dificuldade cresce ao longo da partida: 5 iniciantes, 6
            intermediárias e 4 avançadas. Você tem 15 segundos por pergunta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-accent-soft">Vidas ❤️</h2>
          <ul className="space-y-2 text-fg-muted">
            <li>Você começa com <strong className="text-fg">2 vidas</strong>.</li>
            <li>Cada resposta errada ou tempo esgotado <strong className="text-fg">custa 1 vida</strong>.</li>
            <li>A cada <strong className="text-fg">5 acertos consecutivos no contador de vidas</strong>, você ganha <strong className="text-fg">+1 vida</strong> de bônus.</li>
            <li>Ficou sem vidas? A partida encerra imediatamente e você pode salvar sua pontuação no ranking.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-accent-soft">Pontuação</h2>
          <ul className="space-y-2 text-fg-muted">
            <li>
              <strong className="text-fg">Base por pergunta:</strong> 100 (iniciante), 200
              (intermediária) ou 300 (avançada) pontos.
            </li>
            <li>
              <strong className="text-fg">Bônus de tempo:</strong> até +50 pontos
              proporcional ao tempo restante (15s totais).
            </li>
            <li>
              <strong className="text-fg">Bônus de streak:</strong> +20 pontos por acerto
              consecutivo, com teto de +100. Errar zera a sequência.
            </li>
            <li>
              Errar ou deixar o tempo esgotar vale <strong className="text-fg">0 pontos</strong>{" "}
              naquela pergunta.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-accent-soft">Ranking</h2>
          <p className="text-fg-muted">
            Ao terminar, você pode salvar sua pontuação no ranking global escolhendo um
            nickname. Sem cadastro: o sistema é anônimo. O top 50 fica visível na página de
            ranking.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-accent-soft">Propósito</h2>
          <p className="text-fg-muted">
            Esse é um projeto educativo para praticar conhecimentos sobre Claude Code de
            forma lúdica. Encontrou alguma resposta incorreta?{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="https://docs.claude.com/en/docs/claude-code/overview"
              target="_blank"
              rel="noopener noreferrer"
            >
              Confira a documentação oficial
            </a>
            .
          </p>
        </section>

        <Link
          href="/quiz"
          className="inline-flex rounded-2xl bg-accent px-6 py-4 font-semibold text-bg-base"
        >
          Jogar agora →
        </Link>
      </Container>
    </main>
  );
}
