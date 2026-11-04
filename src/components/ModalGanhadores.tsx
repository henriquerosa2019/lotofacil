"use client";

import React from "react";
import { X, Trophy, MapPin, Users, DollarSign, Calendar } from "lucide-react";
import { ConcursoLotofacil } from "@/lib/types";

interface ModalGanhadoresProps {
  concurso: ConcursoLotofacil | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalGanhadores({
  concurso,
  isOpen,
  onClose,
}: ModalGanhadoresProps) {
  if (!isOpen || !concurso) return null;

  const faixa15 = concurso.listaRateioPremio?.find((f) => f.faixa === 1);
  const ganhadores15 = faixa15?.numeroDeGanhadores || 0;
  const valor15 = faixa15?.valorPremio || 0;

  const cidades = concurso.listaMunicipioUFGanhadores || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121827] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-950/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Resultado Oficial — Concurso {concurso.numero}
              </h3>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                Data de Apuração: {concurso.dataApuracao}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5">
          {/* Dezenas Sorteadas */}
          <div>
            <span className="text-xs text-gray-400 block mb-2 font-medium">
              Dezenas Sorteadas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {concurso.dezenas.map((d) => (
                <span
                  key={d}
                  className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center"
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
                  {(concurso.listaRateioPremio || []).map((f) => (
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
        </div>
      </div>
    </div>
  );
}
