"use client";

import React from "react";
import { Sparkles, RefreshCw, Trophy, Wallet, ArrowDownCircle } from "lucide-react";
import { ConcursoLotofacil } from "@/lib/types";

interface HeaderProps {
  ultimoConcurso: ConcursoLotofacil | null;
  loadingApi: boolean;
  onRefreshApi: () => void;
  totalInvestido: number;
  totalGanhos: number;
  totalSacado?: number;
  saldoDisponivelSaque?: number;
  onOpenGanhadores: (concursoNum?: number) => void;
  onIrParaFinanceiro?: () => void;
}

export default function Header({
  ultimoConcurso,
  loadingApi,
  onRefreshApi,
  totalInvestido,
  totalGanhos,
  totalSacado = 0,
  saldoDisponivelSaque = 0,
  onOpenGanhadores,
  onIrParaFinanceiro,
}: HeaderProps) {
  const [concursoInput, setConcursoInput] = React.useState<string>("");
  const saldoLiquido = totalGanhos - totalInvestido;

  const handleBuscarResultado = () => {
    const num = parseInt(concursoInput.trim(), 10);
    if (!isNaN(num) && num > 0) {
      onOpenGanhadores(num);
    } else {
      onOpenGanhadores();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBuscarResultado();
    }
  };

  return (
    <header className="border-b border-gray-800 bg-[#101626]/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-white bg-clip-text text-transparent">
                Lotofácil AI & Monitor
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Análise probabilística, grupos ranqueados por IA e aferição oficial Caixa
            </p>
          </div>
        </div>

        {/* Caixa Status & Quick Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Barra de Aferição Caixa com Concurso Opcional */}
          <div className="flex items-center rounded-xl bg-gray-900/90 border border-purple-500/40 p-1 shadow-md shadow-purple-950/20">
            <input
              type="number"
              placeholder={ultimoConcurso ? `C.${ultimoConcurso.numero}` : "Nº Conc."}
              value={concursoInput}
              onChange={(e) => setConcursoInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-20 sm:w-24 bg-black/60 border border-gray-700/60 rounded-lg px-2 py-1 text-xs text-purple-200 font-mono font-bold text-center outline-none focus:border-purple-400 placeholder:text-gray-500"
              title="Digite o número do concurso que deseja aferir ou deixe em branco para o último da Caixa"
            />
            <button
              onClick={handleBuscarResultado}
              className="ml-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-purple-900/40 group active:scale-95"
              title={
                concursoInput.trim()
                  ? `Clique para aferir oficialmente o Concurso ${concursoInput.trim()} na Caixa`
                  : `Clique para aferir o último concurso apurado pela Caixa${ultimoConcurso ? ` (C.${ultimoConcurso.numero})` : ""}`
              }
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
              <span>
                {concursoInput.trim() ? (
                  <>Aferir C.{concursoInput.trim()}</>
                ) : (
                  <>
                    <strong>★ Ver Resultado (Caixa)</strong>
                    {ultimoConcurso ? ` (C.${ultimoConcurso.numero})` : ""}
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Saldo Acumulado a Sacar (Debitado conforme saques) */}
          <div
            onClick={onIrParaFinanceiro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs cursor-pointer hover:bg-emerald-900/50 transition-all"
            title="Prêmios acumulados disponíveis para saque. Clique para gerenciar saques."
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-gray-300 text-[11px] font-medium">Saldo em Conta:</span>
            <span className="font-bold font-mono text-emerald-300">
              {saldoDisponivelSaque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          {/* Saldo Líquido Consolidado */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <Wallet className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-400 text-[11px]">Líquido:</span>
            <span
              className={`font-semibold font-mono ${
                saldoLiquido >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {saldoLiquido >= 0 ? "+" : ""}
              {saldoLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefreshApi}
            disabled={loadingApi}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Atualizar dados da Caixa"
          >
            <RefreshCw className={`w-4 h-4 ${loadingApi ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
