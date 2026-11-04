"use client";

import React, { useState, useMemo } from "react";
import { ConcursoLotofacil } from "@/lib/types";
import { analisarEstatisticas } from "@/lib/lotofacil-engine";
import { BarChart3, Flame, Snowflake, Scale, Hash, LayoutGrid, Activity, Clock } from "lucide-react";

interface AbaEstatisticasProps {
  historico: ConcursoLotofacil[];
}

export default function AbaEstatisticas({ historico }: AbaEstatisticasProps) {
  const totalDisponivel = historico.length;
  const [janela, setJanela] = useState<number>(Math.min(50, totalDisponivel));

  const stats = useMemo(() => {
    return analisarEstatisticas(historico, janela);
  }, [historico, janela]);

  const presets = [10, 20, 50, 100, 500, totalDisponivel];

  return (
    <div className="space-y-6">
      {/* Window Selector */}
      <div className="p-4 md:p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Janela de Análise Probabilística
            </h2>
            <p className="text-xs text-gray-400">
              Escolha a quantidade de concursos para calcular tendências, números quentes, frios e equilíbrios.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800 font-mono">
            <span>Intervalo:</span>
            <strong className="text-purple-400">
              C.{stats.concursoInicial} a C.{stats.concursoFinal}
            </strong>
            <span className="text-gray-500">({stats.totalConcursos} jogos)</span>
          </div>
        </div>

        {/* Presets and Slider */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-gray-400 font-medium mr-1">Atalhos Rápidos:</span>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setJanela(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                janela === p
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50"
              }`}
            >
              {p === totalDisponivel ? `Todos (${totalDisponivel})` : `${p} Concursos`}
            </button>
          ))}
        </div>

        {/* Range Slider */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>1 Concurso</span>
            <span className="font-bold text-purple-300">
              {janela} {janela === 1 ? "Concurso selecionado" : "Concursos selecionados"}
            </span>
            <span>{totalDisponivel} Concursos</span>
          </div>
          <input
            type="range"
            min={1}
            max={totalDisponivel}
            value={janela}
            onChange={(e) => setJanela(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Thermometer Cards: Quentes, Neutras e Frias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quentes */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/30 to-[#121827] border border-rose-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" /> Números Quentes (Alta Freq.)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
              {stats.quentes.length} dezenas
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Saíram com frequência superior a 65% na janela selecionada.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.quentes.map((n) => (
              <span
                key={n}
                className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center shadow-sm"
                title={`Dezena ${n}: saiu ${stats.frequencias[n]?.total}x (${stats.frequencias[n]?.percentual}%)`}
              >
                {n.toString().padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>

        {/* Neutras */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/20 to-[#121827] border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Scale className="w-4 h-4 text-blue-400" /> Números Neutros (Estáveis)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
              {stats.neutras.length} dezenas
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Frequência média entre 55% e 65% (estabilidade matemática).
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.neutras.map((n) => (
              <span
                key={n}
                className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center"
                title={`Dezena ${n}: saiu ${stats.frequencias[n]?.total}x (${stats.frequencias[n]?.percentual}%)`}
              >
                {n.toString().padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>

        {/* Frias */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/20 to-[#121827] border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Snowflake className="w-4 h-4 text-cyan-400" /> Números Frios (Em Atraso)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
              {stats.frias.length} dezenas
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Frequência abaixo de 55%. Excelentes para retorno cíclico compensatório.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.frias.map((n) => (
              <span
                key={n}
                className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center"
                title={`Dezena ${n}: saiu ${stats.frequencias[n]?.total}x (${stats.frequencias[n]?.percentual}%)`}
              >
                {n.toString().padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Structural Distributions: Paridade, Primos, Moldura, Soma */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paridade */}
        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-2.5">
          <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-400" /> Paridade (Ímpares / Pares)
          </span>
          <div className="space-y-1.5 text-xs">
            {Object.entries(stats.distribuicaoParidade)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([key, count]) => {
                const pct = ((count / stats.totalConcursos) * 100).toFixed(1);
                return (
                  <div key={key} className="flex items-center justify-between p-1.5 rounded bg-gray-900/60">
                    <span className="font-medium text-gray-300">{key}</span>
                    <span className="font-mono text-purple-400 font-semibold">{pct}% ({count}x)</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Primos */}
        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-2.5">
          <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-emerald-400" /> Números Primos
          </span>
          <div className="space-y-1.5 text-xs">
            {Object.entries(stats.distribuicaoPrimos)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([primos, count]) => {
                const pct = ((count / stats.totalConcursos) * 100).toFixed(1);
                return (
                  <div key={primos} className="flex items-center justify-between p-1.5 rounded bg-gray-900/60">
                    <span className="font-medium text-gray-300">{primos} Primos</span>
                    <span className="font-mono text-emerald-400 font-semibold">{pct}% ({count}x)</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Moldura */}
        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-2.5">
          <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-amber-400" /> Moldura (16 dezenas)
          </span>
          <div className="space-y-1.5 text-xs">
            {Object.entries(stats.distribuicaoMoldura)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([mold, count]) => {
                const pct = ((count / stats.totalConcursos) * 100).toFixed(1);
                return (
                  <div key={mold} className="flex items-center justify-between p-1.5 rounded bg-gray-900/60">
                    <span className="font-medium text-gray-300">{mold} na Moldura</span>
                    <span className="font-mono text-amber-400 font-semibold">{pct}% ({count}x)</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Soma */}
        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-2.5">
          <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-fuchsia-400" /> Soma das 15 Dezenas
          </span>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded bg-gray-900/60 flex items-center justify-between">
              <span className="text-gray-400">Média Histórica:</span>
              <strong className="text-fuchsia-300 text-sm font-mono">{stats.distribuicaoSoma.media} pts</strong>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 rounded bg-gray-900/60 text-center">
                <span className="text-[10px] text-gray-500 block">Mínima:</span>
                <span className="font-mono text-gray-300 font-semibold">{stats.distribuicaoSoma.min}</span>
              </div>
              <div className="p-1.5 rounded bg-gray-900/60 text-center">
                <span className="text-[10px] text-gray-500 block">Máxima:</span>
                <span className="font-mono text-gray-300 font-semibold">{stats.distribuicaoSoma.max}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Completa de Frequências (1 a 25) */}
      <div className="p-4 md:p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Ranking Detalhado de Ocorrência das 25 Dezenas na Janela ({janela} concursos)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-2 text-xs">
          {Array.from({ length: 25 }, (_, i) => i + 1)
            .sort((a, b) => stats.frequencias[b].total - stats.frequencias[a].total)
            .map((num, rank) => {
              const item = stats.frequencias[num];
              const isQ = stats.quentes.includes(num);
              const isF = stats.frias.includes(num);
              return (
                <div
                  key={num}
                  className={`p-2 rounded-lg border flex items-center justify-between ${
                    isQ
                      ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                      : isF
                      ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-200"
                      : "bg-gray-900/60 border-gray-800 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 text-[10px] text-gray-500 font-mono">{rank + 1}º</span>
                    <strong className="text-sm font-bold font-mono">{num.toString().padStart(2, "0")}</strong>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div>{item.total}x</div>
                    <div className="text-[10px] text-gray-400">{item.percentual}%</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
