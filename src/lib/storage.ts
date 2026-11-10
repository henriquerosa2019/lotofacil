import { JogoRegistrado, RegistroSaque, HistoricoConsultaConcurso, ConcursoLotofacil } from "./types";
import historicalSeed from "./historical-seed.json";

const KEY_JOGOS = "lotofacil_jogos_registrados";
const KEY_SAQUES = "lotofacil_saques_registrados";
const KEY_HISTORICO_CONSULTAS = "lotofacil_historico_consultas";

// Cria e apura a Teimosinha oficial do usuário iniciada no Concurso 3820
export function criarTeimosinhaPadrao3820(): JogoRegistrado {
  // 15 dezenas equilibradas da Teimosinha
  const dezenasTeimosinha = [1, 2, 3, 5, 6, 11, 12, 13, 14, 15, 16, 21, 22, 23, 24];
  const seedArray = historicalSeed as ConcursoLotofacil[];
  const apuracoes: JogoRegistrado["apuracoes"] = {};
  let totalGanho = 0;

  // Apura os concursos já sorteados da Caixa a partir do 3820 (3820, 3821, 3822, 3823, 3824)
  const concursosParaApurar = seedArray.filter((c) => c.numero >= 3820 && c.numero <= 3843);
  const sortSetUser = new Set(dezenasTeimosinha);

  concursosParaApurar.forEach((conc) => {
    const sortSetConc = new Set(conc.dezenas);
    const acertadas = dezenasTeimosinha.filter((d) => sortSetConc.has(d));
    const acertos = acertadas.length;
    let valorGanho = 0;
    let faixaPremio = "Não premiado";

    if (acertos === 15) {
      const f = conc.listaRateioPremio?.find((r) => r.faixa === 1);
      valorGanho = f?.valorPremio || 2000000.0;
      faixaPremio = "15 ACERTOS (PRÊMIO MÁXIMO!)";
    } else if (acertos === 14) {
      const f = conc.listaRateioPremio?.find((r) => r.faixa === 2);
      valorGanho = f?.valorPremio || 1500.0;
      faixaPremio = "14 Acertos";
    } else if (acertos === 13) {
      valorGanho = 35.0;
      faixaPremio = "13 Acertos";
    } else if (acertos === 12) {
      valorGanho = 14.0;
      faixaPremio = "12 Acertos";
    } else if (acertos === 11) {
      valorGanho = 7.0;
      faixaPremio = "11 Acertos";
    }

    totalGanho += valorGanho;
    apuracoes[conc.numero] = {
      concurso: conc.numero,
      data: conc.dataApuracao,
      dezenasSorteadas: conc.dezenas,
      acertos,
      dezenasAcertadas: acertadas,
      faixaPremio,
      valorGanho,
      apuradoEm: "Oficial Caixa",
    };
  });

  return {
    id: "teimosinha_3820_oficial",
    grupoId: "grupo-1",
    grupoNome: "Minha Teimosinha (Início C.3820)",
    dezenas: dezenasTeimosinha,
    concursoInicial: 3820,
    teimosinhaConcursos: 24,
    concursoFinal: 3843,
    dataAposta: "03/11/2026",
    custoTotal: 24 * 3.50,
    status: "ativo",
    apuracoes,
    totalGanho,
  };
}

export function getJogosRegistrados(): JogoRegistrado[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_JOGOS);
    if (!raw) {
      const jogoPadrao = criarTeimosinhaPadrao3820();
      localStorage.setItem(KEY_JOGOS, JSON.stringify([jogoPadrao]));
      return [jogoPadrao];
    }
    const parsed: JogoRegistrado[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const jogoPadrao = criarTeimosinhaPadrao3820();
      localStorage.setItem(KEY_JOGOS, JSON.stringify([jogoPadrao]));
      return [jogoPadrao];
    }
    return parsed;
  } catch {
    return [criarTeimosinhaPadrao3820()];
  }
}

export function saveJogoRegistrado(jogo: JogoRegistrado): void {
  if (typeof window === "undefined") return;
  const atuais = getJogosRegistrados();
  const index = atuais.findIndex((j) => j.id === jogo.id);
  if (index >= 0) {
    atuais[index] = jogo;
  } else {
    atuais.unshift(jogo);
  }
  localStorage.setItem(KEY_JOGOS, JSON.stringify(atuais));
}

export function deleteJogoRegistrado(id: string): void {
  if (typeof window === "undefined") return;
  const atuais = getJogosRegistrados().filter((j) => j.id !== id);
  localStorage.setItem(KEY_JOGOS, JSON.stringify(atuais));
}

export function undoUltimoJogo(): JogoRegistrado | null {
  if (typeof window === "undefined") return null;
  const atuais = getJogosRegistrados();
  if (atuais.length === 0) return null;
  const removido = atuais.shift();
  localStorage.setItem(KEY_JOGOS, JSON.stringify(atuais));
  return removido || null;
}

