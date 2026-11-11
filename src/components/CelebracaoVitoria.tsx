"use client";

import React, { useEffect, useState, useRef } from "react";
import { Trophy, Sparkles, X, Volume2, CheckCircle2 } from "lucide-react";

export interface DadosCelebracao {
  acertos: number;
  valorGanho: number;
  concurso: number;
  grupoNome: string;
  dezenasAcertadas?: number[];
}

interface CelebracaoVitoriaProps {
  ativo: boolean;
  onFinalizar: () => void;
  dados?: DadosCelebracao | null;
}

/**
 * Toca sinal sonoro festivo e triunfante por 5 segundos via Web Audio API.
 * Não depende de arquivos externos (evita falhas de rede ou 404).
 */
function tocarAlarmeVitoria5s(): () => void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return () => {};
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const agora = ctx.currentTime;

    // Melodia de vitória em arpeggio triunfante (Dó Maior / Fanfarra alegre)
    const sequenciaNotas = [
      { freq: 523.25, start: 0.0, dur: 0.22 }, // C5
      { freq: 659.25, start: 0.22, dur: 0.22 }, // E5
      { freq: 783.99, start: 0.44, dur: 0.22 }, // G5
      { freq: 1046.50, start: 0.66, dur: 0.60 }, // C6
      // Frase 2 (mais aguda e alegre)
      { freq: 783.99, start: 1.35, dur: 0.18 }, // G5
      { freq: 880.00, start: 1.55, dur: 0.18 }, // A5
      { freq: 987.77, start: 1.75, dur: 0.18 }, // B5
      { freq: 1046.50, start: 1.95, dur: 0.65 }, // C6
      // Frase 3 (fanfarra comemorativa)
      { freq: 1046.50, start: 2.70, dur: 0.20 }, // C6
      { freq: 1174.66, start: 2.92, dur: 0.20 }, // D6
      { freq: 1318.51, start: 3.14, dur: 0.35 }, // E6
      { freq: 1174.66, start: 3.52, dur: 0.20 }, // D6
      { freq: 1318.51, start: 3.75, dur: 1.25 }, // E6 final sustentado até 5s
    ];

    const activeNodes: (AudioNode | OscillatorNode)[] = [];

    // Toca as notas sintetizadas polifônicas
    sequenciaNotas.forEach(({ freq, start, dur }) => {
      const t = agora + start;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, t);

      // Harmônico superior (sino brilhante)
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur);
      osc2.stop(t + dur);

      activeNodes.push(osc1, osc2, gain);
    });

    // Beeps ritmados de celebração (estilo fogos de artifício no fundo)
    for (let i = 0; i < 10; i++) {
      const tPip = agora + 0.5 + i * 0.42;
      if (tPip < agora + 4.8) {
        const oscPip = ctx.createOscillator();
        const gainPip = ctx.createGain();

        oscPip.type = "sine";
        oscPip.frequency.setValueAtTime(1500 + (i % 3) * 350, tPip);

        gainPip.gain.setValueAtTime(0.0001, tPip);
        gainPip.gain.exponentialRampToValueAtTime(0.12, tPip + 0.02);
        gainPip.gain.exponentialRampToValueAtTime(0.0001, tPip + 0.12);

        oscPip.connect(gainPip);
        gainPip.connect(ctx.destination);

        oscPip.start(tPip);
        oscPip.stop(tPip + 0.12);
        activeNodes.push(oscPip, gainPip);
      }
    }

    // Função de cancelamento se o usuário fechar antes
    return () => {
      try {
        ctx.close().catch(() => {});
      } catch {}
    };
  } catch (err) {
    console.warn("Áudio não disponível no navegador:", err);
    return () => {};
  }
}

