import { ConcursoLotofacil } from "./types";
import historicalSeed from "./historical-seed.json";

export interface StatusApuracaoCaixa {
  isDomingo: boolean;
  horarioApuracaoAtivo: boolean;
  concursoHojeApurado: boolean;
  dataHojeStr: string;
  horaAtualStr: string;
  status: "domingo" | "aguardando_sorteio" | "sorteio_em_andamento" | "apurando_caixa" | "apurado_hoje";
  badgeTexto: string;
  badgeClasse: string;
  badgeIcone: "clock" | "spin" | "check" | "alert";
  mensagem: string;
  dicaHorario: string;
}

/**
 * Avalia o status oficial de apuração da Lotofácil da Caixa Econômica Federal:
 * - Sorteios: Segunda a Sábado às 20h00 (horário de Brasília).
 * - Apuração oficial liberada pela Caixa: diariamente a partir das 21h00 (entre 20h45 e 21h30).
 * - Domingos: Não há sorteios da Lotofácil.
 */
export function getStatusApuracaoCaixa(ultimoConcurso: ConcursoLotofacil | null): StatusApuracaoCaixa {
  const agora = new Date();
  const formatador = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const partes = formatador.formatToParts(agora);
  const getP = (tipo: string) => partes.find((p) => p.type === tipo)?.value || "";

  const hora = parseInt(getP("hour"), 10) || 0;
  const minuto = parseInt(getP("minute"), 10) || 0;
  const diaSemana = getP("weekday").toLowerCase();
  const dia = getP("day");
  const mes = getP("month");
  const ano = getP("year");
  const dataHojeStr = `${dia}/${mes}/${ano}`;
  const horaAtualStr = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;

  const isDomingo = diaSemana.includes("domingo");
  const minutosDoDia = hora * 60 + minuto;
  const horarioApuracaoAtivo = !isDomingo && minutosDoDia >= 1245;

  const concursoHojeApurado = Boolean(
    ultimoConcurso &&
      ultimoConcurso.dataApuracao &&
      ultimoConcurso.dataApuracao.trim() === dataHojeStr
  );

  const dicaHorario = "Sorteios da Lotofácil de Seg a Sáb às 20h. Resultado oficial liberado a partir das 21h.";

  if (isDomingo) {
    return {
      isDomingo: true,
      horarioApuracaoAtivo: false,
      concursoHojeApurado: false,
      dataHojeStr,
      horaAtualStr,
      status: "domingo",
      badgeTexto: "Domingo (sem sorteio)",
      badgeClasse: "bg-gray-800/80 text-gray-400 border-gray-700",
      badgeIcone: "clock",
      mensagem: "Hoje é domingo: sem sorteios da Lotofácil Caixa. Próximo sorteio na segunda-feira às 20h.",
      dicaHorario,
    };
  }

  if (concursoHojeApurado) {
    return {
      isDomingo: false,
      horarioApuracaoAtivo: false,
      concursoHojeApurado: true,
      dataHojeStr,
      horaAtualStr,
      status: "apurado_hoje",
      badgeTexto: `✓ C.${ultimoConcurso?.numero} Apurado às 21h`,
      badgeClasse: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      badgeIcone: "check",
      mensagem: `Concurso C.${ultimoConcurso?.numero} de hoje (${dataHojeStr}) apurado oficialmente pela Caixa!`,
      dicaHorario,
    };
  }

  if (horarioApuracaoAtivo) {
    return {
      isDomingo: false,
      horarioApuracaoAtivo: true,
      concursoHojeApurado: false,
      dataHojeStr,
      horaAtualStr,
      status: "apurando_caixa",
      badgeTexto: "🔴 Apuração Caixa em Tempo Real (a partir das 21h)",
      badgeClasse: "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse",
      badgeIcone: "spin",
      mensagem: "Horário de apuração oficial Caixa (a partir das 21h). Sincronizando automaticamente a cada 30s...",
      dicaHorario,
    };
  }

  if (minutosDoDia >= 1200 && minutosDoDia < 1245) {
    return {
      isDomingo: false,
      horarioApuracaoAtivo: true,
      concursoHojeApurado: false,
      dataHojeStr,
      horaAtualStr,
      status: "sorteio_em_andamento",
      badgeTexto: "⏳ Sorteio às 20h • Apuração oficial às 21h",
      badgeClasse: "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse",
      badgeIcone: "clock",
      mensagem: "Sorteio das 20h realizado! Aguardando publicação oficial da Caixa a partir das 21h...",
      dicaHorario,
    };
  }

  return {
    isDomingo: false,
    horarioApuracaoAtivo: false,
    concursoHojeApurado: false,
    dataHojeStr,
    horaAtualStr,
    status: "aguardando_sorteio",
    badgeTexto: "Sorteio hoje às 20h • Apuração às 21h",
    badgeClasse: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    badgeIcone: "clock",
    mensagem: `Próximo sorteio hoje (${dataHojeStr}) às 20h. Apuração oficial liberada a partir das 21h.`,
    dicaHorario,
  };
}

/**
 * Preenche sequencialmente qualquer lacuna de concursos entre o histórico existente
 * e o último concurso retornado pela Caixa, garantindo que NENHUM concurso (como 3825)
 * seja pulado.
 */
export async function preencherLacunasConcursos(
  historicoAtual: ConcursoLotofacil[],
  ultimoConcursoCaixa: ConcursoLotofacil
): Promise<{ novoHistorico: ConcursoLotofacil[]; concursosAdicionados: ConcursoLotofacil[] }> {
  const mapa = new Map<number, ConcursoLotofacil>();

  historicoAtual.forEach((c) => mapa.set(c.numero, c));
  (historicalSeed as ConcursoLotofacil[]).forEach((c) => {
    if (!mapa.has(c.numero)) {
      mapa.set(c.numero, c);
    }
  });
  mapa.set(ultimoConcursoCaixa.numero, ultimoConcursoCaixa);

  const faltantes: number[] = [];
  const minNum = 3820;
  const maxNum = ultimoConcursoCaixa.numero;

  for (let n = minNum; n <= maxNum; n++) {
    if (!mapa.has(n)) {
      faltantes.push(n);
    }
  }

  const adicionados: ConcursoLotofacil[] = [];
  if (faltantes.length > 0) {
    for (const num of faltantes) {
      try {
        const res = await fetch(`/api/lotofacil/${num}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const d = await res.json();
          if (d.sucesso && d.concurso) {
            mapa.set(num, d.concurso);
            adicionados.push(d.concurso);
          }
        }
      } catch (err) {
        console.error(`Erro ao preencher lacuna do concurso ${num}:`, err);
      }
    }
  }

  const novoHistorico = Array.from(mapa.values()).sort((a, b) => a.numero - b.numero);
  return { novoHistorico, concursosAdicionados: adicionados };
}
