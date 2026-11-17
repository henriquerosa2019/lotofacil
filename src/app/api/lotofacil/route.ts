import { NextResponse } from "next/server";
import historicalSeed from "@/lib/historical-seed.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  };

  try {
    // 1. Tenta API oficial da Caixa sem nenhum cache (tempo real)
    const res = await fetch(
      "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/",
      {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data && data.numero) {
        const dezenas = (data.listaDezenas || []).map((d: string) => parseInt(d, 10));
        return NextResponse.json(
          {
            sucesso: true,
            origem: "oficial_caixa",
            consultadoEm: new Date().toISOString(),
            concurso: {
              numero: data.numero,
              dataApuracao: data.dataApuracao,
              dezenas,
              acumulado: data.acumulado ?? false,
              valorArrecadado: data.valorArrecadado ?? 0,
              valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso ?? 0,
              listaRateioPremio: data.listaRateioPremio || [],
              listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores || [],
            },
          },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );
      }
    }
  } catch (err) {
    console.error("Erro ao consultar Caixa, tentando espelho Guidi:", err);
  }

  // 2. Fallback A: Espelho oficial Guidi (rápido e compatível com esquema da Caixa)
  try {
    const resGuidi = await fetch(
      "https://api.guidi.dev.br/loteria/lotofacil/ultimo",
      { headers, cache: "no-store", signal: AbortSignal.timeout(4000) }
    );
    if (resGuidi.ok) {
      const dataG = await resGuidi.json();
      if (dataG && dataG.numero) {
        const dezenas = (dataG.listaDezenas || []).map((d: string) => parseInt(d, 10));
        return NextResponse.json(
          {
            sucesso: true,
            origem: "mirror_guidi",
            consultadoEm: new Date().toISOString(),
            concurso: {
              numero: dataG.numero,
              dataApuracao: dataG.dataApuracao,
              dezenas,
              acumulado: dataG.acumulado ?? false,
              valorArrecadado: dataG.valorArrecadado ?? 0,
              valorEstimadoProximoConcurso: dataG.valorEstimadoProximoConcurso ?? 0,
              listaRateioPremio: dataG.listaRateioPremio || [],
              listaMunicipioUFGanhadores: dataG.listaMunicipioUFGanhadores || [],
            },
          },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );
      }
    }
  } catch (errG) {
    console.error("Erro fallback Guidi:", errG);
  }

  // 3. Fallback B: API pública secundária Heroku
  try {
    const res2 = await fetch(
      "https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest",
      { headers, cache: "no-store", signal: AbortSignal.timeout(4000) }
    );
    if (res2.ok) {
      const d2 = await res2.json();
      return NextResponse.json({
        sucesso: true,
        origem: "fallback_api",
        concurso: {
          numero: d2.concurso || d2.numero,
          dataApuracao: d2.data || d2.dataApuracao,
          dezenas: (d2.dezenas || []).map((d: string) => parseInt(d, 10)),
          listaRateioPremio: (d2.premiacoes || []).map((p: any, idx: number) => ({
            descricaoFaixa: p.descricao,
            faixa: p.faixa || idx + 1,
            numeroDeGanhadores: p.ganhadores,
            valorPremio: p.valorPremio,
          })),
          listaMunicipioUFGanhadores: (d2.localGanhadores || []).map((l: any, i: number) => ({
            ganhadores: l.ganhadores || 1,
            municipio: l.municipio,
            uf: l.uf,
            posicao: i + 1,
          })),
        },
      });
    }
  } catch (err2) {
    console.error("Erro fallback 2:", err2);
  }

  // 3. Fallback: base histórica seed
  const lastSeed = historicalSeed[historicalSeed.length - 1];
  return NextResponse.json({
    sucesso: true,
    origem: "seed_historico",
    concurso: {
      numero: lastSeed.numero,
      dataApuracao: lastSeed.dataApuracao,
      dezenas: lastSeed.dezenas,
      listaRateioPremio: [
        { descricaoFaixa: "15 acertos", faixa: 1, numeroDeGanhadores: 2, valorPremio: 2500000.0 },
        { descricaoFaixa: "14 acertos", faixa: 2, numeroDeGanhadores: 380, valorPremio: 1650.0 },
        { descricaoFaixa: "13 acertos", faixa: 3, numeroDeGanhadores: 14200, valorPremio: 30.0 },
        { descricaoFaixa: "12 acertos", faixa: 4, numeroDeGanhadores: 175000, valorPremio: 12.0 },
        { descricaoFaixa: "11 acertos", faixa: 5, numeroDeGanhadores: 920000, valorPremio: 6.0 },
      ],
      listaMunicipioUFGanhadores: [],
    },
  });
}
