"use client";

import React from "react";
import { Sparkles, RefreshCw, Trophy, Wallet, Landmark } from "lucide-react";
import { ConcursoLotofacil } from "@/lib/types";

interface HeaderProps {
  ultimoConcurso: ConcursoLotofacil | null;
  loadingApi: boolean;
  onRefreshApi: () => void;
  totalInvestido: number;
  totalGanhos: number;
  onOpenGanhadores: () => void;
}

export default function Header({
  ultimoConcurso,
  loadingApi,
  onRefreshApi,
  totalInvestido,
  totalGanhos,
  onOpenGanhadores,
}: HeaderProps) {
  const saldoLiquido = totalGanhos - totalInvestido;

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
        <div className="flex flex-wrap items-center gap-2.5">
          {ultimoConcurso && (
            <button
              onClick={onOpenGanhadores}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 hover:border-purple-400 text-purple-200 text-xs transition-all cursor-pointer group"
              title="Clique para ver detalhes de ganhadores e cidades"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>
                Último: <strong className="text-white">Concurso {ultimoConcurso.numero}</strong> ({ultimoConcurso.dataApuracao})
              </span>
            </button>
          )}

          {/* Quick Balance */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <Wallet className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Saldo:</span>
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
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all disabled:opacity-50"
            title="Atualizar dados da Caixa"
          >
            <RefreshCw className={`w-4 h-4 ${loadingApi ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
