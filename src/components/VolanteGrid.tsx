"use client";

import React from "react";
import { MOLDURA, PRIMES } from "@/lib/lotofacil-engine";

interface VolanteGridProps {
  selectedNumbers: number[];
  drawnNumbers?: number[]; // If comparing with a draw
  compact?: boolean;
  interactive?: boolean;
  onToggleNumber?: (num: number) => void;
  showMolduraHighlight?: boolean;
}

export default function VolanteGrid({
  selectedNumbers,
  drawnNumbers,
  compact = false,
  interactive = false,
  onToggleNumber,
  showMolduraHighlight = false,
}: VolanteGridProps) {
  const selectedSet = new Set(selectedNumbers);
  const drawnSet = drawnNumbers ? new Set(drawnNumbers) : null;

  return (
    <div className={`grid grid-cols-5 gap-1.5 ${compact ? "max-w-[220px]" : "max-w-[320px]"}`}>
      {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => {
        const isSelected = selectedSet.has(n);
        const isHit = isSelected && drawnSet && drawnSet.has(n);
        const isDrawnMiss = !isSelected && drawnSet && drawnSet.has(n);
        const isMoldura = MOLDURA.has(n);

        let bgClass = "bg-gray-800/60 text-gray-400 border-gray-700/50";
        if (drawnSet) {
          if (isHit) {
            bgClass = "bg-emerald-600 text-white font-bold border-emerald-400 shadow-md shadow-emerald-500/20";
          } else if (isSelected) {
            bgClass = "bg-purple-950/80 text-purple-300 border-purple-500/40";
          } else if (isDrawnMiss) {
            bgClass = "bg-gray-800/40 text-gray-500 border-dashed border-gray-700";
          }
        } else if (isSelected) {
          bgClass = "bg-gradient-to-tr from-purple-700 to-fuchsia-600 text-white font-bold border-purple-400 shadow-sm shadow-purple-500/30";
        } else if (showMolduraHighlight && isMoldura) {
          bgClass = "bg-gray-800/80 text-gray-300 border-gray-600/80";
        }

        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onToggleNumber && onToggleNumber(n)}
            className={`
              ${compact ? "w-8 h-8 text-[11px]" : "w-11 h-11 text-xs"}
              rounded-lg flex items-center justify-center border transition-all select-none
              ${interactive ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}
              ${bgClass}
            `}
            title={`Dezena ${n.toString().padStart(2, "0")}${
              MOLDURA.has(n) ? " (Moldura)" : " (Centro)"
            }${PRIMES.has(n) ? " - Primo" : ""}`}
          >
            {n.toString().padStart(2, "0")}
          </button>
        );
      })}
    </div>
  );
}
