export type FormationId = "4-3-3" | "4-2-3-1" | "4-4-2" | "3-5-2" | "3-4-3" | "5-3-2";

export interface PitchPoint {
  x: number;
  y: number;
}

export interface SavedLineupScheme {
  id: string;
  name: string;
  formation: FormationId;
  starters: string[];
  positions: Record<string, PitchPoint>;
  roles: Record<string, string>;
  savedAt: string;
}

export interface SavedLineup {
  matchday: number;
  starters: string[];
  bench: string[];
  subs: { outId: string; inId: string; minute: number }[];
  opponent: string;
  home: boolean;
  captainId?: string;
  // Optional so existing careers and lineups saved by older versions remain compatible.
  formation?: FormationId;
  positions?: Record<string, PitchPoint>;
  roles?: Record<string, string>;
}

const key = (careerId: string) => "lineup:" + careerId;
const schemesKey = (careerId: string) => "lineup-schemes:" + careerId;

export function saveLineup(careerId: string, lineup: SavedLineup) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(careerId), JSON.stringify(lineup));
  } catch {
    // Local storage may be unavailable or full. Keep the game usable.
  }
}

export function loadLineup(careerId: string): SavedLineup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(careerId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SavedLineup>;
    if (!Array.isArray(value.starters) || !Array.isArray(value.bench)) return null;
    return {
      matchday: Number(value.matchday ?? 1),
      starters: value.starters.filter((id): id is string => typeof id === "string"),
      bench: value.bench.filter((id): id is string => typeof id === "string"),
      subs: Array.isArray(value.subs) ? value.subs : [],
      opponent: typeof value.opponent === "string" ? value.opponent : "",
      home: value.home !== false,
      captainId: typeof value.captainId === "string" ? value.captainId : undefined,
      formation: value.formation,
      positions: value.positions && typeof value.positions === "object" ? value.positions : undefined,
      roles: value.roles && typeof value.roles === "object" ? value.roles : undefined,
    };
  } catch {
    return null;
  }
}

export function loadLineupSchemes(careerId: string): SavedLineupScheme[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(schemesKey(careerId));
    if (!raw) return [];
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SavedLineupScheme => {
      return Boolean(
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.formation === "string" &&
        Array.isArray(item.starters) &&
        item.positions &&
        typeof item.positions === "object" &&
        item.roles &&
        typeof item.roles === "object",
      );
    });
  } catch {
    return [];
  }
}

export function saveLineupScheme(
  careerId: string,
  scheme: Omit<SavedLineupScheme, "id" | "savedAt">,
): SavedLineupScheme[] {
  const entry: SavedLineupScheme = {
    ...scheme,
    id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
    savedAt: new Date().toISOString(),
  };
  const current = loadLineupSchemes(careerId);
  const next = [entry, ...current.filter((item) => item.name.toLocaleLowerCase() !== entry.name.toLocaleLowerCase())].slice(0, 12);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(schemesKey(careerId), JSON.stringify(next));
    } catch {
      // Keep the page usable even if the browser blocks local storage.
    }
  }
  return next;
}

export function clearLineup(careerId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(careerId));
  } catch {
    // Ignore storage failures.
  }
}
