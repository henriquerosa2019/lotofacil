"use client";

import React, { useState } from "react";
import { ConcursoLotofacil, JogoRegistrado } from "@/lib/types";
import { GRUPOS_PADRAO, VALOR_APOSTA_15 } from "@/lib/lotofacil-engine";
import { saveJogoRegistrado, deleteJogoRegistrado } from "@/lib/storage";
import { Calculator, Calendar, Coins, CheckCircle2, ShieldCheck, ArrowRight, Undo2 } from "lucide-react";

interface AbaTeimosinhaProps {
  ultimoConcurso: ConcursoLotofacil | null;
  onJogoRegistrado: () => void;
  onIrParaAfericao: () => void;
}

export default function AbaTeimosinha({
  ultimoConcurso,
  onJogoRegistrado,
  onIrParaAfericao,
}: AbaTeimosinhaProps) {
  const [jogosSelecionados, setJogosSelecionados] = useState<number>(3); // 1, 2 ou 3 jogos
  const [teimosinhaOpcao, setTeimosinhaOpcao] = useState<number>(24);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [ultimosRegistradosIds, setUltimosRegistradosIds] = useState<string[]>([]);

  const concursoAtual = ultimoConcurso?.numero || 3826;
  const proximoConcurso = concursoAtual + 1;

  const opcoesTeimosinha = [
    { concursos: 1, duracao: "1 dia", semanas: "Avulso" },
    { concursos: 3, duracao: "3 dias", semanas: "Meia semana" },
    { concursos: 6, duracao: "6 dias", semanas: "1 semana completa" },
    { concursos: 12, duracao: "12 dias", semanas: "2 semanas" },
    { concursos: 18, duracao: "18 dias", semanas: "3 semanas" },
    { concursos: 24, duracao: "24 dias", semanas: "4 semanas (1 mês)" },
  ];

  const custoTotal = jogosSelecionados * teimosinhaOpcao * VALOR_APOSTA_15;

  const handleRegistrarCombo = () => {
    const gruposParaRegistrar = GRUPOS_PADRAO.slice(0, jogosSelecionados);
    const novosIds: string[] = [];
    gruposParaRegistrar.forEach((g) => {
      const custo = teimosinhaOpcao * VALOR_APOSTA_15;
      const novoJogo: JogoRegistrado = {
        id: `jogo_${Date.now()}_${g.id}`,
        grupoId: g.id,
        grupoNome: g.nome,
        dezenas: g.dezenas,
        concursoInicial: proximoConcurso,
        teimosinhaConcursos: teimosinhaOpcao,
        concursoFinal: proximoConcurso + teimosinhaOpcao - 1,
        dataAposta: new Date().toLocaleDateString("pt-BR"),
        custoTotal: custo,
        status: "ativo",
        apuracoes: {},
        totalGanho: 0,
      };
      saveJogoRegistrado(novoJogo);
      novosIds.push(novoJogo.id);
    });

    setUltimosRegistradosIds(novosIds);
    onJogoRegistrado();
    setSucessoMsg(
      `Sucesso! ${jogosSelecionados} jogos registrados para a Teimosinha de ${teimosinhaOpcao} concursos (Total: ${custoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`
    );
  };

  const handleDesfazerCombo = () => {
    ultimosRegistradosIds.forEach((id) => deleteJogoRegistrado(id));
    setUltimosRegistradosIds([]);
    onJogoRegistrado();
    setSucessoMsg("Registro cancelado! Os jogos foram removidos com sucesso.");
    setTimeout(() => setSucessoMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 md:p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-2">
        <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-400" />
          Simulador de Custos e Planejamento da Teimosinha
        </h2>
        <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
          O valor oficial da aposta simples de 15 dezenas na Lotofácil é de <strong>R$ 3,50</strong>.
          Simule os custos exatos para apostar individualmente ou com o conjunto de 3 Grupos de Ouro ao longo das opções oficiais de repetição da Caixa (1 a 24 concursos).
        </p>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {ultimosRegistradosIds.length > 0 && (
              <button
                type="button"
                onClick={handleDesfazerCombo}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 text-rose-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Desfazer e cancelar estes jogos registrados"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Desfazer Registro
              </button>
            )}
            <button
              type="button"
              onClick={onIrParaAfericao}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shrink-0 cursor-pointer"
            >
              Ir para Aferição
            </button>
          </div>
        </div>
      )}

      {/* Simulator Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quantidade de Jogos */}
        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-3">
          <span className="text-xs font-semibold text-gray-300 block">
            1. Escolha a Quantidade de Jogos Simultâneos:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((q) => (
              <button
                key={q}
                onClick={() => setJogosSelecionados(q)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  jogosSelecionados === q
                    ? "bg-purple-600/30 border-purple-500 text-white font-bold"
                    : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <div className="text-base">{q} {q === 1 ? "Jogo" : "Jogos"}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {(q * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / sorteio
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quantidade de Concursos (Teimosinha) */}
        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-3">
          <span className="text-xs font-semibold text-gray-300 block">
            2. Escolha o Ciclo da Teimosinha:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {opcoesTeimosinha.map((op) => (
              <button
                key={op.concursos}
                onClick={() => setTeimosinhaOpcao(op.concursos)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  teimosinhaOpcao === op.concursos
                    ? "bg-purple-600/30 border-purple-500 text-white font-bold"
                    : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <div className="text-sm">{op.concursos} Concursos</div>
                <div className="text-[10px] text-purple-300 mt-0.5">{op.semanas}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Card and Action */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-[#121827] to-black/40 border border-purple-500/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block">
              Resumo do Investimento Calculado
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {jogosSelecionados} {jogosSelecionados === 1 ? "jogo" : "jogos"} × {teimosinhaOpcao} concursos consecutivos
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Concursos cobertos: <strong>C.{proximoConcurso}</strong> ao <strong>C.{proximoConcurso + teimosinhaOpcao - 1}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-400 block">Valor Total a Pagar na Caixa:</span>
            <div className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono mt-0.5">
              {custoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        </div>

        {/* Projection Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
            <span className="text-gray-400 block">Custo por Concurso:</span>
            <strong className="text-white text-sm font-mono">
              {(jogosSelecionados * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
            <span className="text-gray-400 block">Duração Estimada:</span>
            <strong className="text-white text-sm">
              {Math.ceil(teimosinhaOpcao / 6)} {Math.ceil(teimosinhaOpcao / 6) === 1 ? "Semana" : "Semanas"} (6 sorteios/sem)
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
            <span className="text-gray-400 block">Expectativa Histórica de Retorno:</span>
            <strong className="text-amber-400 text-sm">
              ~{((jogosSelecionados * teimosinhaOpcao * 0.1085)).toFixed(0)} a {((jogosSelecionados * teimosinhaOpcao * 0.1178)).toFixed(0)} prêmios de amortização
            </strong>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleRegistrarCombo}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-98"
          >
            <span>Confirmar e Registrar {jogosSelecionados} {jogosSelecionados === 1 ? "Jogo" : "Jogos"} na Teimosinha ({teimosinhaOpcao} Concursos)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabela de Preços Oficiais da Lotofácil (Referência) */}
      <div className="p-4 md:p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-3">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-400" />
          Tabela Comparativa de Teimosinhas Oficiais da Caixa (R$ 3,50 / jogo)
        </h4>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-900 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Teimosinha</th>
                <th className="py-2.5 px-3">Duração</th>
                <th className="py-2.5 px-3 text-right">1 Jogo (R$)</th>
                <th className="py-2.5 px-3 text-right">2 Jogos (R$)</th>
                <th className="py-2.5 px-3 text-right font-bold text-purple-300">3 Jogos (Ouro)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950/40">
              {opcoesTeimosinha.map((op) => (
                <tr key={op.concursos} className="hover:bg-white/5">
                  <td className="py-2 px-3 font-semibold text-white">
                    {op.concursos} Concursos
                  </td>
                  <td className="py-2 px-3 text-gray-400">{op.semanas}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-300">
                    {(op.concursos * 1 * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-300">
                    {(op.concursos * 2 * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                    {(op.concursos * 3 * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
