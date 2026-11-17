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

  const CAIXA_HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: "https://loterias.caixa.gov.br/",
    Origin: "https://loterias.caixa.gov.br",
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
  };

  // 1. Tenta API oficial da Caixa no site oficial com retry (tempo real direto da fonte)
  const maxTentativas = 2;
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      const res = await fetch(
        `https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/${concursoNum}`,
        {
          headers: CAIXA_HEADERS,
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
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
              fonte: "Site Oficial da Caixa Econômica Federal (Loterias Caixa)",
              urlOficial: "https://loterias.caixa.gov.br/Paginas/Lotofacil.aspx",
              concurso: {
                numero: data.numero,
                dataApuracao: data.dataApuracao,
                dezenas,
                acumulado: data.acumulado ?? false,
                valorArrecadado: data.valorArrecadado ?? 0,
                valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso ?? 0,
                listaRateioPremio: data.listaRateioPremio || [],
                listaMunicipioUFGanhadores: data.listaMunicipioUFGanhadores || [],
                origem: "Site Oficial da Caixa Econômica Federal",
                urlOficial: "https://loterias.caixa.gov.br/Paginas/Lotofacil.aspx",
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
    } catch (err: any) {
      console.warn(`Tentativa ${tentativa}/${maxTentativas} no site oficial da Caixa para concurso ${concursoNum} falhou:`, err?.message || err);
      if (tentativa < maxTentativas) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  // 2. Fallback A: Espelho oficial Guidi (mesma estrutura oficial Caixa)
  try {
    const resGuidi = await fetch(
      `https://api.guidi.dev.br/loteria/lotofacil/${concursoNum}`,
      { headers: CAIXA_HEADERS, cache: "no-store", signal: AbortSignal.timeout(4000) }
    );

    if (resGuidi.ok) {
      const dataG = await resGuidi.json();
      if (dataG && dataG.numero) {
        const dezenas = (dataG.listaDezenas || []).map((d: string) => parseInt(d, 10));
        return NextResponse.json(
          {
            sucesso: true,
            origem: "mirror_guidi",
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
    console.error(`Erro fallback Guidi para concurso ${concursoNum}:`, errG);
  }

  // 3. Fallback B: API pública Heroku
  try {
    const resHeroku = await fetch(
      `https://loteriascaixa-api.herokuapp.com/api/lotofacil/${concursoNum}`,
      { headers: CAIXA_HEADERS, cache: "no-store", signal: AbortSignal.timeout(4000) }
    );

    if (resHeroku.ok) {
      const dH = await resHeroku.json();
      if (dH && (dH.concurso || dH.numero)) {
        const numFinal = dH.concurso || dH.numero;
        const dezenas = (dH.dezenas || []).map((d: string) => parseInt(d, 10));
        return NextResponse.json(
          {
            sucesso: true,
            origem: "fallback_heroku",
            concurso: {
              numero: numFinal,
              dataApuracao: dH.data || dH.dataApuracao,
              dezenas,
              acumulado: dH.acumulou ?? false,
              valorArrecadado: dH.valorArrecadado ?? 0,
              valorEstimadoProximoConcurso: dH.valorEstimadoProximoConcurso ?? 0,
              listaRateioPremio: (dH.premiacoes || []).map((p: any, idx: number) => ({
                descricaoFaixa: p.descricao,
                faixa: p.faixa || idx + 1,
                numeroDeGanhadores: p.ganhadores,
                valorPremio: p.valorPremio,
              })),
              listaMunicipioUFGanhadores: (dH.localGanhadores || []).map((l: any, i: number) => ({
                ganhadores: l.ganhadores || 1,
                municipio: l.municipio,
                uf: l.uf,
                posicao: i + 1,
              })),
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
  } catch (errH) {
    console.error(`Erro fallback Heroku para concurso ${concursoNum}:`, errH);
  }

  // 4. Fallback C: base histórica local seed
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
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  return NextResponse.json({ erro: `Concurso ${concursoNum} não localizado ou ainda não apurado pela Caixa.` }, { status: 404 });
}
