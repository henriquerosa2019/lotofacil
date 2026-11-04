"use client";

import React, { useState, useEffect } from "react";
import { X, Trophy, MapPin, Users, DollarSign, Calendar, History, Trash2, ArrowLeft } from "lucide-react";
import { ConcursoLotofacil, HistoricoConsultaConcurso } from "@/lib/types";
import { saveHistoricoConsulta, getHistoricoConsultas, deleteHistoricoConsulta } from "@/lib/storage";

interface ModalGanhadoresProps {
  concurso: ConcursoLotofacil | null;
  isOpen: boolean;
  onClose: () => void;
  onSelecionarConcursoHistorico?: (c: ConcursoLotofacil) => void;
}

export default function ModalGanhadores({
  concurso,
  isOpen,
  onClose,
  onSelecionarConcursoHistorico,
}: ModalGanhadoresProps) {
  const [activeTab, setActiveTab] = useState<"detalhes" | "historico">("detalhes");
  const [historicoSalvo, setHistoricoSalvo] = useState<HistoricoConsultaConcurso[]>([]);
  const [concursoEmExibicao, setConcursoEmExibicao] = useState<ConcursoLotofacil | null>(concurso);

  useEffect(() => {
    if (concurso) {
      setConcursoEmExibicao(concurso);
      saveHistoricoConsulta(concurso);
      setHistoricoSalvo(getHistoricoConsultas());
    }
  }, [concurso, isOpen]);

  const carregarHistorico = () => {
    setHistoricoSalvo(getHistoricoConsultas());
  };

  if (!isOpen || !concursoEmExibicao) return null;

  const faixa15 = concursoEmExibicao.listaRateioPremio?.find((f) => f.faixa === 1);
  const ganhadores15 = faixa15?.numeroDeGanhadores || 0;
  const valor15 = faixa15?.valorPremio || 0;

  const cidades = concursoEmExibicao.listaMunicipioUFGanhadores || [];

  const handleVerHistoricoItem = (item: HistoricoConsultaConcurso) => {
    const cData: ConcursoLotofacil = {
      numero: item.numero,
      dataApuracao: item.dataApuracao,
      dezenas: item.dezenas,
      acumulado: item.acumulado,
      listaRateioPremio: item.rateioCompleto,
      listaMunicipioUFGanhadores: item.cidadesGanhadores.map((cg, i) => ({
        posicao: i + 1,
        municipio: cg.municipio,
        uf: cg.uf,
        ganhadores: cg.ganhadores,
      })),
    };
    setConcursoEmExibicao(cData);
    setActiveTab("detalhes");
    if (onSelecionarConcursoHistorico) onSelecionarConcursoHistorico(cData);
  };

  const handleExcluirHistoricoItem = (e: React.MouseEvent, numero: number) => {
    e.stopPropagation();
    deleteHistoricoConsulta(numero);
    carregarHistorico();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121827] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-gray-900 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Resultado Oficial Caixa — Concurso {concursoEmExibicao.numero}</span>
              </h3>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                Data de Apuração: {concursoEmExibicao.dataApuracao}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Abas */}
            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs">
              <button
                onClick={() => setActiveTab("detalhes")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === "detalhes" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Concurso
              </button>
              <button
                onClick={() => {
                  setActiveTab("historico");
                  carregarHistorico();
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "historico" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <History className="w-3 h-3" />
                Histórico ({historicoSalvo.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5">
          {activeTab === "historico" ? (
            /* Visualização do Histórico de Consultas Salvas */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-purple-400" />
                    Histórico de Concursos Consultados
                  </h4>
                  <p className="text-xs text-gray-400">
                    Estes concursos foram consultados na API da Caixa e estão salvos na memória do seu navegador.
                  </p>
                </div>
              </div>

              {historicoSalvo.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  Nenhum concurso armazenado no histórico ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {historicoSalvo.map((item) => (
                    <div
                      key={item.numero}
                      onClick={() => handleVerHistoricoItem(item)}
                      className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer transition-all ${
                        item.numero === concursoEmExibicao.numero
                          ? "bg-purple-950/30 border-purple-500"
                          : "bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">Concurso {item.numero}</strong>
                          <span className="text-gray-400">({item.dataApuracao})</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            Visto em: {item.consultadoEm}
                          </span>
                        </div>
                        {/* Dezenas */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.dezenas.map((d) => (
                            <span
                              key={d}
                              className="w-5 h-5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] flex items-center justify-center font-mono"
                            >
                              {d.toString().padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto border-t sm:border-t-0 border-gray-800 pt-1.5 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[11px] text-amber-400 font-semibold block">
                            {item.ganhadores15 === 0
                              ? "Acumulou"
                              : `${item.ganhadores15} ganhador${item.ganhadores15 > 1 ? "es" : ""}`}
                          </span>
                          <span className="text-emerald-400 font-mono text-xs font-bold">
                            {item.valor15.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleExcluirHistoricoItem(e, item.numero)}
                          className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                          title="Remover do histórico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Visualização Detalhada do Concurso */
            <>
              {/* Dezenas Sorteadas */}
              <div>
                <span className="text-xs text-gray-400 block mb-2 font-medium">
                  15 Dezenas Sorteadas no Concurso {concursoEmExibicao.numero}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {concursoEmExibicao.dezenas.map((d) => (
                    <span
                      key={d}
                      className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center font-mono"
                    >
                      {d.toString().padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Destaque 15 Acertos */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-purple-950/20 to-black/30 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-amber-300">
                      Faixa Principal: 15 Acertos
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {ganhadores15 === 0
                      ? "ACUMULOU!"
                      : `${ganhadores15} aposta${ganhadores15 > 1 ? "s" : ""} ganhadora${ganhadores15 > 1 ? "s" : ""}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
                    <span className="text-xs text-gray-400 block flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Total de Ganhadores
                    </span>
                    <span className="text-lg font-bold text-white mt-1 block">
                      {ganhadores15} {ganhadores15 === 1 ? "ganhador" : "ganhadores"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
                    <span className="text-xs text-gray-400 block flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Prêmio por Ganhador
                    </span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block font-mono">
                      {valor15.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>

                {/* Cidades e UFs dos ganhadores */}
                <div className="pt-2">
                  <span className="text-xs text-gray-300 font-semibold block mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    Detalhamento por Cidade / Estado ({cidades.length} registros):
                  </span>
                  {cidades.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {cidades.map((c, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-gray-900/90 border border-gray-800 text-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-purple-950 text-purple-300 font-bold text-[10px] flex items-center justify-center">
                              {c.uf}
                            </span>
                            <span className="text-gray-200 font-medium">{c.municipio}</span>
                          </div>
                          <span className="text-amber-400 font-semibold font-mono text-[11px]">
                            {c.ganhadores} aposta{c.ganhadores > 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      {ganhadores15 === 0
                        ? "Nenhum ganhador nesta faixa (prêmio acumulado)."
                        : "Detalhamento de cidades em processamento ou canal eletrônico da Caixa."}
                    </p>
                  )}
                </div>
              </div>

              {/* Rateio das Demais Faixas (14, 13, 12, 11) */}
              <div>
                <span className="text-xs text-gray-400 block mb-2 font-medium">
                  Rateio Completo das Faixas de Premiação:
                </span>
                <div className="overflow-x-auto rounded-xl border border-gray-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-900/90 text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="py-2 px-3">Faixa</th>
                        <th className="py-2 px-3 text-center">Ganhadores</th>
                        <th className="py-2 px-3 text-right">Prêmio por Ganhador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-gray-950/40">
                      {(concursoEmExibicao.listaRateioPremio || []).map((f) => (
                        <tr key={f.faixa} className="hover:bg-white/5">
                          <td className="py-2 px-3 font-medium text-gray-200">
                            {f.descricaoFaixa}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-300 font-mono">
                            {f.numeroDeGanhadores.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-400 font-mono">
                            {f.valorPremio.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
