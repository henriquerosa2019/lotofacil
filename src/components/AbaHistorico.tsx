"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Trophy,
  Calendar,
  Filter,
  Eye,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ConcursoLotofacil, JogoRegistrado } from "@/lib/types";

interface AbaHistoricoProps {
  historico: ConcursoLotofacil[];
  ultimoConcurso: ConcursoLotofacil | null;
  jogos?: JogoRegistrado[];
  onVisualizarConcurso: (concurso: ConcursoLotofacil | number) => void;
  onIrParaAfericao?: () => void;
}

export default function AbaHistorico({
  historico,
  ultimoConcurso,
  jogos = [],
  onVisualizarConcurso,
  onIrParaAfericao,
}: AbaHistoricoProps) {
  // Aba de visualização: Concursos já apurados vs Próximos concursos da Teimosinha
  const [subTab, setSubTab] = useState<"apurados" | "proximos">("apurados");
  const [busca, setBusca] = useState<string>("");
  const [filtroPremiados, setFiltroPremiados] = useState<"todos" | "premiados" | "nao_premiados">("todos");

  // Identifica o menor concurso jogado (regra do usuário: início em 3820)
  const menorConcursoJogado = useMemo(() => {
    if (jogos.length === 0) return 3820;
    return Math.min(...jogos.map((j) => j.concursoInicial));
  }, [jogos]);

  const maiorConcursoJogado = useMemo(() => {
    if (jogos.length === 0) return 3843;
    return Math.max(...jogos.map((j) => j.concursoFinal));
  }, [jogos]);

  // Mapeamento dos concursos cobertos pelas teimosinhas/jogos do usuário
  const concursosDoUsuarioMap = useMemo(() => {
    const map = new Map<number, JogoRegistrado[]>();
    jogos.forEach((j) => {
      for (let c = j.concursoInicial; c <= j.concursoFinal; c++) {
        const list = map.get(c) || [];
        list.push(j);
        map.set(c, list);
      }
    });
    return map;
  }, [jogos]);

  // Último concurso apurado pela Caixa
  const ultimoNumeroApurado = ultimoConcurso?.numero || 3824;

  // 1. CONCURSOS DO USUÁRIO JÁ APURADOS PELA CAIXA (do menor concurso jogado >= 3820 até o último apurado)
  const concursosApuradosUsuario = useMemo(() => {
    // Lista unificada da base histórica + último concurso da Caixa
    const todos = [...historico];
    if (ultimoConcurso && !todos.some((c) => c.numero === ultimoConcurso.numero)) {
      todos.push(ultimoConcurso);
    }

    // REGRA RESTRITA: Mostra APENAS concursos a partir do início da teimosinha (>= 3820) que o usuário jogou
    const filtrados = todos.filter((c) => {
      if (c.numero < menorConcursoJogado) return false;
      return concursosDoUsuarioMap.has(c.numero);
    });

    // Ordena do mais recente para o mais antigo (3824, 3823, 3822, 3821, 3820)
    filtrados.sort((a, b) => b.numero - a.numero);

    return filtrados;
  }, [historico, ultimoConcurso, menorConcursoJogado, concursosDoUsuarioMap]);

  // 2. CONCURSOS FUTUROS DA TEIMOSINHA (já jogados pelo usuário, mas ainda aguardando sorteio da Caixa)
  const concursosFuturosUsuario = useMemo(() => {
    const listaFuturos: Array<{ numero: number; jogos: JogoRegistrado[] }> = [];
    for (let c = ultimoNumeroApurado + 1; c <= maiorConcursoJogado; c++) {
      if (concursosDoUsuarioMap.has(c)) {
        listaFuturos.push({
          numero: c,
          jogos: concursosDoUsuarioMap.get(c) || [],
        });
      }
    }
    return listaFuturos;
  }, [ultimoNumeroApurado, maiorConcursoJogado, concursosDoUsuarioMap]);

  // Filtro de busca e premiados nos apurados
  const concursosApuradosExibicao = useMemo(() => {
    let lista = [...concursosApuradosUsuario];

    const termo = busca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter(
        (c) =>
          c.numero.toString().includes(termo) ||
          (c.dataApuracao && c.dataApuracao.toLowerCase().includes(termo))
      );
    }

    if (filtroPremiados !== "todos") {
      lista = lista.filter((c) => {
        const jogosDeste = concursosDoUsuarioMap.get(c.numero) || [];
        const setSorteio = new Set(c.dezenas);
        const temPremiacao = jogosDeste.some((j) => {
          const acertos = j.dezenas.filter((d) => setSorteio.has(d)).length;
          return acertos >= 11;
        });
        return filtroPremiados === "premiados" ? temPremiacao : !temPremiacao;
      });
    }

    return lista;
  }, [concursosApuradosUsuario, busca, filtroPremiados, concursosDoUsuarioMap]);

  // Estatísticas consolidada dos concursos jogados na teimosinha
  const metricasTeimosinha = useMemo(() => {
    const totalApurados = concursosApuradosUsuario.length;
    let totalAcertosGeral = 0;
    let totalPremiacoes = 0;
    let totalValorGanho = 0;

    concursosApuradosUsuario.forEach((c) => {
      const jogosDeste = concursosDoUsuarioMap.get(c.numero) || [];
      const setSorteio = new Set(c.dezenas);

      jogosDeste.forEach((j) => {
        const acertos = j.dezenas.filter((d) => setSorteio.has(d)).length;
        if (acertos > totalAcertosGeral) totalAcertosGeral = acertos;
        if (acertos >= 11) {
          totalPremiacoes++;
          if (acertos === 11) totalValorGanho += 7;
          else if (acertos === 12) totalValorGanho += 14;
          else if (acertos === 13) totalValorGanho += 35;
          else if (acertos === 14) totalValorGanho += 1500;
          else if (acertos === 15) totalValorGanho += 2000000;
        }
      });
    });

    return {
      totalApurados,
      totalFuturos: concursosFuturosUsuario.length,
      inicioConcurso: menorConcursoJogado,
      ultimoApurado: ultimoNumeroApurado,
      fimConcurso: maiorConcursoJogado,
      totalPremiacoes,
      totalValorGanho,
    };
  }, [concursosApuradosUsuario, concursosFuturosUsuario, menorConcursoJogado, ultimoNumeroApurado, maiorConcursoJogado, concursosDoUsuarioMap]);

  return (
    <div className="space-y-6">
      {/* 1. Header Focado na Teimosinha do Usuário */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[#121827] via-[#151c30] to-[#121827] border border-purple-500/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Histórico Pessoal de Apostas
              </span>
              <span className="text-xs text-amber-300 font-semibold font-mono">
                Teimosinha Ativa: Concursos {metricasTeimosinha.inicioConcurso} até {metricasTeimosinha.fimConcurso}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Histórico dos Meus Concursos Jogados (Teimosinha)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Exibindo <strong>apenas os concursos que você jogou</strong> a partir do <strong>Concurso {metricasTeimosinha.inicioConcurso}</strong>. Concursos anteriores foram desconsiderados conforme solicitado.
            </p>
          </div>

          {onIrParaAfericao && (
            <button
              onClick={onIrParaAfericao}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start md:self-auto shrink-0 shadow-md shadow-purple-900/30 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Registrar Novo Jogo / Aferir</span>
            </button>
          )}
        </div>

        {/* Métricas da Teimosinha do Usuário */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/30">
            <span className="text-[11px] text-gray-400 block font-medium">Início da Sua Teimosinha</span>
            <span className="text-base sm:text-lg font-bold text-purple-300 font-mono mt-0.5 block">
              Concurso {metricasTeimosinha.inicioConcurso}
            </span>
            <span className="text-[10px] text-gray-500">Ponto de partida do seu histórico</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30">
            <span className="text-[11px] text-gray-400 block font-medium">Sorteios Já Apurados</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
              {metricasTeimosinha.totalApurados} concursos
            </span>
            <span className="text-[10px] text-gray-500">
              C.{metricasTeimosinha.inicioConcurso} até C.{metricasTeimosinha.ultimoApurado}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30">
            <span className="text-[11px] text-gray-400 block font-medium">Próximos Sorteios Ativos</span>
            <span className="text-base sm:text-lg font-bold text-amber-300 font-mono mt-0.5 block">
              {metricasTeimosinha.totalFuturos} concursos
            </span>
            <span className="text-[10px] text-gray-500">
              C.{ultimoNumeroApurado + 1} até C.{metricasTeimosinha.fimConcurso}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/40">
            <span className="text-[11px] text-gray-400 block font-medium">Prêmios Conquistados</span>
            <span className="text-base sm:text-lg font-bold text-emerald-300 font-mono mt-0.5 block">
              {metricasTeimosinha.totalValorGanho.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            <span className="text-[10px] text-emerald-400/80">
              {metricasTeimosinha.totalPremiacoes > 0
                ? `${metricasTeimosinha.totalPremiacoes} sorteio(s) premiado(s)`
                : "Acumulando em conta"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Toggle de Visualização: Concursos Apurados vs Próximos Concursos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#121827] rounded-2xl border border-gray-800">
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-gray-800/80">
          <button
            onClick={() => setSubTab("apurados")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "apurados"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Concursos Apurados da Teimosinha ({concursosApuradosUsuario.length})</span>
          </button>

          <button
            onClick={() => setSubTab("proximos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "proximos"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Próximos Sorteios ({concursosFuturosUsuario.length})</span>
          </button>
        </div>

        {subTab === "apurados" && (
          <div className="flex flex-wrap items-center gap-2 px-2">
            {/* Busca Rápida no Histórico da Teimosinha */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar concurso (ex: 3820)..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-black/60 border border-gray-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-purple-500 font-mono w-44"
              />
            </div>

            {/* Filtro de Premiados */}
            <div className="flex items-center gap-1 text-xs bg-black/40 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setFiltroPremiados("todos")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  filtroPremiados === "todos" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Todos ({concursosApuradosUsuario.length})
              </button>
              <button
                onClick={() => setFiltroPremiados("premiados")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  filtroPremiados === "premiados" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Premiados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. LISTAGEM DOS CONCURSOS APURADOS DA TEIMOSINHA */}
      {subTab === "apurados" ? (
        concursosApuradosExibicao.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-[#121827] border border-dashed border-gray-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-300">Nenhum concurso correspondente encontrado</h4>
            <p className="text-xs text-gray-500">
              Nenhum concurso da sua teimosinha (a partir de 3820) atende ao filtro de busca informado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {concursosApuradosExibicao.map((conc) => {
              const jogosDesteConcurso = concursosDoUsuarioMap.get(conc.numero) || [];
              const faixa15 = conc.listaRateioPremio?.find((f) => f.faixa === 1);
              const ganhadores15 = faixa15?.numeroDeGanhadores ?? (conc.acumulado ? 0 : 1);
              const valor15 = faixa15?.valorPremio || 0;
              const acumulou = conc.acumulado || ganhadores15 === 0;

              // Total de prêmios pagos no concurso
              const totalPremiosConcurso = (conc.listaRateioPremio || []).reduce(
                (acc, f) => acc + f.numeroDeGanhadores * f.valorPremio,
                0
              );
              const totalGanhadoresGeral = (conc.listaRateioPremio || []).reduce(
                (acc, f) => acc + f.numeroDeGanhadores,
                0
              );

              const sortSetCaixa = new Set(conc.dezenas);

              return (
                <div
                  key={conc.numero}
                  className="p-5 rounded-2xl bg-[#121827] border-2 border-purple-500/40 hover:border-purple-400 transition-all shadow-xl space-y-4"
                >
                  {/* Topo do Card com Destaque do Concurso */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50 animate-pulse" />
                        <strong className="text-lg text-white font-mono">
                          Concurso Oficial {conc.numero}
                        </strong>
                      </div>

                      <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {conc.dataApuracao}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          acumulou
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        }`}
                      >
                        {acumulou
                          ? "15 ACERTOS ACUMULOU"
                          : `${ganhadores15} ganhador${ganhadores15 > 1 ? "es" : ""} de 15 acertos`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onVisualizarConcurso(conc)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-900/40 transition-all cursor-pointer self-start sm:self-auto active:scale-95 shrink-0"
                      title="Ver todos os detalhes oficiais da Caixa: rateio completo das 5 faixas e cidades dos ganhadores"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ver Detalhes Oficiais Caixa</span>
                    </button>
                  </div>

                  {/* SEÇÃO PRINCIPAL: SUAS APOSTAS DA TEIMOSINHA NESTE CONCURSO */}
                  <div className="space-y-3">
                    {jogosDesteConcurso.map((jogo) => {
                      const acertadas = jogo.dezenas.filter((d) => sortSetCaixa.has(d));
                      const acertos = acertadas.length;
                      const isPremiado = acertos >= 11;

                      let valorGanho = 0;
                      let textoFaixa = "Não premiado";
                      if (acertos === 15) {
                        valorGanho = valor15 > 0 ? valor15 : 2000000;
                        textoFaixa = "15 ACERTOS (PRÊMIO MÁXIMO!)";
                      } else if (acertos === 14) {
                        const f14 = conc.listaRateioPremio?.find((f) => f.faixa === 2);
                        valorGanho = f14?.valorPremio || 1500;
                        textoFaixa = "14 Acertos";
                      } else if (acertos === 13) {
                        valorGanho = 35;
                        textoFaixa = "13 Acertos";
                      } else if (acertos === 12) {
                        valorGanho = 14;
                        textoFaixa = "12 Acertos";
                      } else if (acertos === 11) {
                        valorGanho = 7;
                        textoFaixa = "11 Acertos";
                      }

                      return (
                        <div
                          key={jogo.id}
                          className={`p-4 rounded-xl border ${
                            isPremiado
                              ? "bg-gradient-to-br from-emerald-950/40 via-black/50 to-purple-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/30"
                              : "bg-black/40 border-gray-800"
                          } space-y-3`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/60 pb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40">
                                  Seu Bilhete da Teimosinha
                                </span>
                                <strong className="text-white text-sm">{jogo.grupoNome}</strong>
                              </div>
                              <span className="text-[11px] text-gray-400">
                                Vigência da aposta: Concursos {jogo.concursoInicial} até {jogo.concursoFinal}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <span
                                className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold flex items-center gap-1.5 ${
                                  isPremiado
                                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                                    : "bg-gray-800 text-gray-300"
                                }`}
                              >
                                {isPremiado && <Trophy className="w-3.5 h-3.5 fill-current" />}
                                <span>{acertos} ACERTOS</span>
                                {isPremiado && <span>• PREMIADO!</span>}
                              </span>

                              {isPremiado && (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold">
                                  +{valorGanho.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dezenas Jogadas por Você (Acertos em Verde Esmeralda) */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-gray-300 font-semibold block">
                              Suas 15 Dezenas Apostadas neste Concurso (Acertos em Verde Esmeralda):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {jogo.dezenas.map((dezena) => {
                                const acertou = sortSetCaixa.has(dezena);
                                return (
                                  <span
                                    key={dezena}
                                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                                      acertou
                                        ? "bg-emerald-600 text-white border-2 border-emerald-400 shadow-md shadow-emerald-600/50 scale-105"
                                        : "bg-gray-800/80 text-gray-500 border border-gray-700/60"
                                    }`}
                                  >
                                    {dezena.toString().padStart(2, "0")}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* As 15 Dezenas Sorteadas na Caixa */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-gray-400 font-medium block">
                      15 Dezenas Sorteadas no Concurso {conc.numero} (Caixa Econômica Federal):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {conc.dezenas.map((dezena) => (
                        <span
                          key={dezena}
                          className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center font-mono"
                        >
                          {dezena.toString().padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resumo Financeiro Oficial do Sorteio */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[11px] block">Prêmio 15 Acertos:</span>
                        <strong className="text-emerald-400 font-mono text-sm">
                          {valor15 > 0
                            ? valor15.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "Acumulou"}
                        </strong>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-400/80" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[11px] block">Total de Prêmios Pagos no Concurso:</span>
                        <strong className="text-emerald-400 font-mono text-sm font-bold">
                          {totalPremiosConcurso.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </strong>
                      </div>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[11px] block">Apostas Contempladas:</span>
                        <strong className="text-purple-300 font-mono text-sm">
                          {totalGanhadoresGeral.toLocaleString("pt-BR")} bilhetes
                        </strong>
                      </div>
                      <Users className="w-4 h-4 text-purple-400/80" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* 4. LISTAGEM DOS PRÓXIMOS CONCURSOS DA TEIMOSINHA (Aguardando Sorteio) */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-gray-300 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Estes são os concursos futuros em que você <strong>já está concorrendo com a sua teimosinha</strong>. A apuração e conferência oficial serão realizadas assim que a Caixa realizar cada sorteio.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {concursosFuturosUsuario.map(({ numero, jogos }) => (
              <div
                key={numero}
                className="p-4 rounded-xl bg-[#121827] border border-gray-800 hover:border-amber-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-white font-mono text-base">Concurso {numero}</strong>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aguardando Sorteio
                  </span>
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  <div>
                    Bilhete: <strong className="text-purple-300">{jogos[0]?.grupoNome || "Teimosinha"}</strong>
                  </div>
                  <div>
                    Status: <span className="text-emerald-400 font-semibold">Participação Garantida ✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
