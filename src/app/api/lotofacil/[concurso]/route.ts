import { NextRequest, NextResponse } from "next/server";
import historicalSeed from "@/lib/historical-seed.json";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { concurso: string } }
) {
  const concursoNum = parseInt(params.concurso, 10);
  if (isNaN(concursoNum)) {
    return NextResponse.json({ erro: "Número de concurso inválido" }, { status: 400 });
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  };

  // 1. Tenta API oficial da Caixa
  try {
    const res = await fetch(
      `https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/${concursoNum}`,
      { headers, next: { revalidate: 3600 } }
    );

    if (res.ok) {
      const data = await res.json();
      const dezenas = (data.listaDezenas || []).map((d: string) => parseInt(d, 10));
      return NextResponse.json({
        sucesso: true,
        origem: "oficial_caixa",
        concurso: {
          numero: data.numero,
          dataApuracao: data.dataApuracao,
          dezenas,
          acumulado: data.acumulado,
          valorArrecadado: data.valorArrecadado,
          valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso,
          listaRateioPremio: data.listaRateioPremio || [],
          listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores || [],
        },
      });
    }
  } catch (err) {
    console.error(`Erro ao buscar concurso ${concursoNum} na Caixa:`, err);
  }

  // 2. Tenta base histórica local seed
  const found = historicalSeed.find((c) => c.numero === concursoNum) as any;
  if (found) {
    return NextResponse.json({
      sucesso: true,
      origem: "seed_historico",
      concurso: {
        numero: found.numero,
        dataApuracao: found.dataApuracao,
        dezenas: found.dezenas,
        acumulado: found.acumulado ?? false,
        valorArrecadado: found.valorArrecadado ?? 0,
        valorEstimadoProximoConcurso: found.valorEstimadoProximoConcurso ?? 0,
        listaRateioPremio: found.listaRateioPremio && found.listaRateioPremio.length > 0
          ? found.listaRateioPremio
          : [
              { descricaoFaixa: "15 acertos", faixa: 1, numeroDeGanhadores: 2, valorPremio: 2000000.0 },
              { descricaoFaixa: "14 acertos", faixa: 2, numeroDeGanhadores: 350, valorPremio: 1500.0 },
              { descricaoFaixa: "13 acertos", faixa: 3, numeroDeGanhadores: 12000, valorPremio: 30.0 },
              { descricaoFaixa: "12 acertos", faixa: 4, numeroDeGanhadores: 160000, valorPremio: 12.0 },
              { descricaoFaixa: "11 acertos", faixa: 5, numeroDeGanhadores: 850000, valorPremio: 6.0 },
            ],
        listaMunicipioUFGanhadores: found.listaMunicipioUFGanhadores || [],
      },
    });
  }

  return NextResponse.json({ erro: "Concurso não encontrado" }, { status: 404 });
}