// Configuração estática dos balões flutuantes para animação fluida
const BALOES_CONFIG = [
  { id: 1, left: "5%", cor: "bg-red-500", delay: "0s", duration: "4.2s", emoji: "🎈", size: "text-4xl" },
  { id: 2, left: "12%", cor: "bg-amber-400", delay: "0.4s", duration: "4.8s", emoji: "🎈", size: "text-5xl" },
  { id: 3, left: "20%", cor: "bg-blue-500", delay: "0.1s", duration: "3.9s", emoji: "🎈", size: "text-3xl" },
  { id: 4, left: "28%", cor: "bg-pink-500", delay: "0.6s", duration: "4.5s", emoji: "🎈", size: "text-4xl" },
  { id: 5, left: "38%", cor: "bg-emerald-400", delay: "0.2s", duration: "4.1s", emoji: "🎈", size: "text-5xl" },
  { id: 6, left: "48%", cor: "bg-purple-500", delay: "0.5s", duration: "4.6s", emoji: "🎈", size: "text-3xl" },
  { id: 7, left: "58%", cor: "bg-yellow-400", delay: "0.1s", duration: "3.8s", emoji: "🎈", size: "text-4xl" },
  { id: 8, left: "68%", cor: "bg-rose-500", delay: "0.3s", duration: "4.4s", emoji: "🎈", size: "text-5xl" },
  { id: 9, left: "78%", cor: "bg-cyan-400", delay: "0.7s", duration: "4.0s", emoji: "🎈", size: "text-3xl" },
  { id: 10, left: "86%", cor: "bg-fuchsia-500", delay: "0.2s", duration: "4.7s", emoji: "🎈", size: "text-4xl" },
  { id: 11, left: "93%", cor: "bg-amber-500", delay: "0.4s", duration: "4.3s", emoji: "🎈", size: "text-5xl" },
];

// Confetes coloridos
const CONFETES_CONFIG = [
  { id: 1, left: "8%", delay: "0.1s", emoji: "🎉" },
  { id: 2, left: "18%", delay: "0.3s", emoji: "✨" },
  { id: 3, left: "25%", delay: "0.5s", emoji: "🎊" },
  { id: 4, left: "35%", delay: "0.2s", emoji: "⭐" },
  { id: 5, left: "45%", delay: "0.4s", emoji: "🌟" },
  { id: 6, left: "55%", delay: "0.1s", emoji: "🎉" },
  { id: 7, left: "65%", delay: "0.6s", emoji: "✨" },
  { id: 8, left: "75%", delay: "0.3s", emoji: "🎊" },
  { id: 9, left: "85%", delay: "0.2s", emoji: "⭐" },
  { id: 10, left: "92%", delay: "0.5s", emoji: "🌟" },
];

