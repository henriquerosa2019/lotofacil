"use client";

import React, { useState } from "react";
import { JogoRegistrado, ConcursoLotofacil, GrupoDezenas } from "@/lib/types";
import { PREMIOS_FIXOS, GRUPOS_PADRAO, VALOR_APOSTA_15 } from "@/lib/lotofacil-engine";
import { saveJogoRegistrado, deleteJogoRegistrado } from "@/lib/storage";
import VolanteGrid from "./VolanteGrid";
import {
  CheckCircle2,
  Trophy,
  RefreshCw,
  Trash2,
  Calendar,
  AlertCircle,
  Eye,
  Undo2,
  Zap,
  RotateCcw,
  Check,
} from "lucide-react";

interface AbaAfericaoProps {
  jogos: JogoRegistrado[];
  onAtualizarJogos: () => void;
  onVisualizarGanhadoresConcurso: (c: ConcursoLotofacil) => void;
  onIrParaGerador: () => void;
  ultimoConcurso: ConcursoLotofacil | null;
  gruposDisponiveis?: GrupoDezenas[];
}

interface CruzamentoRecente {
  jogoId: string;
  grupoNome: string;
  concurso: number;
  dataApuracao: string;
  acertos: number;
  dezenasSorteadas: number[];
  dezenasAcertadas: number[];
  faixaPremio: string;
  valorGanho: number;
}

