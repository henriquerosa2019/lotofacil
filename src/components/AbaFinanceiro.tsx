"use client";

import React, { useState } from "react";
import { JogoRegistrado, RegistroSaque } from "@/lib/types";
import { saveSaqueRegistrado, deleteSaqueRegistrado } from "@/lib/storage";
import {
  Wallet,
  ArrowDownCircle,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Building,
  CheckCircle2,
} from "lucide-react";

interface AbaFinanceiroProps {
  jogos: JogoRegistrado[];
  saques: RegistroSaque[];
  onAtualizarSaques: () => void;
}

export default function AbaFinanceiro({
  jogos,
  saques,
  onAtualizarSaques,
}: AbaFinanceiroProps) {
  const [concursoInput, setConcursoInput] = useState<string>("");
  const [valorInput, setValorInput] = useState<string>("");
  const [localInput, setLocalInput] = useState<string>("Casa Lotérica");
  const [obsInput, setObsInput] = useState<string>("");
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  // Cálculos financeiros
  const totalInvestido = jogos.reduce((acc, j) => acc + j.custoTotal, 0);
  const totalGanho = jogos.reduce((acc, j) => acc + j.totalGanho, 0);
  const saldoLiquido = totalGanho - totalInvestido;

  const totalSacado = saques.reduce((acc, s) => acc + s.valor, 0);
  const saldoDisponivelSaque = Math.max(0, totalGanho - totalSacado);

  const handleCadastrarSaque = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(valorInput.replace(",", "."));
    const concurso = parseInt(concursoInput, 10);

    if (isNaN(valor) || valor <= 0) {
      alert("Por favor, informe um valor de saque válido.");
      return;
    }
    if (isNaN(concurso) || concurso <= 0) {
      alert("Por favor, informe o número do concurso.");
      return;
    }

    const novoSaque: RegistroSaque = {
      id: `saque_${Date.now()}`,
      concurso,
      data: new Date().toLocaleDateString("pt-BR"),
      valor,
      localOuCanal: localInput,
      observacao: obsInput.trim() || undefined,
    };

    saveSaqueRegistrado(novoSaque);
    onAtualizarSaques();

    setConcursoInput("");
    setValorInput("");
    setObsInput("");
    setSucessoMsg(
      `Saque de ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} do Concurso ${concurso} registrado com sucesso!`
    );
    setTimeout(() => setSucessoMsg(null), 5000);
  };

  const handleExcluirSaque = (id: string) => {
    if (confirm("Deseja remover este registro de saque?")) {
      deleteSaqueRegistrado(id);
      onAtualizarSaques();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 md:p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-2">
        <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          Gestão Financeira & Controle de Saques
        </h2>
        <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
          Acompanhe o balanço de caixa consolidado de suas apostas, total de prêmios auferidos pela Caixa e registre os saques e resgates efetuados por concurso.
        </p>
      </div>

      {sucessoMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 block flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Total Investido
          </span>
          <div className="text-xl md:text-2xl font-bold text-white font-mono">
            {totalInvestido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <span className="text-[10px] text-gray-500">Soma de todas as apostas</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Premiado
          </span>
          <div className="text-xl md:text-2xl font-bold text-emerald-400 font-mono">
            {totalGanho.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <span className="text-[10px] text-gray-500">Prêmios apurados pela Caixa</span>
        </div>

        <div className="p-4 rounded-xl bg-[#121827] border border-gray-800 space-y-1">
          <span className="text-xs text-gray-400 block flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-purple-400" /> Saldo Líquido (ROI)
          </span>
          <div
            className={`text-xl md:text-2xl font-bold font-mono ${
              saldoLiquido >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {saldoLiquido >= 0 ? "+" : ""}
            {saldoLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <span className="text-[10px] text-gray-500">Retorno sobre o capital</span>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-[#121827] border border-emerald-500/30 space-y-1">
          <span className="text-xs text-emerald-300 block flex items-center gap-1 font-semibold">
            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" /> Saldo a Resgatar
          </span>
          <div className="text-xl md:text-2xl font-bold text-emerald-300 font-mono">
            {saldoDisponivelSaque.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>
          <span className="text-[10px] text-gray-400">Total Ganho menos Saques feitos</span>
        </div>
      </div>

      {/* Formulário de Registro de Saque e Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Registrar Saque de Prêmio
          </h3>
          <p className="text-xs text-gray-400">
            Quando você resgatar um prêmio na lotérica ou pelo app da Caixa, registre aqui para manter seu saldo atualizado.
          </p>

          <form onSubmit={handleCadastrarSaque} className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Número do Concurso Premiado:</label>
              <input
                type="number"
                required
                placeholder="Ex: 3820"
                value={concursoInput}
                onChange={(e) => setConcursoInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Valor Sacado (R$):</label>
              <input
                type="text"
                required
                placeholder="Ex: 30,00"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Local / Canal do Saque:</label>
              <select
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs outline-none focus:border-purple-500"
              >
                <option value="Casa Lotérica">Casa Lotérica</option>
                <option value="Agência Caixa">Agência Caixa</option>
                <option value="Conta Caixa / App Loterias">Conta Caixa / App Loterias</option>
                <option value="Mercado Pago / PIX">Mercado Pago / PIX</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Observações (opcional):</label>
              <input
                type="text"
                placeholder="Ex: Resgate de 13 acertos do Grupo 01"
                value={obsInput}
                onChange={(e) => setObsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Registro de Saque
            </button>
          </form>
        </div>

        {/* Lista de Saques Realizados */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#121827] border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-400" />
              Histórico de Saques e Resgates Realizados ({saques.length})
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Total Sacado: {totalSacado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          {saques.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-gray-900/40 border border-gray-800 text-xs text-gray-500">
              Nenhum saque registrado ainda. Conforme for resgatando seus prêmios nas lotéricas ou agências, use o formulário ao lado para registrar.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900 text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">Concurso</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Local / Canal</th>
                    <th className="py-2.5 px-3">Observações</th>
                    <th className="py-2.5 px-3 text-right">Valor Sacado</th>
                    <th className="py-2.5 px-2 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-950/40">
                  {saques.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5">
                      <td className="py-2.5 px-3 font-bold text-white font-mono">
                        Concurso {s.concurso}
                      </td>
                      <td className="py-2.5 px-3 text-gray-400">{s.data}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-medium">
                        {s.localOuCanal}
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 italic">
                        {s.observacao || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                        {s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleExcluirSaque(s.id)}
                          className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors"
                          title="Excluir saque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
