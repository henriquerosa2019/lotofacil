"use client";

import React, { useState, useEffect } from "react";
import { JogoRegistrado, ConcursoLotofacil, GrupoDezenas } from "@/lib/types";
import { PREMIOS_FIXOS, GRUPOS_PADRAO, VALOR_APOSTA_15, apurarJogoComConcurso } from "@/lib/lotofacil-engine";
import { saveJogoRegistrado, deleteJogoRegistrado, undoUltimoJogo } from "@/lib/storage";
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
  RotateCcw,
  Check,
  Clock,
  ArrowRight,
  Plus,
  Minus,
  Search,
  Wallet,
  X,
  Zap,
} from "lucide-react";

interface AbaAfericaoProps {
  jogos: JogoRegistrado[];
  onAtualizarJogos: () => void;
  onVisualizarGanhadoresConcurso: (c: ConcursoLotofacil | number) => void;
  onIrParaGerador: () => void;
  ultimoConcurso: ConcursoLotofacil | null;
  gruposDisponiveis?: GrupoDezenas[];
  onVerResultado?: (concursoNum?: number) => void;
  saldoDisponivelSaque?: number;
  onIrParaFinanceiro?: () => void;
}

interface CruzamentoVisual {
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
  onVerResultado,
  saldoDisponivelSaque = 0,
  onIrParaFinanceiro,
}: AbaAfericaoProps) {
  const [aferindoId, setAferindoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "info" | "erro"; texto: string } | null>(null);
  const [ultimoJogoSalvoId, setUltimoJogoSalvoId] = useState<string | null>(null);
  const [concursoParaAferir, setConcursoParaAferir] = useState<string>("");

  const handleExecutarAfericao = (numOpcional?: number) => {
    const alvo = numOpcional || (concursoParaAferir.trim() ? parseInt(concursoParaAferir.trim(), 10) : undefined);
    if (alvo && !isNaN(alvo) && alvo > 0) {
      if (onVerResultado) {
        onVerResultado(alvo);
      } else {
        onVisualizarGanhadoresConcurso(alvo);
      }
    } else {
      if (onVerResultado) {
        onVerResultado();
      } else if (ultimoConcurso) {
        onVisualizarGanhadoresConcurso(ultimoConcurso.numero);
      }
    }
  };

  // Painel de cruzamento visual ativo (quando confere com a Caixa)
  const [cruzamentoAtivo, setCruzamentoAtivo] = useState<CruzamentoVisual | null>(null);

  // Estados para Escolha do Jogo
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>("grupo-1");
  const [minhasDezenas, setMinhasDezenas] = useState<number[]>([]);
  const [teimosinhaQtd, setTeimosinhaQtd] = useState<number>(1);

  // Concurso sugerido pela IA (último concurso oficial + 1)
  const concursoUltimoNumero = ultimoConcurso?.numero || 3826;
  const concursoSugerido = concursoUltimoNumero + 1;
  const [concursoJogo, setConcursoJogo] = useState<number>(concursoSugerido);

  // Atualiza concurso sugerido se o último concurso carregar
  useEffect(() => {
    if (ultimoConcurso?.numero) {
      setConcursoJogo(ultimoConcurso.numero + 1);
    }
  }, [ultimoConcurso?.numero]);

  const concursoFinalCalculado = concursoJogo + teimosinhaQtd - 1;

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
        setMensagem({ tipo: "erro", texto: "Você já selecionou o limite de 15 dezenas." });
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

  // 1. SALVAR E REGISTRAR O JOGO
  const handleSalvarERegistrarJogo = () => {
    const dezenasParaApostar = dezenasAtuais;
    if (dezenasParaApostar.length !== 15) {
      setMensagem({ tipo: "erro", texto: "Selecione exatamente 15 dezenas para registrar a aposta." });
      setTimeout(() => setMensagem(null), 4000);
      return;
    }

    if (!concursoJogo || concursoJogo <= 0) {
      setMensagem({ tipo: "erro", texto: "Informe um número de concurso válido." });
      setTimeout(() => setMensagem(null), 4000);
      return;
    }

    const custo = teimosinhaQtd * VALOR_APOSTA_15;
    const novoJogo: JogoRegistrado = {
      id: `jogo_${Date.now()}_${opcaoSelecionada}`,
      grupoId: opcaoSelecionada,
      grupoNome: nomeAtual,
      dezenas: dezenasParaApostar,
      concursoInicial: concursoJogo,
      teimosinhaConcursos: teimosinhaQtd,
      concursoFinal: concursoFinalCalculado,
      dataAposta: new Date().toLocaleDateString("pt-BR"),
      custoTotal: custo,
      status: "ativo",
      apuracoes: {},
      totalGanho: 0,
    };

    saveJogoRegistrado(novoJogo);
    setUltimoJogoSalvoId(novoJogo.id);
    onAtualizarJogos();

    const vigenciaTexto =
      teimosinhaQtd > 1
        ? `Concursos ${novoJogo.concursoInicial} até ${novoJogo.concursoFinal} (${teimosinhaQtd} sorteios)`
        : `Concurso ${novoJogo.concursoInicial}`;

    setMensagem({
      tipo: "sucesso",
      texto: `Jogo "${nomeAtual}" salvo e registrado com sucesso para o ${vigenciaTexto}! Clique em "Ver Resultado" quando a Caixa apurar este concurso para conferir seus acertos.`,
    });
  };

  // Desfazer o último jogo registrado
  const handleDesfazerJogo = (idParaRemover?: string) => {
    const id = idParaRemover || ultimoJogoSalvoId;
    if (id) {
      deleteJogoRegistrado(id);
    } else {
      undoUltimoJogo();
    }
    if (cruzamentoAtivo?.jogoId === id) {
      setCruzamentoAtivo(null);
    }
    onAtualizarJogos();
    setUltimoJogoSalvoId(null);
    setMensagem({ tipo: "info", texto: "Jogo desfeito e removido do monitoramento com sucesso!" });
    setTimeout(() => setMensagem(null), 4000);
  };

  // 2. CONFERIR JOGO ESPECÍFICO COM A CAIXA E CRUZAR O RESULTADO IMEDIATAMENTE
  const handleAferirJogoIndividual = async (jogo: JogoRegistrado) => {
    setAferindoId(jogo.id);
    setMensagem({ tipo: "info", texto: `Consultando Caixa para conferir e cruzar o resultado de "${jogo.grupoNome}"...` });

    try {
      const resLatest = await fetch("/api/lotofacil");
      const dataLatest = await resLatest.json();
      if (!dataLatest.sucesso || !dataLatest.concurso) {
        throw new Error("Não foi possível conectar à API da Caixa Econômica Federal.");
      }

      const ultimoOficial = dataLatest.concurso as ConcursoLotofacil;

      // Se o último concurso sorteado na Caixa ainda for anterior ao concurso do jogo
      if (ultimoOficial.numero < jogo.concursoInicial) {
        setCruzamentoAtivo(null);
        setMensagem({
          tipo: "info",
          texto: `O último concurso apurado pela Caixa é o C.${ultimoOficial.numero}. O seu jogo pertence ao C.${jogo.concursoInicial} e será conferido assim que a Caixa realizar a apuração deste concurso!`,
        });
        return;
      }

      let jogoAtualizado = { ...jogo };
      let houveAlgumaApuracao = false;
      const concFinalParaChecar = Math.min(jogo.concursoFinal, ultimoOficial.numero);

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
          const resApuracao = apurarJogoComConcurso(jogoAtualizado, concData);
          jogoAtualizado = resApuracao.jogoAtualizado;
          houveAlgumaApuracao = true;
        }
      }

      saveJogoRegistrado(jogoAtualizado);
      onAtualizarJogos();

      // Ativa o cruzamento visual com os dados mais recentes apurados
      const apuracoes = Object.values(jogoAtualizado.apuracoes).sort((a, b) => b.concurso - a.concurso);
      if (apuracoes.length > 0) {
        const apMaisRecente = apuracoes[0];
        setCruzamentoAtivo({
          jogoId: jogoAtualizado.id,
          grupoNome: jogoAtualizado.grupoNome,
          concurso: apMaisRecente.concurso,
          dataApuracao: apMaisRecente.data,
          acertos: apMaisRecente.acertos,
          dezenasSorteadas: apMaisRecente.dezenasSorteadas,
          dezenasAcertadas: apMaisRecente.dezenasAcertadas,
          faixaPremio: apMaisRecente.faixaPremio || "Não premiado",
          valorGanho: apMaisRecente.valorGanho,
        });
      }

      if (houveAlgumaApuracao) {
        setMensagem({
          tipo: "sucesso",
          texto: `Resultado cruzado com sucesso! ${jogoAtualizado.grupoNome} obteve ${apuracoes[0]?.acertos || 0} acertos no Concurso ${apuracoes[0]?.concurso || ""}. Saldo acumulado atualizado!`,
        });
      }
    } catch (err: any) {
      setMensagem({ tipo: "erro", texto: `Erro na conferência: ${err?.message || "Tente novamente mais tarde"}` });
    } finally {
      setAferindoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO DE REGISTRO DE JOGO & VINCULAÇÃO AO CONCURSO */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[#121827] via-[#141b2e] to-[#121827] border border-purple-500/40 shadow-xl shadow-purple-950/20 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
                Registro de Jogos
              </span>
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Vinculação por Concurso Oficial
              </span>
              <div
                onClick={onIrParaFinanceiro}
                className="ml-auto sm:ml-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold cursor-pointer hover:bg-emerald-500/30 transition-all"
                title="Saldo acumulado de prêmios disponível em conta até o saque"
              >
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span>Saldo em Conta: {saldoDisponivelSaque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            </div>
            <h2 className="text-base md:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Escolha uma Opção de Grupo e Registre seu Jogo
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              O bilhete é registrado com o número do concurso que você vai disputar. A conferência é feita quando você clica em <strong>Ver Resultado</strong> ou em <strong>Conferir com a Caixa</strong>.
            </p>
          </div>

          {/* Botão em Destaque para Ver Resultado em Tempo Real */}
          {onVerResultado && (
            <button
              type="button"
              onClick={() => handleExecutarAfericao()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer group active:scale-95 shrink-0"
              title="Busca o resultado oficial da Caixa em tempo real e confere os jogos do concurso correspondente"
            >
              <Search className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>
                Ver Resultado Caixa
                {ultimoConcurso ? ` (C.${ultimoConcurso.numero})` : ""}
              </span>
            </button>
          )}
        </div>

        {/* Escolha da Fonte do Jogo */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 block">
            1. Selecione o Grupo da IA ou Marque Suas Dezenas:
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

        {/* 2. DEFINIÇÃO DO CONCURSO DO JOGO & TEIMOSINHA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          {/* Seletor do Número do Concurso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Número do Concurso da Aposta:
              </label>
              <span className="text-[11px] text-gray-400">
                Último apurado: <strong className="text-purple-300">C.{concursoUltimoNumero}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConcursoJogo((prev) => Math.max(1, prev - 1))}
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center cursor-pointer"
                title="Concurso anterior"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                value={concursoJogo}
                onChange={(e) => setConcursoJogo(parseInt(e.target.value, 10) || concursoSugerido)}
                className="flex-1 text-center bg-black/60 border border-purple-500/50 rounded-lg py-2 px-3 text-purple-200 font-bold font-mono text-base outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={() => setConcursoJogo((prev) => prev + 1)}
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center cursor-pointer"
                title="Próximo concurso"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setConcursoJogo(concursoSugerido)}
                className="px-2.5 py-2 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                title="Resetar para o próximo concurso oficial sugerido"
              >
                Sugerido ({concursoSugerido})
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              A IA analisa o último concurso (<strong>C.{concursoUltimoNumero}</strong>) e sugere o <strong>C.{concursoSugerido}</strong>, ou você pode alterar livremente.
            </p>
          </div>

          {/* Ciclo da Teimosinha */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-gray-300">
                Ciclo da Teimosinha (Repetição):
              </label>
              <span className="text-emerald-400 font-mono font-bold text-xs">
                {(teimosinhaQtd * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <select
              value={teimosinhaQtd}
              onChange={(e) => setTeimosinhaQtd(parseInt(e.target.value, 10))}
              className="w-full bg-black/60 text-purple-300 font-bold border border-purple-500/40 rounded-lg px-3 py-2 outline-none cursor-pointer text-xs"
            >
              <option value={1}>1 Concurso — R$ 3,50</option>
              <option value={3}>3 Concursos — R$ 10,50</option>
              <option value={6}>6 Concursos (1 semana) — R$ 21,00</option>
              <option value={12}>12 Concursos (2 semanas) — R$ 42,00</option>
              <option value={18}>18 Concursos (3 semanas) — R$ 63,00</option>
              <option value={24}>24 Concursos (1 mês) — R$ 84,00</option>
            </select>

            <p className="text-[11px] text-gray-400">
              Vigência da Aposta:{" "}
              <strong className="text-white">
                {teimosinhaQtd > 1
                  ? `Concurso ${concursoJogo} até Concurso ${concursoFinalCalculado}`
                  : `Concurso ${concursoJogo}`}
              </strong>
            </p>
          </div>
        </div>

        {/* Botão de Registro do Jogo */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            Aposta simples: <strong className="text-white">R$ 3,50 por concurso</strong> • Total:{" "}
            <strong className="text-emerald-400 font-mono">
              {(teimosinhaQtd * VALOR_APOSTA_15).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>
          </div>

          <button
            type="button"
            disabled={dezenasAtuais.length !== 15}
            onClick={handleSalvarERegistrarJogo}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>Salvar e Registrar Jogo para o Concurso {concursoJogo}</span>
          </button>
        </div>
      </div>

      {/* PAINEL DE CRUZAMENTO VISUAL ATIVO (Ao clicar em Conferir com a Caixa) */}
      {cruzamentoAtivo && (
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-[#121827] to-purple-950/40 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-950/30 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-black uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Resultado da Conferência Oficial
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  Concurso {cruzamentoAtivo.concurso} ({cruzamentoAtivo.dataApuracao})
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {cruzamentoAtivo.grupoNome}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Acertos neste Sorteio:</span>
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">
                  {cruzamentoAtivo.acertos} ACERTOS
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCruzamentoAtivo(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
                title="Fechar resultado visual"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Destaque do Prêmio e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
              <span className="text-xs text-gray-400 block">Faixa de Premiação:</span>
              <strong className="text-sm text-white mt-0.5 block">
                {cruzamentoAtivo.faixaPremio}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
              <span className="text-xs text-gray-400 block">Valor Ganho na Caixa:</span>
              <strong className="text-base text-emerald-400 font-mono font-bold mt-0.5 block">
                {cruzamentoAtivo.valorGanho.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block">Status:</span>
                <strong className={`text-xs mt-0.5 block ${cruzamentoAtivo.acertos >= 11 ? "text-emerald-400 font-bold" : "text-gray-400"}`}>
                  {cruzamentoAtivo.acertos >= 11 ? "BILHETE PREMIADO! 🏆" : "Sem premiação neste concurso"}
                </strong>
                {cruzamentoAtivo.valorGanho > 0 && (
                  <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">
                    ✓ Valor somado ao Saldo em Conta
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Volante Visual de Dezenas Sorteadas vs Acertadas */}
          <div className="space-y-2 pt-1">
            <span className="text-xs text-gray-400 font-medium block">
              Dezenas Sorteadas da Caixa vs. Acertos do Seu Jogo (acertos em verde esmeralda):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cruzamentoAtivo.dezenasSorteadas.map((num) => {
                const acertou = cruzamentoAtivo.dezenasAcertadas.includes(num);
                return (
                  <span
                    key={num}
                    className={`w-9 h-9 rounded-xl text-xs font-mono flex items-center justify-center font-bold ${
                      acertou
                        ? "bg-emerald-600 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-600/50 scale-105"
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

      {/* Notificação de Feedback */}
      {mensagem && (
        <div
          className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
            mensagem.tipo === "sucesso"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
              : mensagem.tipo === "erro"
              ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
              : "bg-purple-950/40 border-purple-500/40 text-purple-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{mensagem.texto}</span>
          </div>

          {ultimoJogoSalvoId && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleDesfazerJogo(ultimoJogoSalvoId)}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 text-rose-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Desfazer Jogo
              </button>
            </div>
          )}
        </div>
      )}

      {/* PAINEL DE AFERIÇÃO OFICIAL POR NÚMERO DE CONCURSO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gray-900 via-[#141a2c] to-gray-900 border border-purple-500/30 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Aferição Oficial Caixa por Número de Concurso
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            Forneça o concurso desejado ou clique em um atalho recente
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="number"
              placeholder={ultimoConcurso ? `Digite o concurso (ex: 3820, 3822, 3823, ${ultimoConcurso.numero})...` : "Digite o concurso..."}
              value={concursoParaAferir}
              onChange={(e) => setConcursoParaAferir(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleExecutarAfericao();
                }
              }}
              className="w-full bg-black/60 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-purple-200 font-mono font-bold outline-none focus:border-purple-400 placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleExecutarAfericao()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer active:scale-95 flex-1 sm:flex-initial"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{concursoParaAferir.trim() ? `Aferir C.${concursoParaAferir.trim()}` : "Aferir Último Concurso"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setConcursoParaAferir("");
                handleExecutarAfericao();
              }}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="Aferir o último concurso apurado pela Caixa Econômica Federal"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Último ({ultimoConcurso?.numero || 3826})</span>
            </button>
          </div>
        </div>

        {/* Atalhos Rápidos para Concursos Recentes */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-gray-400 font-medium mr-1">Atalhos rápidos:</span>
          {[3826, 3825, 3824, 3823, 3822, 3821, 3820].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setConcursoParaAferir(num.toString());
                handleExecutarAfericao(num);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-purple-950/80 border border-gray-800 hover:border-purple-500/50 text-gray-300 hover:text-white font-mono text-[11px] font-semibold transition-all cursor-pointer"
              title={`Clique para aferir imediatamente o Concurso ${num}`}
            >
              C.{num}
            </button>
          ))}
        </div>
      </div>

      {/* 2. HISTÓRICO DE JOGOS REGISTRADOS & CONFERÊNCIA POR CONCURSO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-400" />
            Meus Jogos Registrados ({jogos.length})
          </h3>
          <span className="text-xs text-gray-400">
            Acompanhe o status e a conferência de cada aposta
          </span>
        </div>

        {jogos.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#121827] border border-dashed border-gray-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-600 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-300">Nenhum jogo registrado ainda</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Selecione uma opção de grupo ou suas dezenas acima, defina o concurso e clique em <strong>Salvar e Registrar Jogo</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {jogos.map((jogo) => {
              const apuracoesArray = Object.values(jogo.apuracoes).sort(
                (a, b) => b.concurso - a.concurso
              );
              const saldoJogo = jogo.totalGanho - jogo.custoTotal;
              const isAferindo = aferindoId === jogo.id;

              // Verifica se o jogo está aguardando sorteio
              const ultimoNumeroOficial = ultimoConcurso?.numero || 3826;
              const aguardandoSorteio = ultimoNumeroOficial < jogo.concursoInicial;

              return (
                <div
                  key={jogo.id}
                  className="p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-4 hover:border-purple-500/40 transition-all shadow-lg"
                >
                  {/* Topo do Card do Jogo */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600/30 text-purple-300 border border-purple-500/30 uppercase">
                          {jogo.teimosinhaConcursos > 1
                            ? `Teimosinha (${jogo.teimosinhaConcursos}x)`
                            : "Aposta Única"}
                        </span>

                        {aguardandoSorteio ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Aguardando Sorteio da Caixa (C.{jogo.concursoInicial})
                          </span>
                        ) : apuracoesArray.length > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ Apurado (${apuracoesArray.length} sorteios)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Pronto para Conferência
                          </span>
                        )}

                        <span className="text-xs text-gray-400">
                          Registrado em: {jogo.dataAposta}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-1">{jogo.grupoNome}</h3>
                      <p className="text-xs text-gray-400">
                        Vigência: <strong>Concurso {jogo.concursoInicial}</strong>
                        {jogo.concursoFinal !== jogo.concursoInicial && (
                          <> até <strong>Concurso {jogo.concursoFinal}</strong></>
                        )}
                      </p>
                    </div>

                    {/* Actions & Balance */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-gray-400 block">Total Ganho:</span>
                        <span className="text-base font-bold text-emerald-400 font-mono">
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

                      {/* Botão de Conferência Individual com Cruzamento Imediato */}
                      <button
                        onClick={() => handleAferirJogoIndividual(jogo)}
                        disabled={isAferindo}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                        title="Cruza as dezenas deste jogo com o resultado oficial da Caixa e exibe acertos e prêmios na hora"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAferindo ? "animate-spin" : ""}`} />
                        {isAferindo ? "Conferindo..." : "Conferir com a Caixa"}
                      </button>

                      <button
                        onClick={() => handleDesfazerJogo(jogo.id)}
                        className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                        title="Excluir este jogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dezenas Apostadas */}
                  <div className="space-y-1.5">
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

                  {/* Apurações Oficiais Realizadas */}
                  {apuracoesArray.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-800/80">
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        Concursos Apurados ({apuracoesArray.length})
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                        {apuracoesArray.map((ap) => {
                          const isPremiado = ap.acertos >= 11;
                          return (
                            <div
                              key={ap.concurso}
                              className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
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
                                  type="button"
                                  onClick={() => onVisualizarGanhadoresConcurso(ap.concurso)}
                                  className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                                  title="Clique para ver todos os ganhadores, locais (cidades) e valores pagos deste concurso"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Ganhadores</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
