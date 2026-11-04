"use client";

import React, { useState } from "react";
import { JogoRegistrado, ConcursoLotofacil } from "@/lib/types";
import { PREMIOS_FIXOS } from "@/lib/lotofacil-engine";
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
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";

interface AbaAfericaoProps {
  jogos: JogoRegistrado[];
  onAtualizarJogos: () => void;
  onVisualizarGanhadoresConcurso: (c: ConcursoLotofacil) => void;
  onIrParaGerador: () => void;
}

export default function AbaAfericao({
  jogos,
  onAtualizarJogos,
  onVisualizarGanhadoresConcurso,
  onIrParaGerador,
}: AbaAfericaoProps) {
  const [aferindoId, setAferindoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Aferição automática conectando à API oficial
  const handleAferirJogo = async (jogo: JogoRegistrado) => {
    setAferindoId(jogo.id);
    setMensagem(`Consultando resultados da Caixa para o ${jogo.grupoNome}...`);

    try {
      // 1. Busca último concurso oficial
      const resLatest = await fetch("/api/lotofacil");
      const dataLatest = await resLatest.json();
      if (!dataLatest.sucesso || !dataLatest.concurso) {
        throw new Error("Não foi possível obter dados oficiais da Caixa.");
      }

      const ultimoOficial = dataLatest.concurso as ConcursoLotofacil;
      const concFinalParaChecar = Math.min(jogo.concursoFinal, ultimoOficial.numero);

      const jogoAtualizado = { ...jogo, apuracoes: { ...jogo.apuracoes } };
      let novosGanhos = 0;

      // Percorre os concursos que estão dentro da janela da aposta
      for (let c = jogo.concursoInicial; c <= concFinalParaChecar; c++) {
        let concData: ConcursoLotofacil | null = null;
        if (c === ultimoOficial.numero) {
          concData = ultimoOficial;
        } else {
          // Busca concurso específico
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
          let faixaPremio = "";

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

      // Soma total ganho
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
    if (confirm("Deseja realmente remover este jogo registrado do monitoramento?")) {
      deleteJogoRegistrado(id);
      onAtualizarJogos();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 md:p-5 rounded-2xl bg-[#121827] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            Meus Jogos Registrados & Aferição Oficial Caixa
          </h2>
          <p className="text-xs text-gray-400">
            Monitore suas apostas ativas, afira acertos em tempo real e acumule valores ganhos.
          </p>
        </div>

        <button
          onClick={onIrParaGerador}
          className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Novo Jogo
        </button>
      </div>

      {mensagem && (
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{mensagem}</span>
        </div>
      )}

      {/* Lista de Jogos Registrados */}
      {jogos.length === 0 ? (
        <div className="p-8 md:p-12 text-center rounded-2xl bg-[#121827] border border-dashed border-gray-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-300">Nenhum jogo registrado ainda</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Vá até a aba <strong>"Gerador de Grupos IA"</strong> ou <strong>"Simulador Teimosinha"</strong> e registre seus grupos para acompanhar os resultados oficiais aqui.
          </p>
          <button
            onClick={onIrParaGerador}
            className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            Escolher Grupo de Dezenas
          </button>
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
                      className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
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
  );
}
