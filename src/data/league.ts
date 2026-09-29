/**
 * Base do Brasileirão Série A usada para calendário, tabela e simulação
 * imparcial dos jogos que o usuário NÃO joga no eFootball.
 *
 * `strength` é um índice interno do manager (não é dado oficial do eFootball).
 */
export interface LeagueClub {
  name: string;
  short: string;
  strength: number;
}

export const LEAGUE_CLUBS: LeagueClub[] = [
  { name: "Flamengo", short: "FLA", strength: 88 },
  { name: "Palmeiras", short: "PAL", strength: 87 },
  { name: "Cruzeiro", short: "CRU", strength: 82 },
  { name: "Botafogo", short: "BOT", strength: 81 },
  { name: "São Paulo", short: "SAO", strength: 80 },
  { name: "Fluminense", short: "FLU", strength: 79 },
  { name: "Bahia", short: "BAH", strength: 78 },
  { name: "Corinthians", short: "COR", strength: 78 },
  { name: "Atlético-MG", short: "CAM", strength: 77 },
  { name: "Internacional", short: "INT", strength: 76 },
  { name: "Grêmio", short: "GRE", strength: 76 },
  { name: "Mirassol", short: "MIR", strength: 75 },
  { name: "Bragantino", short: "RBB", strength: 74 },
  { name: "Vasco da Gama", short: "VAS", strength: 74 },
  { name: "Ceará", short: "CEA", strength: 72 },
  { name: "Santos", short: "SAN", strength: 72 },
  { name: "Fortaleza", short: "FOR", strength: 71 },
  { name: "Vitória", short: "VIT", strength: 70 },
  { name: "Juventude", short: "JUV", strength: 68 },
  { name: "Sport", short: "SPT", strength: 67 },
];

export const TOTAL_MATCHDAYS = (LEAGUE_CLUBS.length - 1) * 2; // 38

export function slugifyClub(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function clubStrength(name: string): number {
  return LEAGUE_CLUBS.find((c) => c.name === name)?.strength ?? 73;
}
