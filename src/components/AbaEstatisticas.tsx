"use client";

import React, { useState, useMemo } from "react";
import { ConcursoLotofacil, GrupoDezenas, JogoRegistrado } from "@/lib/types";
import {
  gerarMelhoresQuinzenas,
  VALOR_APOSTA_15,
} from "@/lib/lotofacil-engine";
import { saveJogoRegistrado, deleteJogoRegistrado, undoUltimoJogo } from "@/lib/storage";
import VolanteGrid from "./VolanteGrid";
import {
  BarChart3,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Play,
  Undo2,
  RotateCcw,
  Trash2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface AbaEstatisticasProps {
  historico: ConcursoLotofacil[];
  ultimoConcurso: ConcursoLotofacil | null;
  jogos?: JogoRegistrado[];
  onJogoRegistrado: () => void;
  onIrParaAfericao: (grupoId?: string) => void;
}

export default function AbaEstatisticas({
  historico,
  ultimoConcurso,
  jogos = [],
  onJogoRegistrado,
  onIrParaAfericao,
}: AbaEstatisticasProps) {
  const totalDisponivel = historico.length;
  // Inicia por padrão com 20 concursos
  const [janela, setJanela] = useState<number>(20);
  const [teimosinhaQtd, setTeimosinhaQtd] = useState<number>(24);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [ultimoJogoId, setUltimoJogoId] = useState<string | null>(null);

  const concursoAtual = ultimoConcurso?.numero || 3760;
  const proximoConcurso = concursoAtual + 1;

  // GERAÇÃO DINÂMICA DAS 3 MELHORES QUINZENAS CONFORME A JANELA ESCOLHIDA (10, 20, 50, etc.)
  const grupos = useMemo(() => {
    return gerarMelhoresQuinzenas(historico, janela);
  }, [historico, janela]);

  const presets = [10, 20, 50, 100, 500, totalDisponivel];

  const handleRegistrarAposta = (grupo: GrupoDezenas) => {
    const custo = teimosinhaQtd * VALOR_APOSTA_15;
    const novoJogo: JogoRegistrado = {
      id: `jogo_${Date.now()}_${grupo.id}`,
      grupoId: grupo.id,
      grupoNome: grupo.nome,
      dezenas: grupo.dezenas,
      concursoInicial: proximoConcurso,
      teimosinhaConcursos: teimosinhaQtd,
      concursoFinal: proximoConcurso + teimosinhaQtd - 1,
      dataAposta: new Date().toLocaleDateString("pt-BR"),
      custoTotal: custo,
      status: "ativo",
      apuracoes: {},
      totalGanho: 0,
    };

    saveJogoRegistrado(novoJogo);
    setUltimoJogoId(novoJogo.id);
    onJogoRegistrado();
    setSucessoMsg(
      `Jogo registrado com sucesso! ${grupo.nome} agora está pronto para aferição com a Caixa (Concurso ${novoJogo.concursoInicial} ao ${novoJogo.concursoFinal}).`
    );
  };

  const handleDesfazerJogo = (idParaRemover?: string) => {
    const id = idParaRemover || ultimoJogoId;
    if (id) {
      deleteJogoRegistrado(id);
    } else {
      undoUltimoJogo();
    }
    onJogoRegistrado();
    setUltimoJogoId(null);
    setSucessoMsg("Jogo desfeito e removido com sucesso!");
    setTimeout(() => setSucessoMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Janela de Análise Probabilística (Selector Central) */}
      <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-r from-[#121827] via-[#151c30] to-[#121827] border border-purple-500/30 space-y-4 shadow-xl shadow-purple-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
                Análise Probabilística Ativa
              </span>
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Geração Dinâmica de Quinzenas
              </span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Escolha a Janela de Concursos para Gerar as Melhores Quinzenas
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Ao clicar no número de concursos abaixo, a IA recalcula as frequências e gera instantaneamente as 3 melhores combinações de 15 dezenas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-300 bg-gray-900/90 px-3.5 py-2 rounded-xl border border-gray-800 font-mono">
            <span>Amostragem:</span>
            <strong className="text-purple-400">
              Últimos {janela} concursos
            </strong>
          </div>
        </div>

        {/* Atalhos Rápidos de Concursos: 10, 20, 50, 100, 500, Todos */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-semibold">
              Selecione o número de concursos para análise:
            </span>
            <span className="text-xs text-purple-300 font-mono font-bold">
              {janela} {janela === 1 ? "concurso" : "concursos"}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presets.map((p) => {
              const isSelected = janela === p;
              const label = p === totalDisponivel ? `Todos (${totalDisponivel})` : `${p} Concursos`;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setJanela(p)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400 scale-[1.02]"
                      : "bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Range Slider de Ajuste Fino */}
        <div className="space-y-1.5 pt-1 border-t border-gray-800/80">
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Mínimo: 1 concurso</span>
            <span>Ajuste fino contínuo</span>
            <span>Máximo: {totalDisponivel} concursos</span>
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

      {/* Notificação de Sucesso & Desfazer */}
      {sucessoMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {ultimoJogoId && (
              <button
                type="button"
                onClick={() => handleDesfazerJogo(ultimoJogoId)}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 text-rose-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Desfazer e cancelar este jogo"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Desfazer Jogo
              </button>
            )}
            <button
              type="button"
              onClick={() => onIrParaAfericao()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Ir para Aferição</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Controles Globais da Teimosinha para os Grupos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
        <div className="text-gray-300">
          <strong className="text-white">Opções de Aposta:</strong> Cada aposta simples de 15 dezenas custa <strong className="text-emerald-400">R$ 3,50</strong>.
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-gray-400">Ciclo da Teimosinha:</span>
          <select
            value={teimosinhaQtd}
            onChange={(e) => setTeimosinhaQtd(parseInt(e.target.value, 10))}
            className="bg-black/60 text-purple-300 font-bold border border-purple-500/40 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value={1}>1 Concurso (R$ 3,50)</option>
            <option value={3}>3 Concursos (R$ 10,50)</option>
            <option value={6}>6 Concursos (R$ 21,00)</option>
            <option value={12}>12 Concursos (R$ 42,00)</option>
            <option value={18}>18 Concursos (R$ 63,00)</option>
            <option value={24}>24 Concursos (R$ 84,00)</option>
          </select>
        </div>
      </div>

      {/* Os 3 Conjuntos das Melhores Quinzenas Geradas Dinamicamente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            As 3 Melhores Quinzenas Geradas pela IA (Janela: {janela} concursos)
          </h3>
          <span className="text-xs text-purple-400 font-mono">
            {grupos.length} grupos ranqueados
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {grupos.map((g, index) => {
            const custoGrupo = teimosinhaQtd * VALOR_APOSTA_15;

            return (
              <div
                key={g.id}
                className="p-4 md:p-5 rounded-2xl border border-gray-800 bg-[#121827] hover:border-purple-500/60 hover:bg-[#131929] transition-all flex flex-col justify-between space-y-4 shadow-lg shadow-black/40"
              >
                <div className="space-y-3">
                  {/* Header do Grupo */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                        Opção #{index + 1} • {janela} Concursos
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{g.nome}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                        Score {g.score.toFixed(1)}/10
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed min-h-[36px]">{g.descricao}</p>

                  {/* Volante Grid Visual */}
                  <div className="py-2 flex justify-center">
                    <VolanteGrid selectedNumbers={g.dezenas} compact />
                  </div>

                  {/* Badges de Atributos Estruturais */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                      <span className="text-gray-400 block">Paridade:</span>
                      <strong className="text-purple-300">{g.impares} Ímpares / {g.pares} Pares</strong>
                    </div>
                    <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                      <span className="text-gray-400 block">Primos:</span>
                      <strong className="text-emerald-300">{g.primos} Primos</strong>
                    </div>
                    <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                      <span className="text-gray-400 block">Moldura:</span>
                      <strong className="text-amber-300">{g.moldura} Moldura / {g.centro} Centro</strong>
                    </div>
                    <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                      <span className="text-gray-400 block">Soma:</span>
                      <strong className="text-fuchsia-300">{g.soma} pts</strong>
                    </div>
                  </div>

                  {/* Selo Inédito */}
                  <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>100% Inédito:</strong> Nunca saiu com 15 pontos em 3.760 concursos.
                    </span>
                  </div>
                </div>

                {/* Botão de Registro / Aposta */}
                <div className="pt-2 border-t border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Custo ({teimosinhaQtd} conc.):</span>
                    <span className="font-bold text-white font-mono">
                      {custoGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRegistrarAposta(g)}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Apostar e Enviar para Aferição ({teimosinhaQtd}x)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção de Jogos Registrados & Opção de Desfazer */}
      {jogos && jogos.length > 0 && (
        <div className="p-4 md:p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-purple-400" />
              Seus Jogos Registrados Ativos ({jogos.length})
            </h4>
            <span className="text-[11px] text-gray-500">
              Você pode conferir todos na aba "Aferição Oficial" ou cancelar a aposta a qualquer momento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jogos.map((j) => (
              <div
                key={j.id}
                className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-white">{j.grupoNome}</strong>
                    <span className="text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/50">
                      {j.teimosinhaConcursos}x ({j.custoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Concurso {j.concursoInicial} ao {j.concursoFinal}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onIrParaAfericao(j.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Aferir este jogo na Caixa"
                  >
                    Aferir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDesfazerJogo(j.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 hover:border-rose-400 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Desfazer e remover este jogo"
                  >
                    <Trash2 className="w-3 h-3" />
                    Desfazer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
