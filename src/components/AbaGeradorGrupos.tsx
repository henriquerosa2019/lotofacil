"use client";

import React, { useState } from "react";
import { GrupoDezenas, ConcursoLotofacil, JogoRegistrado } from "@/lib/types";
import { GRUPOS_PADRAO, VALOR_APOSTA_15 } from "@/lib/lotofacil-engine";
import { saveJogoRegistrado, deleteJogoRegistrado, undoUltimoJogo } from "@/lib/storage";
import VolanteGrid from "./VolanteGrid";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Play,
  Undo2,
  RotateCcw,
  Trash2,
} from "lucide-react";

interface AbaGeradorGruposProps {
  ultimoConcurso: ConcursoLotofacil | null;
  jogos?: JogoRegistrado[];
  onJogoRegistrado: () => void;
  onIrParaAfericao: () => void;
}

export default function AbaGeradorGrupos({
  ultimoConcurso,
  jogos = [],
  onJogoRegistrado,
  onIrParaAfericao,
}: AbaGeradorGruposProps) {
  const [grupos] = useState<GrupoDezenas[]>(GRUPOS_PADRAO);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<string>("grupo-1");
  const [teimosinhaQtd, setTeimosinhaQtd] = useState<number>(24);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [ultimoJogoId, setUltimoJogoId] = useState<string | null>(null);

  const concursoAtual = ultimoConcurso?.numero || 3826;
  const proximoConcurso = concursoAtual + 1;

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
      `Jogo registrado com sucesso! ${grupo.nome} agora está ativo para aferição do Concurso ${novoJogo.concursoInicial} ao ${novoJogo.concursoFinal}.`
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
      {/* Banner / Header */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#121827] to-amber-950/20 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
              IA & DNA Estatístico
            </span>
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 3 Grupos de Ouro Selecionados
            </span>
          </div>
          <h2 className="text-base md:text-lg font-bold text-white mt-1">
            Escolha o Grupo Ranqueado pela Inteligência Artificial
          </h2>
          <p className="text-xs text-gray-400 max-w-2xl mt-0.5">
            Cada grupo contém 15 dezenas com score máximo de convergência (8 Ímpares, 5 Primos, 10 na Moldura, Soma ~195 e 9 repetidas). Todos são <strong>100% inéditos</strong> no histórico.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-900/80 px-3 py-2 rounded-xl border border-gray-800">
            <span>Teimosinha:</span>
            <select
              value={teimosinhaQtd}
              onChange={(e) => setTeimosinhaQtd(parseInt(e.target.value, 10))}
              className="bg-black/40 text-purple-300 font-bold border border-purple-500/30 rounded px-2 py-1 outline-none"
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
      </div>

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
              onClick={onIrParaAfericao}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              Ir para Aferição
            </button>
          </div>
        </div>
      )}

      {/* Cards dos 3 Grupos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {grupos.map((g, index) => {
          const isSelected = g.id === grupoSelecionadoId;
          const custoGrupo = teimosinhaQtd * VALOR_APOSTA_15;

          return (
            <div
              key={g.id}
              onClick={() => setGrupoSelecionadoId(g.id)}
              className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? "bg-[#141b2d] border-purple-500 shadow-xl shadow-purple-900/20 ring-1 ring-purple-500"
                  : "bg-[#121827] border-gray-800 hover:border-gray-700 hover:bg-[#131929]"
              }`}
            >
              <div className="space-y-3">
                {/* Header do Grupo */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                      Opção #{index + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{g.nome}</h3>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Score {g.score.toFixed(1)}/10
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{g.descricao}</p>

                {/* Volante Grid Visual */}
                <div className="py-2 flex justify-center">
                  <VolanteGrid selectedNumbers={g.dezenas} compact />
                </div>

                {/* Badges de Atributos */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                    <span className="text-gray-400 block">Paridade:</span>
                    <strong className="text-purple-300">{g.impares} Ímpares / {g.pares} Pares</strong>
                  </div>
                  <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                    <span className="text-gray-400 block">Números Primos:</span>
                    <strong className="text-emerald-300">{g.primos} Primos</strong>
                  </div>
                  <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                    <span className="text-gray-400 block">Moldura:</span>
                    <strong className="text-amber-300">{g.moldura} Moldura / {g.centro} Centro</strong>
                  </div>
                  <div className="p-2 rounded bg-gray-900/80 border border-gray-800/80">
                    <span className="text-gray-400 block">Soma Total:</span>
                    <strong className="text-fuchsia-300">{g.soma} (Média: 195)</strong>
                  </div>
                </div>

                {/* Selo Inédito */}
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegistrarAposta(g);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Apostar neste Grupo ({teimosinhaQtd}x)
                </button>
              </div>
            </div>
          );
        })}
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
              Você pode desfazer qualquer jogo a qualquer momento
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