export default function CelebracaoVitoria({ ativo, onFinalizar, dados }: CelebracaoVitoriaProps) {
  const [tempoRestante, setTempoRestante] = useState<number>(5);
  const cancelAudioRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ativo) {
      if (cancelAudioRef.current) {
        cancelAudioRef.current();
        cancelAudioRef.current = null;
      }
      return;
    }

    setTempoRestante(5);

    // Inicia som de vitória por 5 segundos
    cancelAudioRef.current = tocarAlarmeVitoria5s();

    // Contador regressivo de 5 a 0
    const intervalTimer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Finaliza automaticamente após exatamente 5 segundos
    const timeoutTimer = setTimeout(() => {
      if (cancelAudioRef.current) {
        cancelAudioRef.current();
        cancelAudioRef.current = null;
      }
      onFinalizar();
    }, 5000);

    return () => {
      clearInterval(intervalTimer);
      clearTimeout(timeoutTimer);
      if (cancelAudioRef.current) {
        cancelAudioRef.current();
        cancelAudioRef.current = null;
      }
    };
  }, [ativo, onFinalizar]);

  if (!ativo) return null;

  const acertos = dados?.acertos || 15;
  const valorGanho = dados?.valorGanho || 0;
  const grupoNome = dados?.grupoNome || "Meu Bilhete da Lotofácil";
  const concurso = dados?.concurso;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* 🎈 BALÕES DE FESTAS FLUTUANDO DE BAIXO PARA CIMA */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {BALOES_CONFIG.map((b) => (
          <div
            key={b.id}
            className="absolute bottom-0 animate-balao-subir flex flex-col items-center"
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          >
            <span className={`${b.size} filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]`}>
              {b.emoji}
            </span>
            <div className="w-[1.5px] h-10 bg-gray-400/60 -mt-1 origin-top animate-corda-balao" />
          </div>
        ))}

        {/* 🎊 CONFETES E ESTRELAS CAINDO */}
        {CONFETES_CONFIG.map((c) => (
          <div
            key={c.id}
            className="absolute top-0 animate-confete-cair text-2xl"
            style={{
              left: c.left,
              animationDelay: c.delay,
              animationDuration: "3.5s",
            }}
          >
            {c.emoji}
          </div>
        ))}
      </div>

      {/* 🏆 CARD CENTRAL PRINCIPAL: EMOJIS, TEXTO UHUUUU GANHAMOS!!!! E DETALHES */}
      <div className="relative z-10 max-w-xl w-full mx-auto text-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1c1836] via-[#12162a] to-[#0f1422] border-2 border-amber-400/80 shadow-[0_0_80px_rgba(250,204,21,0.35)] space-y-5 animate-in zoom-in-95 duration-200">
        {/* Botão de Fechar no Canto Superior */}
        <button
          onClick={onFinalizar}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
          title="Fechar comemoração"
        >
          <X className="w-5 h-5" />
        </button>

        {/* EMOJIS VIBRANTES NO TOPO */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-4xl sm:text-5xl animate-bounce pt-2">
          <span>🥳</span>
          <span>🎈</span>
          <span>🏆</span>
          <span>🍾</span>
          <span>🎈</span>
          <span>🎉</span>
        </div>

        {/* TEXTO EM DESTAQUE: UHUUUU GANHAMOS!!!! */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 drop-shadow-[0_4px_25px_rgba(250,204,21,0.7)] tracking-wide animate-pulse">
            UHUUUU GANHAMOS!!!!
          </h1>
          <p className="text-sm sm:text-base font-bold text-emerald-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>Suas dezenas foram sorteadas pela Caixa!</span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          </p>
        </div>

        {/* DETALHAMENTO DA PREMIAÇÃO */}
        <div className="p-4 rounded-2xl bg-black/50 border border-amber-400/40 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 to-yellow-400 text-black uppercase tracking-wider shadow-md">
              🎯 {acertos} ACERTOS OFICIAIS!
            </span>
            {concurso && (
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-900/60 text-purple-200 border border-purple-500/40">
                Concurso {concurso}
              </span>
            )}
          </div>

          <div className="text-xs text-gray-300">
            Jogo: <strong className="text-white">{grupoNome}</strong>
          </div>

          {valorGanho > 0 && (
            <div className="pt-1">
              <span className="text-[11px] text-gray-400 block font-medium">Prêmio Acumulado na Conta:</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 drop-shadow-[0_2px_10px_rgba(52,211,153,0.5)]">
                + {valorGanho.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          )}
        </div>

        {/* BARRA DE PROGRESSO DO ALARME SONORO (5 SEGUNDOS) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-mono">
            <span className="flex items-center gap-1 text-amber-300">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              Alarme de Vitória tocando...
            </span>
            <span>{tempoRestante}s</span>
          </div>

          {/* Barra Regressiva Animada de 5 segundos */}
          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all ease-linear"
              style={{
                width: `${(tempoRestante / 5) * 100}%`,
                transitionDuration: "1000ms",
              }}
            />
          </div>
        </div>

        {/* BOTÃO PARA FECHAR / CONTINUAR */}
        <div className="pt-2">
          <button
            onClick={onFinalizar}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-900/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Continuar Celebrando</span>
          </button>
        </div>
      </div>

      {/* ESTILOS CSS DE ANIMAÇÃO DOS BALÕES E CONFETES */}
      <style jsx>{`
        @keyframes subirBalao {
          0% {
            transform: translateY(110vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-25vh) rotate(15deg);
            opacity: 0;
          }
        }

        @keyframes oscilarCorda {
          0%, 100% {
            transform: rotate(-6deg);
          }
          50% {
            transform: rotate(6deg);
          }
        }

        @keyframes cairConfete {
          0% {
            transform: translateY(-20vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(115vh) rotate(720deg);
            opacity: 0.2;
          }
        }

        :global(.animate-balao-subir) {
          animation-name: subirBalao;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
        }

        :global(.animate-corda-balao) {
          animation: oscilarCorda 1.5s ease-in-out infinite;
        }

        :global(.animate-confete-cair) {
          animation-name: cairConfete;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
