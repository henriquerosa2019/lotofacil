import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lotofácil AI — Estatísticas, IA & Aferição Oficial",
  description: "Análise probabilística, grupos ranqueados por IA, aferição de resultados da Caixa e controle financeiro de apostas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#0b0f19] text-gray-100 antialiased selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
