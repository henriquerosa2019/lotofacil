import { JogoRegistrado, RegistroSaque } from "./types";

const KEY_JOGOS = "lotofacil_jogos_registrados";
const KEY_SAQUES = "lotofacil_saques_registrados";

export function getJogosRegistrados(): JogoRegistrado[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_JOGOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
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