export default function AbaAfericao({
  jogos,
  onAtualizarJogos,
  onVisualizarGanhadoresConcurso,
  onIrParaGerador,
  ultimoConcurso,
  gruposDisponiveis = GRUPOS_PADRAO,
}: AbaAfericaoProps) {
  const [aferindoId, setAferindoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Estados para Registro Direto & Cruzamento Instantâneo
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>("grupo-1");
  const [minhasDezenas, setMinhasDezenas] = useState<number[]>([]);
  const [teimosinhaQtd, setTeimosinhaQtd] = useState<number>(1);
  const [processandoCruzamento, setProcessandoCruzamento] = useState<boolean>(false);
  const [cruzamentoRecente, setCruzamentoRecente] = useState<CruzamentoRecente | null>(null);

  const concursoAtual = ultimoConcurso?.numero || 3760;
  const proximoConcurso = concursoAtual + 1;

  // Identifica dezenas ativas conforme a seleção
  const obterDezenasDaOpcao = (): { nome: string; dezenas: number[] } => {
    if (opcaoSelecionada === "custom") {
      return { nome: "Minhas Dezenas Personalizadas", dezenas: [...minhasDezenas].sort((a, b) => a - b) };
    }
    const gIndex = opcaoSelecionada === "grupo-2" ? 1 : opcaoSelecionada === "grupo-3" ? 2 : 0;
    const g = gruposDisponiveis[gIndex] || GRUPOS_PADRAO[gIndex];
    return { nome: g.nome, dezenas: g.dezenas };
  };

  const { nome: nomeAtual, dezenas: dezenasAtuais } = obterDezenasDaOpcao();

  const handleToggleDezenaCustom = (num: number) => {
    setMinhasDezenas((prev) => {
      if (prev.includes(num)) {
        return prev.filter((d) => d !== num);
      }
      if (prev.length >= 15) {
        setMensagem("Você já selecionou o limite de 15 dezenas.");
        setTimeout(() => setMensagem(null), 3000);
        return prev;
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const handlePreencherAleatorio = () => {
    const todos = Array.from({ length: 25 }, (_, i) => i + 1);
    const embaralhado = todos.sort(() => Math.random() - 0.5);
    setMinhasDezenas(embaralhado.slice(0, 15).sort((a, b) => a - b));
  };

  // Registrar e Cruzar com o Resultado da Caixa
  const handleRegistrarECruzar = async () => {
    const dezenasParaApostar = dezenasAtuais;
    if (dezenasParaApostar.length !== 15) {
      setMensagem("Selecione exatamente 15 dezenas para registrar a aposta.");
      setTimeout(() => setMensagem(null), 4000);
      return;
    }

    setProcessandoCruzamento(true);
    setMensagem("Registrando bilhete e cruzando com o resultado oficial da Caixa...");

    try {
      let concOficial = ultimoConcurso;
      if (!concOficial) {
        const res = await fetch("/api/lotofacil");
        const json = await res.json();
        if (json.sucesso && json.concurso) {
          concOficial = json.concurso;
        }
      }

      const custo = teimosinhaQtd * VALOR_APOSTA_15;
      const concInicialJogo = concOficial ? concOficial.numero : proximoConcurso;
      const novoJogo: JogoRegistrado = {
        id: `jogo_${Date.now()}_${opcaoSelecionada}`,
        grupoId: opcaoSelecionada,
        grupoNome: nomeAtual,
        dezenas: dezenasParaApostar,
        concursoInicial: concInicialJogo,
        teimosinhaConcursos: teimosinhaQtd,
        concursoFinal: concInicialJogo + teimosinhaQtd - 1,
        dataAposta: new Date().toLocaleDateString("pt-BR"),
        custoTotal: custo,
        status: "ativo",
        apuracoes: {},
        totalGanho: 0,
      };

      if (concOficial) {
        const sortSet = new Set(concOficial.dezenas);
        const acertadas = dezenasParaApostar.filter((d) => sortSet.has(d));
        const acertos = acertadas.length;

        let valorGanho = 0;
        let faixaPremio = "Não premiado";

        if (acertos === 15) {
          const f = concOficial.listaRateioPremio?.find((r) => r.faixa === 1);
          valorGanho = f?.valorPremio || 2000000.0;
          faixaPremio = "15 ACERTOS (PRÊMIO MÁXIMO!)";
        } else if (acertos === 14) {
          const f = concOficial.listaRateioPremio?.find((r) => r.faixa === 2);
          valorGanho = f?.valorPremio || 1500.0;
          faixaPremio = "14 Acertos";
        } else if (acertos === 13) {
          valorGanho = PREMIOS_FIXOS[13];
          faixaPremio = "13 Acertos";
        } else if (acertos === 12) {
          valorGanho = PREMIOS_FIXOS[12];
          faixaPremio = "12 Acertos";
        } else if (acertos === 11) {
          valorGanho = PREMIOS_FIXOS[11];
          faixaPremio = "11 Acertos";
        }

        novoJogo.apuracoes[concOficial.numero] = {
          concurso: concOficial.numero,
          data: concOficial.dataApuracao,
          dezenasSorteadas: concOficial.dezenas,
          acertos,
          dezenasAcertadas: acertadas,
          faixaPremio,
          valorGanho,
          apuradoEm: new Date().toLocaleTimeString("pt-BR"),
        };

        novoJogo.totalGanho = valorGanho;

        setCruzamentoRecente({
          jogoId: novoJogo.id,
          grupoNome: novoJogo.grupoNome,
          concurso: concOficial.numero,
          dataApuracao: concOficial.dataApuracao,
          acertos,
          dezenasSorteadas: concOficial.dezenas,
          dezenasAcertadas: acertadas,
          faixaPremio,
          valorGanho,
        });
      }

      saveJogoRegistrado(novoJogo);
      onAtualizarJogos();
      setMensagem("Jogo registrado e conferido com sucesso com a Caixa!");
    } catch (err: any) {
      setMensagem(`Erro ao conferir: ${err?.message || "Tente novamente"}`);
    } finally {
      setProcessandoCruzamento(false);
      setTimeout(() => setMensagem(null), 5000);
    }
  };

  // Aferição manual de um jogo já existente
  const handleAferirJogo = async (jogo: JogoRegistrado) => {
    setAferindoId(jogo.id);
    setMensagem(`Consultando resultados da Caixa para o ${jogo.grupoNome}...`);

    try {
      const resLatest = await fetch("/api/lotofacil");
      const dataLatest = await resLatest.json();
      if (!dataLatest.sucesso || !dataLatest.concurso) {
        throw new Error("Não foi possível obter dados oficiais da Caixa.");
      }

      const ultimoOficial = dataLatest.concurso as ConcursoLotofacil;
      const concFinalParaChecar = Math.min(jogo.concursoFinal, ultimoOficial.numero);
      const jogoAtualizado = { ...jogo, apuracoes: { ...jogo.apuracoes } };

      for (let c = jogo.concursoInicial; c <= concFinalParaChecar; c++) {
        let concData: ConcursoLotofacil | null = null;
        if (c === ultimoOficial.numero) {
          concData = ultimoOficial;
        } else {
          const resC = await fetch(`/api/lotofacil/${c}`);
          if (resC.ok) {
            const jsonC = await resC.json();
            if (jsonC.sucesso) concData = jsonC.concurso;
          }
        }

        if (concData) {
          const dezenasSorteadas = concData.dezenas;
          const sortSet = new Set(dezenasSorteadas);
          const acertadas = jogo.dezenas.filter((d) => sortSet.has(d));
          const acertos = acertadas.length;

          let valorGanho = 0;
          let faixaPremio = "Não premiado";

          if (acertos >= 11) {
            if (acertos === 15) {
              const f = concData.listaRateioPremio?.find((r) => r.faixa === 1);
              valorGanho = f?.valorPremio || 2000000.0;
              faixaPremio = "15 ACERTOS (PRÊMIO MÁXIMO!)";
            } else if (acertos === 14) {
              const f = concData.listaRateioPremio?.find((r) => r.faixa === 2);
              valorGanho = f?.valorPremio || 1500.0;
              faixaPremio = "14 Acertos";
            } else if (acertos === 13) {
              valorGanho = PREMIOS_FIXOS[13];
              faixaPremio = "13 Acertos";
            } else if (acertos === 12) {
              valorGanho = PREMIOS_FIXOS[12];
              faixaPremio = "12 Acertos";
            } else if (acertos === 11) {
              valorGanho = PREMIOS_FIXOS[11];
              faixaPremio = "11 Acertos";
            }
          }

          jogoAtualizado.apuracoes[c] = {
            concurso: c,
            data: concData.dataApuracao,
            dezenasSorteadas,
            acertos,
            dezenasAcertadas: acertadas,
            faixaPremio,
            valorGanho,
            apuradoEm: new Date().toLocaleTimeString("pt-BR"),
          };
        }
      }

      jogoAtualizado.totalGanho = Object.values(jogoAtualizado.apuracoes).reduce(
        (acc, cur) => acc + cur.valorGanho,
        0
      );

      saveJogoRegistrado(jogoAtualizado);
      onAtualizarJogos();
      setMensagem(`Aferição concluída! Total apurado: R$ ${jogoAtualizado.totalGanho.toFixed(2)}`);
    } catch (err: any) {
      setMensagem(`Erro na aferição: ${err?.message || "Tente novamente mais tarde"}`);
    } finally {
      setAferindoId(null);
      setTimeout(() => setMensagem(null), 5000);
    }
  };

  const handleExcluirJogo = (id: string) => {
    deleteJogoRegistrado(id);
    if (cruzamentoRecente?.jogoId === id) {
      setCruzamentoRecente(null);
    }
    onAtualizarJogos();
    setMensagem("Jogo removido do monitoramento.");
    setTimeout(() => setMensagem(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO DE REGISTRO & CRUZAMENTO INSTANTÂNEO COM A CAIXA */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[#121827] via-[#141b2e] to-[#121827] border border-purple-500/40 shadow-xl shadow-purple-950/20 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                Aferição em Tempo Real
              </span>
              <span className="text-xs text-purple-300 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Cruzamento Imediato de Acertos
              </span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Escolha uma Opção de Grupo ou Digite Suas Dezenas para Conferência
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Escolha um dos Grupos de Elite da IA ou marque suas 15 dezenas e cruze instantaneamente com o resultado oficial da Caixa.
            </p>
          </div>

          {ultimoConcurso && (
            <div className="flex items-center gap-2 text-xs bg-purple-950/50 border border-purple-500/30 px-3.5 py-2 rounded-xl text-purple-200">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Último Concurso: <strong>C.{ultimoConcurso.numero}</strong> ({ultimoConcurso.dataApuracao})
              </span>
            </div>
          )}
        </div>

        {/* Escolha da Fonte do Jogo */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 block">
            1. Selecione o Grupo ou Marque Suas Dezenas:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {gruposDisponiveis.map((g, idx) => {
              const isSelected = opcaoSelecionada === `grupo-${idx + 1}`;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setOpcaoSelecionada(`grupo-${idx + 1}`)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-600/20"
                      : "bg-gray-900/80 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Opção #{idx + 1}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <div className="text-[11px] text-purple-300 truncate mt-0.5">{g.nome.split("—")[0]}</div>
                  <div className="text-[10px] text-gray-500 mt-1 font-mono">15 dezenas (IA)</div>
                </button>
              );
            })}

            {/* Opção Manual: Minhas Dezenas */}
            <button
              type="button"
              onClick={() => setOpcaoSelecionada("custom")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                opcaoSelecionada === "custom"
                  ? "bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-600/20"
                  : "bg-gray-900/80 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Minhas Dezenas</span>
                {opcaoSelecionada === "custom" && <Check className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <div className="text-[11px] text-emerald-400 truncate mt-0.5">Personalizado</div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">
                {minhasDezenas.length}/15 marcadas
              </div>
            </button>
          </div>
        </div>

        {/* Volante de Exibição / Marcação */}
        <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-300">
              {opcaoSelecionada === "custom"
                ? "Clique no volante abaixo para marcar suas 15 dezenas:"
                : `15 Dezenas Selecionadas (${nomeAtual}):`}
            </span>
            {opcaoSelecionada === "custom" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreencherAleatorio}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                >
                  Completar Aleatório
                </button>
                <button
                  type="button"
                  onClick={() => setMinhasDezenas([])}
                  className="text-[11px] text-gray-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-center py-1">
            <VolanteGrid
              selectedNumbers={dezenasAtuais}
              interactive={opcaoSelecionada === "custom"}
              onToggleNumber={handleToggleDezenaCustom}
              compact={false}
            />
          </div>

          {opcaoSelecionada === "custom" && (
            <div className="text-center text-xs">
              <span className={minhasDezenas.length === 15 ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {minhasDezenas.length === 15
                  ? "✓ 15 dezenas marcadas perfeitamente!"
                  : `Selecione mais ${15 - minhasDezenas.length} dezena(s) para completar seu volante.`}
              </span>
            </div>
          )}
        </div>

        {/* Controles de Teimosinha & Botão de Cruzamento */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Ciclo da Aposta:</span>
            <select
              value={teimosinhaQtd}
              onChange={(e) => setTeimosinhaQtd(parseInt(e.target.value, 10))}
              className="bg-black/60 text-purple-300 font-bold border border-purple-500/40 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-xs"
            >
              <option value={1}>1 Concurso (R$ 3,50)</option>
              <option value={3}>3 Concursos (R$ 10,50)</option>
              <option value={6}>6 Concursos (R$ 21,00)</option>
              <option value={12}>12 Concursos (R$ 42,00)</option>
              <option value={18}>18 Concursos (R$ 63,00)</option>
              <option value={24}>24 Concursos (R$ 84,00)</option>
            </select>
            <span className="text-gray-500 font-mono">
              Total: {(teimosinhaQtd * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <button
            type="button"
            disabled={processandoCruzamento || dezenasAtuais.length !== 15}
            onClick={handleRegistrarECruzar}
            className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-98"
          >
            <Zap className={`w-4 h-4 fill-current ${processandoCruzamento ? "animate-spin" : ""}`} />
            <span>{processandoCruzamento ? "Conferindo..." : "Registrar e Cruzar com o Resultado da Caixa"}</span>
          </button>
        </div>
      </div>

      {/* 2. PAINEL DE RESULTADO DO CRUZAMENTO INSTANTÂNEO */}
      {cruzamentoRecente && (
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#121827] to-purple-950/30 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-950/30 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-black uppercase tracking-wider">
                  Resultado da Conferência Oficial
                </span>
                <span className="text-xs text-gray-400">
                  Concurso Oficial {cruzamentoRecente.concurso} ({cruzamentoRecente.dataApuracao})
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {cruzamentoRecente.grupoNome}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-400 block">Acertos Registrados:</span>
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">
                {cruzamentoRecente.acertos} ACERTOS
              </div>
            </div>
          </div>

          {/* Destaque do Prêmio e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
              <span className="text-xs text-gray-400 block">Faixa de Premiação:</span>
              <strong className="text-sm text-white mt-0.5 block">
                {cruzamentoRecente.faixaPremio}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
              <span className="text-xs text-gray-400 block">Valor Ganho na Caixa:</span>
              <strong className="text-base text-emerald-400 font-mono font-bold mt-0.5 block">
                {cruzamentoRecente.valorGanho.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block">Status:</span>
                <strong className={`text-xs mt-0.5 block ${cruzamentoRecente.acertos >= 11 ? "text-emerald-400" : "text-gray-400"}`}>
                  {cruzamentoRecente.acertos >= 11 ? "BILHETE PREMIADO!" : "Sem premiação neste concurso"}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => handleExcluirJogo(cruzamentoRecente.jogoId)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                title="Desfazer e cancelar este jogo"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Desfazer Jogo
              </button>
            </div>
          </div>

          {/* Volante Visual de Dezenas Acertadas */}
          <div className="space-y-2 pt-2">
            <span className="text-xs text-gray-400 font-medium block">
              Dezenas Sorteadas vs. Acertadas (acertos em verde esmeralda):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cruzamentoRecente.dezenasSorteadas.map((num) => {
                const acertou = cruzamentoRecente.dezenasAcertadas.includes(num);
                return (
                  <span
                    key={num}
                    className={`w-9 h-9 rounded-xl text-xs font-mono flex items-center justify-center font-bold ${
                      acertou
                        ? "bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-600/40 scale-105"
                        : "bg-gray-800/60 text-gray-500 border border-gray-700/50"
                    }`}
                  >
                    {num.toString().padStart(2, "0")}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mensagem && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{mensagem}</span>
        </div>
      )}

      {/* 3. HISTÓRICO DE JOGOS REGISTRADOS & AFERIÇÕES ANTERIORES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-400" />
            Histórico de Jogos Registrados ({jogos.length})
          </h3>
          <span className="text-xs text-gray-400">
            Acompanhe o saldo consolidado e as apurações de cada aposta
          </span>
        </div>

        {jogos.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#121827] border border-dashed border-gray-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-600 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-300">Nenhum jogo salvo no histórico</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Utilize o painel acima para registrar um grupo da IA ou suas dezenas e conferir na hora com a Caixa.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {jogos.map((jogo) => {
              const apuracoesArray = Object.values(jogo.apuracoes).sort(
                (a, b) => b.concurso - a.concurso
              );
              const saldoJogo = jogo.totalGanho - jogo.custoTotal;
              const isAferindo = aferindoId === jogo.id;

              return (
                <div
                  key={jogo.id}
                  className="p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-5"
                >
                  {/* Topo do Card do Jogo */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600/30 text-purple-300 border border-purple-500/30 uppercase">
                          Teimosinha ({jogo.teimosinhaConcursos}x)
                        </span>
                        <span className="text-xs text-gray-400">
                          Aposta feita em: {jogo.dataAposta}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{jogo.grupoNome}</h3>
                      <p className="text-xs text-gray-400">
                        Vigência: <strong>Concurso {jogo.concursoInicial}</strong> até{" "}
                        <strong>Concurso {jogo.concursoFinal}</strong>
                      </p>
                    </div>

                    {/* Actions & Balance */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-gray-400 block">Total Ganho:</span>
                        <span className="text-lg font-bold text-emerald-400 font-mono">
                          {jogo.totalGanho.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <span
                          className={`text-[10px] block font-mono ${
                            saldoJogo >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {saldoJogo >= 0 ? "+" : ""}
                          {saldoJogo.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}{" "}
                          (Líquido)
                        </span>
                      </div>

                      <button
                        onClick={() => handleAferirJogo(jogo)}
                        disabled={isAferindo}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAferindo ? "animate-spin" : ""}`} />
                        {isAferindo ? "Aferindo Caixa..." : "Aferir com a Caixa"}
                      </button>

                      <button
                        onClick={() => handleExcluirJogo(jogo.id)}
                        className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                        title="Excluir este jogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dezenas Apostadas */}
                  <div className="space-y-2">
                    <span className="text-xs text-gray-400 font-medium block">
                      15 Dezenas Apostadas neste Bilhete:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {jogo.dezenas.map((d) => (
                        <span
                          key={d}
                          className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center font-mono"
                        >
                          {d.toString().padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Concursos Apurados */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        Resultados Apurados Oficialmente ({apuracoesArray.length} concursos checados)
                      </span>
                    </div>

                    {apuracoesArray.length === 0 ? (
                      <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 text-xs text-gray-500 text-center">
                        Clique no botão <strong>"Aferir com a Caixa"</strong> acima para sincronizar com os concursos mais recentes.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                        {apuracoesArray.map((ap) => {
                          const isPremiado = ap.acertos >= 11;
                          return (
                            <div
                              key={ap.concurso}
                              className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                                isPremiado
                                  ? "bg-emerald-950/25 border-emerald-500/40"
                                  : "bg-gray-900/60 border-gray-800"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-white text-xs">
                                    Concurso {ap.concurso}
                                  </span>
                                  <span className="text-[11px] text-gray-400 ml-2">
                                    {ap.data}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPremiado
                                      ? "bg-emerald-500 text-black font-extrabold"
                                      : "bg-gray-800 text-gray-400"
                                  }`}
                                >
                                  {ap.acertos} ACERTOS
                                </span>
                              </div>

                              {/* Dezenas acertadas / sorteadas */}
                              <div className="flex flex-wrap gap-1">
                                {ap.dezenasSorteadas.map((num) => {
                                  const acertou = ap.dezenasAcertadas.includes(num);
                                  return (
                                    <span
                                      key={num}
                                      className={`w-6 h-6 rounded text-[10px] font-mono flex items-center justify-center font-bold ${
                                        acertou
                                          ? "bg-emerald-600 text-white border border-emerald-400"
                                          : "bg-gray-800/60 text-gray-500"
                                      }`}
                                    >
                                      {num.toString().padStart(2, "0")}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Footer do Concurso */}
                              <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-xs">
                                <span
                                  className={
                                    isPremiado
                                      ? "text-emerald-400 font-bold font-mono"
                                      : "text-gray-500"
                                  }
                                >
                                  {isPremiado
                                    ? `Prêmio: ${ap.valorGanho.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })} (${ap.faixaPremio})`
                                    : "Não premiado"}
                                </span>

                                <button
                                  onClick={() =>
                                    onVisualizarGanhadoresConcurso({
                                      numero: ap.concurso,
                                      dataApuracao: ap.data,
                                      dezenas: ap.dezenasSorteadas,
                                    })
                                  }
                                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> Ganhadores
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
