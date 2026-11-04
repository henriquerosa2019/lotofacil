export interface ConcursoLotofacil {
  numero: number;
  dataApuracao: string;
  dezenas: number[];
  acumulado?: boolean;
  valorArrecadado?: number;
  valorEstimadoProximoConcurso?: number;
  listaRateioPremio?: Array<{
    descricaoFaixa: string;
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }>;
  listaMunicipioUFGanhadores?: Array<{
    ganhadores: number;
    municipio: string;
    uf: string;
    posicao: number;
    serie?: string;
    nomeFatansiaUL?: string;
  }>;
}

export interface HistoricoConsultaConcurso {
  numero: number;
  dataApuracao: string;
  consultadoEm: string;
  dezenas: number[];
  acumulado?: boolean;
  ganhadores15: number;
  valor15: number;
  cidadesGanhadores: Array<{
    ganhadores: number;
    municipio: string;
    uf: string;
  }>;
  rateioCompleto: Array<{
    descricaoFaixa: string;
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }>;
}

export interface GrupoDezenas {
  id: string; // ex: "grupo-1", "grupo-2", "grupo-3"
  nome: string;
  descricao: string;
  dezenas: number[];
  score: number; // 0 a 10
  impares: number;
  pares: number;
  primos: number;
  moldura: number;
  centro: number;
  soma: number;
  repetidasUltimo: number;
  maiorSequencia: number;
  maiorSalto: number;
  quentes: number;
  neutras: number;
  frias: number;
  inedito: boolean;
  maxAcertosHistorico: number;
}

export interface JogoRegistrado {
  id: string;
  grupoId: string;
  grupoNome: string;
  dezenas: number[];
  concursoInicial: number;
  teimosinhaConcursos: number; // 1, 3, 6, 12, 18, 24
  concursoFinal: number;
  dataAposta: string;
  custoTotal: number;
  status: "ativo" | "concluido";
  apuracoes: {
    [concurso: number]: {
      concurso: number;
      data: string;
      dezenasSorteadas: number[];
      acertos: number;
      dezenasAcertadas: number[];
      faixaPremio?: string;
      valorGanho: number;
      apuradoEm: string;
    };
  };
  totalGanho: number;
}

export interface RegistroSaque {
  id: string;
  concurso: number;
  data: string;
  valor: number;
  localOuCanal: string;
  observacao?: string;
}

export interface EstatisticasAnalise {
  totalConcursos: number;
  concursoInicial: number;
  concursoFinal: number;
  frequencias: { [dezena: number]: { total: number; percentual: number } };
  quentes: number[]; // >= limiar
  neutras: number[];
  frias: number[];
  distribuicaoParidade: { [padrao: string]: number }; // ex: "8I / 7P": count
  distribuicaoPrimos: { [primos: number]: number };
  distribuicaoMoldura: { [moldura: number]: number };
  distribuicaoSoma: { media: number; min: number; max: number };
  distribuicaoRepetidas: { [rep: number]: number };
  distribuicaoSequencias: { [seq: number]: number };
  distribuicaoGaps: { [gap: number]: number };
}
