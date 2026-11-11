"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ConcursoLotofacil, JogoRegistrado, RegistroSaque } from "@/lib/types";
import {
  getJogosRegistrados,
  getSaquesRegistrados,
  saveJogoRegistrado,
  saveHistoricoConsulta,
  reconciliarJogosComConcursos,
} from "@/lib/storage";
import {
  getStatusApuracaoCaixa,
  preencherLacunasConcursos,
  StatusApuracaoCaixa,
} from "@/lib/caixa-monitor";
import { apurarJogoComConcurso, gerarMelhoresQuinzenas } from "@/lib/lotofacil-engine";
import historicalSeed from "@/lib/historical-seed.json";
import Header from "@/components/Header";
import AbaEstatisticas from "@/components/AbaEstatisticas";
import AbaTeimosinha from "@/components/AbaTeimosinha";
import AbaAfericao from "@/components/AbaAfericao";
import AbaHistorico from "@/components/AbaHistorico";
import AbaFinanceiro from "@/components/AbaFinanceiro";
import ModalGanhadores from "@/components/ModalGanhadores";
import { Sparkles, Calculator, Trophy, Wallet, History } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "analise" | "teimosinha" | "afericao" | "historico" | "financeiro"
  >("analise");

  const [historico, setHistorico] = useState<ConcursoLotofacil[]>(historicalSeed as ConcursoLotofacil[]);
  const [ultimoConcurso, setUltimoConcurso] = useState<ConcursoLotofacil | null>(null);
  const [loadingApi, setLoadingApi] = useState<boolean>(false);

  // Status de apuração e sorteios da Caixa (atualizado em tempo real e a partir das 21h)
  const [statusCaixa, setStatusCaixa] = useState<StatusApuracaoCaixa>(() =>
    getStatusApuracaoCaixa(null)
  );

  const [jogos, setJogos] = useState<JogoRegistrado[]>([]);
  const [saques, setSaques] = useState<RegistroSaque[]>([]);

  // Modal de Ganhadores
  const [modalGanhadoresConcurso, setModalGanhadoresConcurso] = useState<ConcursoLotofacil | null>(null);
  const [modalGanhadoresAberto, setModalGanhadoresAberto] = useState<boolean>(false);

  // Carrega dados iniciais do LocalStorage
  const carregarDadosLocais = useCallback(() => {
    setJogos(getJogosRegistrados());
    setSaques(getSaquesRegistrados());
  }, []);

  /**
   * Busca dados em tempo real da Caixa Econômica Federal:
   * 1. Elimina qualquer cache (cache: "no-store", ?t=Date.now()).
   * 2. Preenche sequencialmente qualquer lacuna de concursos (gap-filling),
   *    garantindo que se a Caixa estiver no 3826 (ou 3827), o concurso 3825 seja
   *    imediatamente integrado sem nunca ser pulado.
   * 3. Registra as consultas no histórico local.
   * 4. Reconcilia e apura todos os bilhetes do usuário (teimosinhas), acumulando saldo.
   */
  const buscarDadosCaixa = useCallback(async (): Promise<ConcursoLotofacil | null> => {
    setLoadingApi(true);
    try {
      const res = await fetch("/api/lotofacil?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && data.concurso) {
          const concCaixa: ConcursoLotofacil = data.concurso;
          setUltimoConcurso(concCaixa);
          saveHistoricoConsulta(concCaixa);

          // Preenche sequencialmente qualquer concurso faltante (ex: 3825, 3826)
          const { novoHistorico, concursosAdicionados } = await preencherLacunasConcursos(
            historico,
            concCaixa
          );

          concursosAdicionados.forEach((c) => saveHistoricoConsulta(c));
          setHistorico(novoHistorico);

          // Reconcilia todos os jogos salvos com os concursos apurados
          const houveReconciliacao = reconciliarJogosComConcursos(novoHistorico);
          if (houveReconciliacao || concursosAdicionados.length > 0) {
            carregarDadosLocais();
          }

          // Atualiza status oficial da Caixa
          setStatusCaixa(getStatusApuracaoCaixa(concCaixa));
          return concCaixa;
        }
      }
    } catch (err) {
      console.error("Erro ao buscar dados da Caixa:", err);
    } finally {
      setLoadingApi(false);
    }
    return null;
  }, [historico, carregarDadosLocais]);

  // Carga inicial
  useEffect(() => {
    carregarDadosLocais();
    buscarDadosCaixa();
  }, []);

  // Atualiza relógio e status do sorteio Caixa a cada 10 segundos
  useEffect(() => {
    const timerStatus = setInterval(() => {
      setStatusCaixa(getStatusApuracaoCaixa(ultimoConcurso));
    }, 10000);
    return () => clearInterval(timerStatus);
  }, [ultimoConcurso]);

  /**
   * Monitoramento contínuo da apuração oficial da Caixa a partir das 21h:
   * - Seg a Sáb entre 20h45 e 23h59: dispara busca a cada 30 segundos enquanto o concurso do dia não for obtido.
   * - Fora do horário: verifica a cada 3 minutos.
   * - Dispara busca imediatamente quando a aba do navegador for reaberta ou ganhar foco.
   */
  useEffect(() => {
    const checarESincronizar = () => {
      const st = getStatusApuracaoCaixa(ultimoConcurso);
      setStatusCaixa(st);

      // Se estiver no horário de apuração da Caixa e o concurso de hoje ainda não tiver sido capturado
      if (st.horarioApuracaoAtivo && !st.concursoHojeApurado) {
        buscarDadosCaixa();
      }
    };

    const stAtual = getStatusApuracaoCaixa(ultimoConcurso);
    const intervaloMs = stAtual.horarioApuracaoAtivo ? 30000 : 180000;

    const intervalId = setInterval(checarESincronizar, intervaloMs);

    const handleVisibilidade = () => {
      if (document.visibilityState === "visible") {
        checarESincronizar();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilidade);
    window.addEventListener("focus", handleVisibilidade);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilidade);
      window.removeEventListener("focus", handleVisibilidade);
    };
  }, [ultimoConcurso, buscarDadosCaixa]);

  // Cálculos financeiros consolidados
  const totalInvestido = jogos.reduce((acc, j) => acc + j.custoTotal, 0);
  const totalGanhos = jogos.reduce((acc, j) => acc + j.totalGanho, 0);
  const totalSacado = saques.reduce((acc, s) => acc + s.valor, 0);
  const saldoDisponivelSaque = Math.max(0, totalGanhos - totalSacado);

  // Quantidade de concursos jogados pelo usuário que já foram apurados
  const concursosJogadosApuradosCount = useMemo(() => {
    const ultimoNum = ultimoConcurso?.numero || (historico.length > 0 ? historico[historico.length - 1].numero : 3826);
    const concursosSet = new Set<number>();
    jogos.forEach((j) => {
      const fim = Math.min(j.concursoFinal, ultimoNum);
      for (let c = j.concursoInicial; c <= fim; c++) {
        concursosSet.add(c);
      }
    });
    if (concursosSet.size === 0) {
      for (let c = 3820; c <= ultimoNum; c++) {
        concursosSet.add(c);
      }
    }
    return concursosSet.size;
  }, [jogos, ultimoConcurso]);

  /**
   * Ao clicar em "Ver Resultado (Caixa)" ou fornecer um concurso específico:
   * 1. Se concursoOpcional for fornecido, busca e afere aquele concurso específico.
   * 2. Se omitido, busca o concurso atual da Caixa em tempo real (último apurado).
   * 3. Registra a consulta no histórico para posterior conferência.
   * 4. Cruza com os jogos registrados (grupos da IA ou personalizados).
   * 5. Se houver acertos, grava a apuração e acumula o saldo na conta.
   * 6. Abre o modal com detalhamento completo e totalização de prêmios.
   */
  const handleAbrirGanhadoresUltimo = async (concursoOpcional?: number) => {
    if (concursoOpcional && typeof concursoOpcional === "number" && concursoOpcional > 0) {
      await handleAbrirGanhadoresEspecifico(concursoOpcional);
      return;
    }

    const concApi = await buscarDadosCaixa();
    let conc = concApi || ultimoConcurso;

    if (!conc && historico && historico.length > 0) {
      conc = historico[historico.length - 1];
    }

    if (conc) {
      // Registra a consulta no histórico
      saveHistoricoConsulta(conc);

      // Apura qualquer jogo registrado que pertença a este concurso
      const jogosSalvos = getJogosRegistrados();
      let houveAlteracao = false;

      jogosSalvos.forEach((j) => {
        if (conc && conc.numero >= j.concursoInicial && conc.numero <= j.concursoFinal) {
          const resAp = apurarJogoComConcurso(j, conc);
          if (resAp.pertenceAoConcurso) {
            saveJogoRegistrado(resAp.jogoAtualizado);
            houveAlteracao = true;
          }
        }
      });

      if (houveAlteracao) {
        carregarDadosLocais();
      }

      setModalGanhadoresConcurso(conc);
      setModalGanhadoresAberto(true);
    }
  };

  /**
   * Ao clicar no "olhinho" (Ganhadores) em Meus Jogos Registrados:
   * Busca os dados completos do concurso na Caixa (ou cache),
   * listando todos os ganhadores, locais (cidades/UF) e valores pagos.
   */
  const handleAbrirGanhadoresEspecifico = async (concursoParam: ConcursoLotofacil | number) => {
    const num = typeof concursoParam === "number" ? concursoParam : concursoParam.numero;
    let concCompleto: ConcursoLotofacil | null = null;

    // 1. Se for o último concurso já carregado com rateio e cidades:
    if (ultimoConcurso && ultimoConcurso.numero === num && (ultimoConcurso.listaRateioPremio?.length || 0) > 0) {
      concCompleto = ultimoConcurso;
    }

    // 2. Busca na API oficial pelo número do concurso para trazer cidades e rateio completo
    if (!concCompleto) {
      try {
        setLoadingApi(true);
        const res = await fetch(`/api/lotofacil/${num}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sucesso && data.concurso) {
            concCompleto = data.concurso as ConcursoLotofacil;
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar dados completos do concurso ${num}:`, err);
      } finally {
        setLoadingApi(false);
      }
    }

    // 3. Fallback se a API falhar: verifica no histórico local
    if (!concCompleto) {
      const seedFound = historico.find((h) => h.numero === num);
      if (seedFound) concCompleto = seedFound;
      else if (typeof concursoParam !== "number") concCompleto = concursoParam;
    }

    if (concCompleto) {
      saveHistoricoConsulta(concCompleto);

      // Apura qualquer jogo registrado que pertença a este concurso
      const jogosSalvos = getJogosRegistrados();
      let houveAlteracao = false;
      jogosSalvos.forEach((j) => {
        if (concCompleto && concCompleto.numero >= j.concursoInicial && concCompleto.numero <= j.concursoFinal) {
          const resAp = apurarJogoComConcurso(j, concCompleto);
          if (resAp.pertenceAoConcurso) {
            saveJogoRegistrado(resAp.jogoAtualizado);
            houveAlteracao = true;
          }
        }
      });
      if (houveAlteracao) {
        carregarDadosLocais();
      }

      setModalGanhadoresConcurso(concCompleto);
      setModalGanhadoresAberto(true);
    }
  };

  const gruposAtuais = useMemo(() => {
    return gerarMelhoresQuinzenas(historico, 20);
  }, [historico]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-gray-100">
      {/* Header Fixo */}
      <Header
        ultimoConcurso={ultimoConcurso}
        loadingApi={loadingApi}
        onRefreshApi={buscarDadosCaixa}
        totalInvestido={totalInvestido}
        totalGanhos={totalGanhos}
        totalSacado={totalSacado}
        saldoDisponivelSaque={saldoDisponivelSaque}
        onOpenGanhadores={handleAbrirGanhadoresUltimo}
        onIrParaFinanceiro={() => setActiveTab("financeiro")}
        statusCaixa={statusCaixa}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="overflow-x-auto pb-1">
          <nav className="flex space-x-2 p-1.5 bg-[#121827] rounded-2xl border border-gray-800 w-max md:w-full">
            <button
              onClick={() => setActiveTab("analise")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                activeTab === "analise"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Janela de Análise & Melhores Quinzenas (IA)</span>
            </button>

            <button
              onClick={() => setActiveTab("teimosinha")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                activeTab === "teimosinha"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Simulador Teimosinha</span>
            </button>

            <button
              onClick={() => setActiveTab("afericao")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all relative ${
                activeTab === "afericao"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Aferição Oficial Caixa</span>
              {jogos.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("historico")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all relative ${
                activeTab === "historico"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <History className="w-4 h-4 text-purple-300" />
              <span>Histórico da Teimosinha</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 ml-0.5">
                {concursosJogadosApuradosCount} apurados
              </span>
            </button>

            <button
              onClick={() => setActiveTab("financeiro")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                activeTab === "financeiro"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Financeiro & Saques</span>
              {saldoDisponivelSaque > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ml-1">
                  R$ {saldoDisponivelSaque.toFixed(0)}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === "analise" && (
            <AbaEstatisticas
              historico={historico}
              ultimoConcurso={ultimoConcurso}
              jogos={jogos}
              onJogoRegistrado={carregarDadosLocais}
              onIrParaAfericao={() => setActiveTab("afericao")}
            />
          )}

          {activeTab === "teimosinha" && (
            <AbaTeimosinha
              ultimoConcurso={ultimoConcurso}
              onJogoRegistrado={carregarDadosLocais}
              onIrParaAfericao={() => setActiveTab("afericao")}
            />
          )}

          {activeTab === "afericao" && (
            <AbaAfericao
              jogos={jogos}
              onAtualizarJogos={carregarDadosLocais}
              onVisualizarGanhadoresConcurso={handleAbrirGanhadoresEspecifico}
              onIrParaGerador={() => setActiveTab("analise")}
              ultimoConcurso={ultimoConcurso}
              gruposDisponiveis={gruposAtuais}
              onVerResultado={handleAbrirGanhadoresUltimo}
              saldoDisponivelSaque={saldoDisponivelSaque}
              onIrParaFinanceiro={() => setActiveTab("financeiro")}
            />
          )}

          {activeTab === "historico" && (
            <AbaHistorico
              historico={historico}
              ultimoConcurso={ultimoConcurso}
              jogos={jogos}
              onVisualizarConcurso={handleAbrirGanhadoresEspecifico}
              onIrParaAfericao={() => setActiveTab("afericao")}
            />
          )}

          {activeTab === "financeiro" && (
            <AbaFinanceiro
              jogos={jogos}
              saques={saques}
              onAtualizarSaques={carregarDadosLocais}
            />
          )}
        </div>
      </main>

      {/* Modal de Detalhamento de Ganhadores & Cruzamento Oficial */}
      <ModalGanhadores
        concurso={modalGanhadoresConcurso}
        isOpen={modalGanhadoresAberto}
        onClose={() => setModalGanhadoresAberto(false)}
        jogos={jogos}
        saldoDisponivelSaque={saldoDisponivelSaque}
        onIrParaFinanceiro={() => {
          setModalGanhadoresAberto(false);
          setActiveTab("financeiro");
        }}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-[#0d121f] text-gray-500 text-xs py-4 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Lotofácil AI — Desenvolvido com base nos 3.760+ concursos oficiais da Caixa Econômica Federal.
          </span>
          <span className="text-[11px] text-gray-600">
            Preço oficial da aposta de 15 dezenas: R$ 3,50. Jogue com responsabilidade.
          </span>
        </div>
      </footer>
    </div>
  );
}