export function getSaquesRegistrados(): RegistroSaque[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_SAQUES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSaqueRegistrado(saque: RegistroSaque): void {
  if (typeof window === "undefined") return;
  const atuais = getSaquesRegistrados();
  atuais.unshift(saque);
  localStorage.setItem(KEY_SAQUES, JSON.stringify(atuais));
}

export function deleteSaqueRegistrado(id: string): void {
  if (typeof window === "undefined") return;
  const atuais = getSaquesRegistrados().filter((s) => s.id !== id);
  localStorage.setItem(KEY_SAQUES, JSON.stringify(atuais));
}

// Histórico de Consultas de Concursos (Concurso, Dezenas, Ganhadores, Valores)
export function getHistoricoConsultas(): HistoricoConsultaConcurso[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORICO_CONSULTAS);
    let list: HistoricoConsultaConcurso[] = raw ? JSON.parse(raw) : [];

    // Garante que os concursos recentes (como 3824, 3823, 3822, 3821, 3820) estejam sempre no histórico
    const seedArray = historicalSeed as ConcursoLotofacil[];
    const concursosChave = [3824, 3823, 3822, 3821, 3820];
    let houveInclusao = false;

    concursosChave.forEach((num) => {
      if (!list.some((item) => item.numero === num)) {
        const c = seedArray.find((item) => item.numero === num);
        if (c) {
          const faixa15 = c.listaRateioPremio?.find((f) => f.faixa === 1);
          const totalPremios = (c.listaRateioPremio || []).reduce(
            (acc, f) => acc + (f.numeroDeGanhadores * f.valorPremio),
            0
          );
          const totalGanhadores = (c.listaRateioPremio || []).reduce(
            (acc, f) => acc + f.numeroDeGanhadores,
            0
          );

          list.push({
            numero: c.numero,
            dataApuracao: c.dataApuracao,
            consultadoEm: "Oficial Caixa",
            dezenas: c.dezenas,
            acumulado: c.acumulado,
            ganhadores15: faixa15?.numeroDeGanhadores || 0,
            valor15: faixa15?.valorPremio || 0,
            totalPremiosPagos: totalPremios,
            totalGanhadores: totalGanhadores,
            valorArrecadado: c.valorArrecadado,
            cidadesGanhadores: (c.listaMunicipioUFGanhadores || []).map((m) => ({
              municipio: m.municipio,
              uf: m.uf,
              ganhadores: m.ganhadores,
            })),
            rateioCompleto: (c.listaRateioPremio || []).map((r) => ({
              descricaoFaixa: r.descricaoFaixa,
              faixa: r.faixa,
              numeroDeGanhadores: r.numeroDeGanhadores,
              valorPremio: r.valorPremio,
            })),
          });
          houveInclusao = true;
        }
      }
    });

    // Ordena do maior para o menor concurso
    list.sort((a, b) => b.numero - a.numero);

    if (houveInclusao) {
      localStorage.setItem(KEY_HISTORICO_CONSULTAS, JSON.stringify(list.slice(0, 100)));
    }

    return list;
  } catch {
    return [];
  }
}

export function saveHistoricoConsulta(c: ConcursoLotofacil): void {
  if (typeof window === "undefined" || !c) return;
  const atuais = getHistoricoConsultas();
  const faixa15 = c.listaRateioPremio?.find((f) => f.faixa === 1);

  const totalPremios = (c.listaRateioPremio || []).reduce(
    (acc, f) => acc + (f.numeroDeGanhadores * f.valorPremio),
    0
  );
  const totalGanhadores = (c.listaRateioPremio || []).reduce(
    (acc, f) => acc + f.numeroDeGanhadores,
    0
  );

  const novoRegistro: HistoricoConsultaConcurso = {
    numero: c.numero,
    dataApuracao: c.dataApuracao,
    consultadoEm: new Date().toLocaleString("pt-BR"),
    dezenas: c.dezenas,
    acumulado: c.acumulado,
    ganhadores15: faixa15?.numeroDeGanhadores || 0,
    valor15: faixa15?.valorPremio || 0,
    totalPremiosPagos: totalPremios,
    totalGanhadores: totalGanhadores,
    valorArrecadado: c.valorArrecadado,
    cidadesGanhadores: (c.listaMunicipioUFGanhadores || []).map((m) => ({
      municipio: m.municipio,
      uf: m.uf,
      ganhadores: m.ganhadores,
    })),
    rateioCompleto: (c.listaRateioPremio || []).map((r) => ({
      descricaoFaixa: r.descricaoFaixa,
      faixa: r.faixa,
      numeroDeGanhadores: r.numeroDeGanhadores,
      valorPremio: r.valorPremio,
    })),
  };

  // Se já existe, atualiza; senão, adiciona no topo
  const idx = atuais.findIndex((item) => item.numero === c.numero);
  if (idx >= 0) {
    atuais[idx] = novoRegistro;
  } else {
    atuais.unshift(novoRegistro);
  }

  // Ordena sempre por concurso decrescente
  atuais.sort((a, b) => b.numero - a.numero);

  // Mantém os últimos 100 concursos no histórico local
  const limitados = atuais.slice(0, 100);
  localStorage.setItem(KEY_HISTORICO_CONSULTAS, JSON.stringify(limitados));
}

export function deleteHistoricoConsulta(numero: number): void {
  if (typeof window === "undefined") return;
  const atuais = getHistoricoConsultas().filter((h) => h.numero !== numero);
  localStorage.setItem(KEY_HISTORICO_CONSULTAS, JSON.stringify(atuais));
}

export function clearHistoricoConsultas(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_HISTORICO_CONSULTAS);
}
