"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ConcursoLotofacil, JogoRegistrado, RegistroSaque } from "@/lib/types";
import { getJogosRegistrados, getSaquesRegistrados } from "@/lib/storage";
import { gerarMelhoresQuinzenas } from "@/lib/lotofacil-engine";
import historicalSeed from "@/lib/historical-seed.json";
import Header from "@/components/Header";
import AbaEstatisticas from "@/components/AbaEstatisticas";
import AbaTeimosinha from "@/components/AbaTeimosinha";
import AbaAfericao from "@/components/AbaAfericao";
import AbaFinanceiro from "@/components/AbaFinanceiro";
import ModalGanhadores from "@/components/ModalGanhadores";
import { Sparkles, Calculator, Trophy, Wallet } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "analise" | "teimosinha" | "afericao" | "financeiro"
  >("analise");

  const [historico, setHistorico] = useState<ConcursoLotofacil[]>(historicalSeed as ConcursoLotofacil[]);
  const [ultimoConcurso, setUltimoConcurso] = useState<ConcursoLotofacil | null>(null);
  const [loadingApi, setLoadingApi] = useState<boolean>(false);

  const [jogos, setJogos] = useState<JogoRegistrado[]>([]);
  const [saques, setSaques] = useState<RegistroSaque[]>([]);

  // Modal de Ganhadores
  const [modalGanhadoresConcurso, setModalGanhadoresConcurso] = useState<ConcursoLotofacil | null>(null);
  const [modalGanhadoresAberto, setModalGanhadoresAberto] = useState<boolean>(false);

  // Carrega dados iniciais do LocalStorage e busca API Caixa
  const carregarDadosLocais = () => {
    setJogos(getJogosRegistrados());
    setSaques(getSaquesRegistrados());
  };

  const buscarDadosCaixa = async () => {
    setLoadingApi(true);
    try {
      const res = await fetch("/api/lotofacil");
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && data.concurso) {
          setUltimoConcurso(data.concurso);
          // Se o concurso mais recente for mais novo que o seed, adiciona à lista
          setHistorico((prev) => {
            const existe = prev.some((c) => c.numero === data.concurso.numero);
            if (!existe) {
              return [...prev, data.concurso];
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error("Erro ao buscar dados da Caixa:", err);
    } finally {
      setLoadingApi(false);
    }
  };

  useEffect(() => {
    carregarDadosLocais();
    buscarDadosCaixa();
  }, []);

  const totalInvestido = jogos.reduce((acc, j) => acc + j.custoTotal, 0);
  const totalGanhos = jogos.reduce((acc, j) => acc + j.totalGanho, 0);

  const handleAbrirGanhadoresUltimo = () => {
    if (ultimoConcurso) {
      setModalGanhadoresConcurso(ultimoConcurso);
      setModalGanhadoresAberto(true);
    } else if (historico && historico.length > 0) {
      const ultimoSeed = historico[historico.length - 1];
      setModalGanhadoresConcurso(ultimoSeed);
      setModalGanhadoresAberto(true);
    }
  };

  const handleAbrirGanhadoresEspecifico = (c: ConcursoLotofacil) => {
    setModalGanhadoresConcurso(c);
    setModalGanhadoresAberto(true);
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
        onOpenGanhadores={handleAbrirGanhadoresUltimo}
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
              onClick={() => setActiveTab("financeiro")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                activeTab === "financeiro"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Financeiro & Saques</span>
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

      {/* Modal de Detalhamento de Ganhadores de 15 Pontos */}
      <ModalGanhadores
        concurso={modalGanhadoresConcurso}
        isOpen={modalGanhadoresAberto}
        onClose={() => setModalGanhadoresAberto(false)}
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
