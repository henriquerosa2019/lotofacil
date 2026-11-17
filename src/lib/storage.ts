import { JogoRegistrado, RegistroSaque, HistoricoConsultaConcurso, ConcursoLotofacil } from "./types";
import historicalSeed from "./historical-seed.json";

const KEY_JOGOS = "lotofacil_jogos_registrados";
const KEY_SAQUES = "lotofacil_saques_registrados";
const KEY_HISTORICO_CONSULTAS = "lotofacil_historico_consultas";

// Cria e apura a Teimosinha oficial do usuário com o GRUPO 2 iniciada no Concurso 3820
export function criarTeimosinhaPadrao3820(): JogoRegistrado {
  // Grupo 02 — Retorno Cíclico & Pressão de Frias (15 dezenas oficiais)
  const dezenasGrupo2 = [1, 3, 4, 6, 7, 9, 11, 13, 14, 16, 18, 22, 23, 24, 25];
  const seedArray = historicalSeed as ConcursoLotofacil[];
  const apuracoes: JogoRegistrado["apuracoes"] = {};
  let totalGanho = 0;

  // Apura os concursos sorteados da Caixa da Teimosinha (3820 a 3843)
  const concursosParaApurar = seedArray.filter((c) => c.numero >= 3820 && c.numero <= 3843);

  concursosParaApurar.forEach((conc) => {
    const dezenasOficiais = (conc.dezenas || (conc as any).listaDezenas || [])
      .map((x: any) => (typeof x === "number" ? x : parseInt(String(x), 10)))
      .filter((n: number) => !isNaN(n));

    const sortSetConc = new Set(dezenasOficiais);
    const acertadas = dezenasGrupo2.filter((d) => sortSetConc.has(d));
    const acertos = acertadas.length;
    let valorGanho = 0;
    let faixaPremio = "Não premiado";

    if (acertos === 15) {
      const f = conc.listaRateioPremio?.find((r) => Number(r.faixa) === 1);
      valorGanho = f?.valorPremio || 2000000.0;
      faixaPremio = "15 ACERTOS (PRÊMIO MÁXIMO!)";
    } else if (acertos === 14) {
      const f = conc.listaRateioPremio?.find((r) => Number(r.faixa) === 2);
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
      dezenasSorteadas: dezenasOficiais,
      acertos,
      dezenasAcertadas: acertadas,
      faixaPremio,
      valorGanho,
      apuradoEm: "Oficial Caixa",
    };
  });

  return {
    id: "teimosinha_3820_oficial",
    grupoId: "grupo-2",
    grupoNome: "Grupo 02 — Retorno Cíclico & Pressão de Frias (Minha Teimosinha C.3820)",
    dezenas: dezenasGrupo2,
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

    // CORREÇÃO E MIGRAÇÃO DEFINITIVA PARA O GRUPO 2:
    // O usuário jogou oficialmente o Grupo 2 na Teimosinha iniciada no Concurso 3820.
    // Qualquer jogo marcado anteriormente como Grupo 3, Grupo 1 ou teimosinha_3820_oficial
    // é corrigido para o Grupo 02 com as 15 dezenas oficiais e apurações recalculadas.
    const dezenasGrupo2 = [1, 3, 4, 6, 7, 9, 11, 13, 14, 16, 18, 22, 23, 24, 25];
    let precisaSalvar = false;

    const novosJogos: JogoRegistrado[] = [];
    const gruposProcessados = new Set<string>();

    for (const j of parsed) {
      const isTeimosinha3820 = j.concursoInicial === 3820 || j.id === "teimosinha_3820_oficial";
      const isGrupoIncorreto = j.grupoId === "grupo-3" || j.grupoId === "grupo-1" || (j.grupoNome && j.grupoNome.includes("Grupo 03"));

      if (isTeimosinha3820 || isGrupoIncorreto) {
        if (!gruposProcessados.has("grupo-2")) {
          const novoPadrao = criarTeimosinhaPadrao3820();
          novosJogos.push({
            ...j,
            id: j.id || "teimosinha_3820_oficial",
            grupoId: "grupo-2",
            grupoNome: "Grupo 02 — Retorno Cíclico & Pressão de Frias (Minha Teimosinha C.3820)",
            dezenas: dezenasGrupo2,
            concursoInicial: 3820,
            concursoFinal: 3843,
            teimosinhaConcursos: 24,
            apuracoes: novoPadrao.apuracoes,
            totalGanho: novoPadrao.totalGanho,
          });
          gruposProcessados.add("grupo-2");
          precisaSalvar = true;
        } else {
          // Descarta duplicatas de grupos antigos
          precisaSalvar = true;
        }
      } else {
        if (!gruposProcessados.has(j.grupoId)) {
          novosJogos.push(j);
          gruposProcessados.add(j.grupoId);
        }
      }
    }

    if (novosJogos.length === 0) {
      const jogoPadrao = criarTeimosinhaPadrao3820();
      novosJogos.push(jogoPadrao);
      precisaSalvar = true;
    }

    if (precisaSalvar) {
      localStorage.setItem(KEY_JOGOS, JSON.stringify(novosJogos));
    }

    return novosJogos;
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

    // Garante que os concursos recentes (como 3831, 3830, 3829, 3828, 3827, 3826, 3825, 3824, 3823, 3822, 3821, 3820) estejam sempre no histórico
    const seedArray = historicalSeed as ConcursoLotofacil[];
    const concursosChave = [3831, 3830, 3829, 3828, 3827, 3826, 3825, 3824, 3823, 3822, 3821, 3820];
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
    origem: c.origem || "Site Oficial da Caixa Econômica Federal",
    urlOficial: c.urlOficial || "https://loterias.caixa.gov.br/Paginas/Lotofacil.aspx",
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

// Reconcilia e apura qualquer concurso faltante (como 3825, 3826) em todos os jogos cadastrados
export function reconciliarJogosComConcursos(concursos: ConcursoLotofacil[]): boolean {
  if (typeof window === "undefined") return false;
  const jogos = getJogosRegistrados();
  let houveModificacao = false;

  const jogosAtualizados = jogos.map((j) => {
    let jogoModificado = false;
    const copiaApuracoes = { ...j.apuracoes };

    concursos.forEach((c) => {
      const dezenasOficiais = (c.dezenas || (c as any).listaDezenas || [])
        .map((x: any) => (typeof x === "number" ? x : parseInt(String(x), 10)))
        .filter((n: number) => !isNaN(n));

      const jogoDezenas = (j.dezenas || [])
        .map((x: any) => (typeof x === "number" ? x : parseInt(String(x), 10)))
        .filter((n: number) => !isNaN(n));

      if (
        c.numero >= j.concursoInicial &&
        c.numero <= j.concursoFinal &&
        dezenasOficiais.length === 15
      ) {
        const sortSetConc = new Set(dezenasOficiais);
        const acertadas = jogoDezenas.filter((d) => sortSetConc.has(d));
        const acertos = acertadas.length;
        let valorGanho = 0;
        let faixaPremio = "Não premiado";

        if (acertos === 15) {
          const f = c.listaRateioPremio?.find((r) => Number(r.faixa) === 1);
          valorGanho = f?.valorPremio || 2000000.0;
          faixaPremio = "15 ACERTOS (PRÊMIO MÁXIMO!)";
        } else if (acertos === 14) {
          const f = c.listaRateioPremio?.find((r) => Number(r.faixa) === 2);
          valorGanho = f?.valorPremio || 1500.0;
          faixaPremio = "14 Acertos";
        } else if (acertos === 13) valorGanho = 35.0;
        else if (acertos === 12) valorGanho = 14.0;
        else if (acertos === 11) valorGanho = 7.0;

        const apExistente = copiaApuracoes[c.numero];
        if (
          !apExistente ||
          apExistente.acertos !== acertos ||
          apExistente.valorGanho !== valorGanho ||
          !apExistente.dezenasSorteadas ||
          apExistente.dezenasSorteadas.length !== 15
        ) {
          copiaApuracoes[c.numero] = {
            concurso: c.numero,
            data: c.dataApuracao,
            dezenasSorteadas: dezenasOficiais,
            acertos,
            dezenasAcertadas: acertadas,
            faixaPremio,
            valorGanho,
            apuradoEm: "Oficial Caixa",
          };
          jogoModificado = true;
        }
      }
    });

    if (jogoModificado) {
      const totalGanho = Object.values(copiaApuracoes).reduce(
        (acc, a) => acc + a.valorGanho,
        0
      );
      houveModificacao = true;
      return {
        ...j,
        apuracoes: copiaApuracoes,
        totalGanho,
      };
    }
    return j;
  });

  if (houveModificacao) {
    localStorage.setItem(KEY_JOGOS, JSON.stringify(jogosAtualizados));
  }
  return houveModificacao;
}

