# Lotofácil AI — Estatísticas, IA & Aferição Oficial Caixa 🎯

Aplicativo web completo de análise probabilística, gerador de grupos ranqueados por Inteligência Artificial, simulador financeiro de Teimosinha, aferição de resultados em tempo real via API oficial da Caixa e controle financeiro de saques.

---

## 🚀 Funcionalidades

1. **Análise Probabilística Configurável:**
   - Escolha a janela de análise de **1 a X concursos** (ex: últimos 10, 20, 50, 100, 500 ou todos os 3.760+ concursos).
   - Termômetro em tempo real de dezenas **Quentes**, **Neutras** e **Frias**.
   - Gráficos e tabelas de Paridade (Ímpares/Pares), Primos, Moldura vs. Centro, Somas e Sequências.

2. **Grupos de Elite Ranqueados por IA:**
   - Apresenta os **3 Grupos de Ouro (15 dezenas cada)** calibrados no epicentro das probabilidades matemáticas (Score 10.0 / 10.0).
   - Garantia de **100% de ineditismo** (nenhum dos 3 grupos jamais repetiu 15 pontos na história).
   - Botão para **Apostar / Registrar o Grupo** para monitoramento.

3. **Simulador de Custos & Teimosinha:**
   - Preço oficial da aposta simples: **R$ 3,00**.
   - Simulação instantânea para 1, 2 ou 3 jogos nas janelas oficiais da Teimosinha (**1, 3, 6, 12, 18 e 24 concursos**).
   - Projeção de amortização e custo total.

4. **Aferição Oficial em Tempo Real (API Caixa):**
   - Conecta ao servidor oficial da Caixa Econômica Federal (`servicebus2.caixa.gov.br`).
   - Compara as 15 dezenas dos seus jogos registrados com os resultados reais sorteados.
   - Aponta a quantidade de acertos (11 a 15), destaca em verde as dezenas que saíram e calcula automaticamente o valor ganho em Reais somando ao saldo.

5. **Detalhamento Oficial de Ganhadores de 15 Pontos:**
   - Quantidade de apostas ganhadoras de 15 pontos.
   - Cidades e Estados (UF) dos ganhadores da faixa máxima.
   - Prêmio pago por ganhador e rateio de todas as outras faixas (14, 13, 12 e 11 acertos).

6. **Gestão Financeira & Controle de Saques:**
   - Total Investido vs. Total Premiado vs. Lucro Líquido (ROI).
   - Registro de saques de prêmios por concurso (data, valor sacado e local do resgate).

---

## 💻 Como Rodar Localmente

1. Abra o terminal na pasta do projeto:
   ```bash
   cd "c:\PROJETOS IA\lotofacil"
   ```
2. Instale as dependências (já instaladas):
   ```bash
   npm install
   ```
3. Inicie o servidor local:
   ```bash
   npm run dev
   ```
4. Acesse no navegador:
   `http://localhost:3000`

> Ou dê um duplo clique no arquivo `iniciar_lotofacil.bat`.

---

## ☁️ Como Publicar no Vercel (Passo a Passo)

### Opção 1: Pelo GitHub (Recomendado)
1. Crie um repositório no seu GitHub chamado `lotofacil`.
2. No terminal do projeto, envie os arquivos:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — Lotofacil AI App"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/lotofacil.git
   git push -u origin main
   ```
3. Acesse [vercel.com](https://vercel.com) e faça login.
4. Clique em **"Add New..."** → **"Project"**.
5. Importe o repositório `lotofacil`.
6. O Vercel detectará automaticamente o framework **Next.js**. Clique em **"Deploy"**.
7. Pronto! Em menos de 1 minuto seu app estará no ar com HTTPS gratuito (ex: `https://lotofacil.vercel.app`).

### Opção 2: Pela CLI do Vercel
```bash
npx vercel
```
Siga as instruções na tela e confirme a publicação.
