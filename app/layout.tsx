import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Claude Code Quiz",
    template: "%s — Claude Code Quiz",
  },
  description:
    "Teste seus conhecimentos sobre o Claude Code da Anthropic em um quiz Verdadeiro ou Falso com feedback educativo e ranking global.",
  applicationName: "Claude Code Quiz",
  authors: [{ name: "Luciano Galvão" }],
  keywords: ["Claude Code", "Anthropic", "quiz", "IA", "Claude API", "Agent SDK"],
  openGraph: {
    title: "Claude Code Quiz",
    description:
      "Quiz Verdadeiro ou Falso sobre o Claude Code: do básico ao avançado, com feedback didático e ranking global.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Code Quiz",
    description: "Quiz V/F sobre o Claude Code, com feedback didático e ranking global.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg-base text-fg font-sans">{children}</body>
    </html>
  );
}
