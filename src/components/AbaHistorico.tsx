"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Trophy,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Sparkles,
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
  // Filtros de busca
  const [busca, setBusca] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ganhadores" | "acumulados" | "meus_jogos">("todos");
  const [ordemDecrescente, setOrdemDecrescente] = useState<boolean>(true);
  const [itensPorPagina, setItensPorPagina] = useState<number>(20);
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  // Mapeamento rápido de jogos registrados por concurso
  const jogosPorConcursoMap = useMemo(() => {
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

  // Lista filtrada e ordenada
  const concursosFiltrados = useMemo(() => {
    let lista = [...historico];

    // Se o último concurso carregado da API for mais recente e não estiver na lista:
    if (ultimoConcurso && !lista.some((c) => c.numero === ultimoConcurso.numero)) {
      lista.push(ultimoConcurso);
    }

    // Ordenação
    lista.sort((a, b) => (ordemDecrescente ? b.numero - a.numero : a.numero - b.numero));

    // Busca por número ou data
    const termo = busca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter(
        (c) =>
          c.numero.toString().includes(termo) ||
          (c.dataApuracao && c.dataApuracao.toLowerCase().includes(termo))
      );
    }

    // Filtros de status
    if (filtroStatus === "acumulados") {
      lista = lista.filter((c) => {
        const f15 = c.listaRateioPremio?.find((f) => f.faixa === 1);
        return c.acumulado || (f15 ? f15.numeroDeGanhadores === 0 : false);
      });
    } else if (filtroStatus === "ganhadores") {
      lista = lista.filter((c) => {
        const f15 = c.listaRateioPremio?.find((f) => f.faixa === 1);
        return f15 ? f15.numeroDeGanhadores > 0 : !c.acumulado;
      });
    } else if (filtroStatus === "meus_jogos") {
      lista = lista.filter((c) => jogosPorConcursoMap.has(c.numero));
    }

    return lista;
  }, [historico, ultimoConcurso, busca, filtroStatus, ordemDecrescente, jogosPorConcursoMap]);

  // Paginação
  const totalConcursos = concursosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalConcursos / itensPorPagina));
  const paginaCorrigida = Math.min(paginaAtual, totalPaginas);

  const inicioIdx = (paginaCorrigida - 1) * itensPorPagina;
  const fimIdx = Math.min(inicioIdx + itensPorPagina, totalConcursos);
  const concursosPaginados = concursosFiltrados.slice(inicioIdx, fimIdx);

  // Estatísticas rápidas gerais da base histórica
  const estatisticasGerais = useMemo(() => {
    const total = historico.length;
    const ultimo = historico.length > 0 ? historico[historico.length - 1] : null;
    let acumulados = 0;
    let maiorPremio = 0;

    historico.forEach((c) => {
      const f15 = c.listaRateioPremio?.find((f) => f.faixa === 1);
      if (c.acumulado || (f15 && f15.numeroDeGanhadores === 0)) {
        acumulados++;
      }
      if (f15 && f15.valorPremio > maiorPremio) {
        maiorPremio = f15.valorPremio;
      }
    });

    const comGanhadores = total - acumulados;
    return {
      total,
      ultimoNumero: ultimo?.numero || 3824,
      acumulados,
      comGanhadores,
      maiorPremio,
    };
  }, [historico]);

  const handleMudarPagina = (novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header da Aba com Estatísticas Gerais da Base */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[#121827] via-[#141b2e] to-[#121827] border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider flex items-center gap-1">
                <History className="w-3 h-3" />
                Histórico Oficial Caixa
              </span>
              <span className="text-xs text-emerald-400 font-semibold font-mono">
                {estatisticasGerais.total.toLocaleString("pt-BR")} Concursos Apurados
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Todos os Concursos Oficiais da Lotofácil
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Consulte os resultados históricos de todos os sorteios apurados pela Caixa Econômica Federal, dezenas sorteadas, rateio completo e totalização de prêmios pagos.
            </p>
          </div>

          {onIrParaAfericao && (
            <button
              onClick={onIrParaAfericao}
              className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/50 text-purple-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start md:self-auto shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Aferir Meus Jogos</span>
            </button>
          )}
        </div>

        {/* Cards de Métricas Gerais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-[11px] text-gray-400 block">Total de Concursos</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono mt-0.5 block">
              {estatisticasGerais.total.toLocaleString("pt-BR")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-[11px] text-gray-400 block">Último Concurso</span>
            <span className="text-base sm:text-lg font-bold text-purple-300 font-mono mt-0.5 block">
              C.{estatisticasGerais.ultimoNumero}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-[11px] text-gray-400 block">Com Ganhadores 15</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
              {estatisticasGerais.comGanhadores.toLocaleString("pt-BR")} sorteios
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-[11px] text-gray-400 block">Acumulados</span>
            <span className="text-base sm:text-lg font-bold text-amber-300 font-mono mt-0.5 block">
              {estatisticasGerais.acumulados.toLocaleString("pt-BR")} sorteios
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros, Pesquisa e Controles de Exibição */}
      <div className="p-4 rounded-2xl bg-[#121827] border border-gray-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número do concurso (ex: 3824, 3820) ou data (ex: 06/11/2026)..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full bg-black/60 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-purple-500 font-mono"
            />
            {busca && (
              <button
                onClick={() => {
                  setBusca("");
                  setPaginaAtual(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Botões de Ordenação e Itens por Página */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOrdemDecrescente((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
              title="Inverter ordem dos concursos"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              <span>{ordemDecrescente ? "Mais Recentes Primeiro" : "Mais Antigos Primeiro"}</span>
            </button>

            <select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(parseInt(e.target.value, 10));
                setPaginaAtual(1);
              }}
              className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 font-semibold outline-none cursor-pointer hover:border-gray-700"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>

        {/* Filtros de Status (Tabs) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-800/80">
          <span className="text-[11px] text-gray-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-purple-400" /> Filtrar:
          </span>

          <button
            onClick={() => {
              setFiltroStatus("todos");
              setPaginaAtual(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroStatus === "todos"
                ? "bg-purple-600 text-white"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Todos ({totalConcursos})
          </button>

          <button
            onClick={() => {
              setFiltroStatus("ganhadores");
              setPaginaAtual(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroStatus === "ganhadores"
                ? "bg-emerald-600 text-white"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Com Ganhadores de 15
          </button>

          <button
            onClick={() => {
              setFiltroStatus("acumulados");
              setPaginaAtual(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroStatus === "acumulados"
                ? "bg-amber-600 text-white"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Acumulados
          </button>

          {jogos.length > 0 && (
            <button
              onClick={() => {
                setFiltroStatus("meus_jogos");
                setPaginaAtual(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                filtroStatus === "meus_jogos"
                  ? "bg-fuchsia-600 text-white"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <span>Com Meus Jogos Registrados</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Lista de Concursos Apurados */}
      {concursosPaginados.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#121827] border border-dashed border-gray-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-300">Nenhum concurso encontrado</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Nenhum concurso corresponde aos critérios de pesquisa informados. Tente limpar os filtros ou digitar outro número.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {concursosPaginados.map((conc) => {
            const faixa15 = conc.listaRateioPremio?.find((f) => f.faixa === 1);
            const ganhadores15 = faixa15?.numeroDeGanhadores ?? (conc.acumulado ? 0 : 1);
            const valor15 = faixa15?.valorPremio || 0;
            const acumulou = conc.acumulado || ganhadores15 === 0;

            // Totalização de prêmios e ganhadores de todas as faixas
            const totalGeralPremios = (conc.listaRateioPremio || []).reduce(
              (acc, f) => acc + f.numeroDeGanhadores * f.valorPremio,
              0
            );
            const totalGeralGanhadores = (conc.listaRateioPremio || []).reduce(
              (acc, f) => acc + f.numeroDeGanhadores,
              0
            );

            // Verifica se o usuário tem apostas para este concurso
            const meusJogosDesteConcurso = jogosPorConcursoMap.get(conc.numero) || [];

            return (
              <div
                key={conc.numero}
                className="p-4 sm:p-5 rounded-2xl bg-[#121827] border border-gray-800 hover:border-purple-500/40 transition-all shadow-lg space-y-3.5"
              >
                {/* Linha de Cabeçalho do Concurso */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <strong className="text-base text-white font-mono">
                        Concurso {conc.numero}
                      </strong>
                    </div>

                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {conc.dataApuracao}
                    </span>

                    {/* Status da Faixa 15 */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        acumulou
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {acumulou
                        ? "ACUMULOU"
                        : `${ganhadores15} ganhador${ganhadores15 > 1 ? "es" : ""} de 15 acertos`}
                    </span>

                    {/* Badge se tiver jogo registrado */}
                    {meusJogosDesteConcurso.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Você apostou neste sorteio (${meusJogosDesteConcurso.length} jogo${meusJogosDesteConcurso.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </div>

                  {/* Botão de Ver Detalhes Oficiais */}
                  <button
                    type="button"
                    onClick={() => onVisualizarConcurso(conc)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
                    title="Ver detalhamento completo: rateio oficial de todas as 5 faixas, cidades dos ganhadores e conferência"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ver Detalhes Oficiais</span>
                  </button>
                </div>

                {/* As 15 Dezenas Sorteadas */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-gray-400 font-medium block">
                    15 Dezenas Sorteadas no Concurso {conc.numero}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {conc.dezenas.map((dezena) => (
                      <span
                        key={dezena}
                        className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center font-mono hover:scale-105 transition-transform"
                      >
                        {dezena.toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resumo Financeiro & Rateio Consolidado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-[11px] block">Prêmio 15 Acertos:</span>
                      <strong className="text-emerald-400 font-mono text-sm">
                        {valor15 > 0
                          ? valor15.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "Acumulado"}
                      </strong>
                    </div>
                    <Trophy className="w-4 h-4 text-amber-400/80" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-[11px] block">Total de Prêmios Pagos:</span>
                      <strong className="text-white font-mono text-sm">
                        {totalGeralPremios > 0
                          ? totalGeralPremios.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "Conforme rateio Caixa"}
                      </strong>
                    </div>
                    <DollarSign className="w-4 h-4 text-emerald-400/80" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-[11px] block">Apostas Contempladas:</span>
                      <strong className="text-purple-300 font-mono text-sm">
                        {totalGeralGanhadores > 0
                          ? `${totalGeralGanhadores.toLocaleString("pt-BR")} bilhetes`
                          : `${ganhadores15} na faixa principal`}
                      </strong>
                    </div>
                    <Users className="w-4 h-4 text-purple-400/80" />
                  </div>
                </div>

                {/* Se o usuário teve jogo nesse concurso, mostra os acertos */}
                {meusJogosDesteConcurso.length > 0 && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-gray-900 to-black/40 border border-purple-500/30 text-xs space-y-2">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Conferência dos seus bilhetes neste concurso:
                    </span>
                    <div className="space-y-1.5">
                      {meusJogosDesteConcurso.map((j) => {
                        const setSorteio = new Set(conc.dezenas);
                        const acertos = j.dezenas.filter((d) => setSorteio.has(d)).length;
                        const isPremiado = acertos >= 11;

                        return (
                          <div
                            key={j.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-gray-800"
                          >
                            <span className="text-gray-200 font-medium">{j.grupoNome}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                isPremiado
                                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                                  : "bg-gray-800 text-gray-400"
                              }`}
                            >
                              {acertos} ACERTOS {isPremiado ? "🏆 PREMIADO!" : ""}
                            </span>
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

      {/* 4. Barra de Paginação */}
      {totalPaginas > 1 && (
        <div className="p-4 rounded-2xl bg-[#121827] border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-gray-400">
            Mostrando <strong className="text-white font-mono">{inicioIdx + 1}</strong> até{" "}
            <strong className="text-white font-mono">{fimIdx}</strong> de{" "}
            <strong className="text-white font-mono">{totalConcursos}</strong> concursos
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleMudarPagina(1)}
              disabled={paginaCorrigida === 1}
              className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:hover:text-gray-300 cursor-pointer"
            >
              Primeira
            </button>

            <button
              onClick={() => handleMudarPagina(paginaCorrigida - 1)}
              disabled={paginaCorrigida === 1}
              className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:hover:text-gray-300 cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-purple-300 font-mono font-bold">
              Página {paginaCorrigida} de {totalPaginas}
            </span>

            <button
              onClick={() => handleMudarPagina(paginaCorrigida + 1)}
              disabled={paginaCorrigida === totalPaginas}
              className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:hover:text-gray-300 cursor-pointer"
              title="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleMudarPagina(totalPaginas)}
              disabled={paginaCorrigida === totalPaginas}
              className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:hover:text-gray-300 cursor-pointer"
            >
              Última
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
