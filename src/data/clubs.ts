export type ClubSlug =
  | "palmeiras"
  | "flamengo"
  | "corinthians"
  | "vasco"
  | "fluminense"
  | "cruzeiro"
  | "gremio"
  | "santos"
  | "internacional"
  | "real-madrid"
  | "barcelona"
  | "chelsea";

export interface ClubInfo {
  slug: ClubSlug;
  name: string;
  shortName: string;
  country: string;
  flag: string;
  badge: string;
  league: string;
  primary: string;
  secondary: string;
  rivals: string[];
  budgetEur: number;
}

const BR_RIVALS = [
  "Palmeiras", "Flamengo", "Corinthians", "Vasco", "Fluminense", "Cruzeiro",
  "São Paulo", "Santos", "Botafogo", "Atlético-MG", "Internacional",
  "Grêmio", "Bahia", "Fortaleza", "Athletico-PR", "Bragantino",
];

const rivalsExcept = (self: string) => BR_RIVALS.filter((r) => r !== self);

export const CLUBS: Record<ClubSlug, ClubInfo> = {
  palmeiras: {
    slug: "palmeiras",
    name: "Palmeiras",
    shortName: "PAL",
    country: "Brasil",
    flag: "🇧🇷",
    badge: "🌴",
    league: "Brasileirão",
    primary: "#006437",
    secondary: "#ffffff",
    rivals: rivalsExcept("Palmeiras"),
    budgetEur: 80_000_000,
  },
  flamengo: {
    slug: "flamengo",
    name: "Flamengo",
    shortName: "FLA",
    country: "Brasil",
    flag: "🇧🇷",
    badge: "🦅",
    league: "Brasileirão",
    primary: "#d40000",
    secondary: "#000000",
    rivals: rivalsExcept("Flamengo"),
    budgetEur: 90_000_000,
  },
  corinthians: {
    slug: "corinthians",
    name: "Corinthians",
    shortName: "COR",
    country: "Brasil",
    flag: "🇧🇷",
    badge: "⚫",
    league: "Brasileirão",
    primary: "#000000",
    secondary: "#ffffff",
    rivals: rivalsExcept("Corinthians"),
    budgetEur: 70_000_000,
  },
  vasco: {
    slug: "vasco",
    name: "Vasco da Gama",
    shortName: "VAS",
    country: "Brasil",
    flag: "🇧🇷",
    badge: "⚓",
    league: "Brasileirão",
    primary: "#000000",
    secondary: "#ffffff",
    rivals: rivalsExcept("Vasco"),
    budgetEur: 55_000_000,
  },
  fluminense: {
    slug: "fluminense",
    name: "Fluminense",
    shortName: "FLU",
    country: "Brasil",
    flag: "🇧🇷",
    badge: "🟢",
    league: "Brasileirão",
    primary: "#7a0019",
    secondary: "#006437",
    rivals: rivalsExcept("Fluminense"),
    budgetEur: 60_000_000,
  },
  cruzeiro: {
    slug: "cruzeiro",
    name: "Cruzeiro",
    shortName: "CRU",
    country: "Brasil",
    flag: "🇧🇷",
    badge: "✝️",
    league: "Brasileirão",
    primary: "#003da5",
    secondary: "#ffffff",
    rivals: rivalsExcept("Cruzeiro"),
    budgetEur: 65_000_000,
  },
  gremio: { slug: "gremio", name: "Grêmio", shortName: "GRE", country: "Brasil", flag: "🇧🇷", badge: "🔵", league: "Brasileirão", primary: "#0b4ea2", secondary: "#000000", rivals: rivalsExcept("Grêmio"), budgetEur: 35_000_000 },
  santos: { slug: "santos", name: "Santos", shortName: "SAN", country: "Brasil", flag: "🇧🇷", badge: "⚪", league: "Brasileirão", primary: "#ffffff", secondary: "#000000", rivals: rivalsExcept("Santos"), budgetEur: 30_000_000 },
  internacional: { slug: "internacional", name: "Internacional", shortName: "INT", country: "Brasil", flag: "🇧🇷", badge: "🔴", league: "Brasileirão", primary: "#d50000", secondary: "#ffffff", rivals: rivalsExcept("Internacional"), budgetEur: 35_000_000 },
  "real-madrid": { slug: "real-madrid", name: "Real Madrid", shortName: "RMA", country: "Espanha", flag: "🇪🇸", badge: "👑", league: "LaLiga", primary: "#ffffff", secondary: "#1a2a6c", rivals: ["Barcelona", "Chelsea"], budgetEur: 150_000_000 },
  barcelona: { slug: "barcelona", name: "Barcelona", shortName: "BAR", country: "Espanha", flag: "🇪🇸", badge: "🔵🔴", league: "LaLiga", primary: "#004d98", secondary: "#a50044", rivals: ["Real Madrid", "Chelsea"], budgetEur: 120_000_000 },
  chelsea: { slug: "chelsea", name: "Chelsea", shortName: "CHE", country: "Inglaterra", flag: "🏴", badge: "🔵", league: "Premier League", primary: "#034694", secondary: "#ffffff", rivals: ["Real Madrid", "Barcelona"], budgetEur: 130_000_000 },
};

export const CLUB_LIST = Object.values(CLUBS);
