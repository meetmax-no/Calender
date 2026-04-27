// Typer for runtime-config (lastet fra /public/config.json)

export interface TaskTypeConfig {
  label: string;
  icon: string; // lucide-react ikonnavn
  color: string; // HEX, f.eks. "#EC4899"
  defaultSlot: string;
  active: boolean;
}

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface BackgroundImage {
  url: string;
  /** Valgfri portrettversjon for mobil. Hvis ikke satt brukes `url` med smart crop. */
  urlPortrait?: string;
  name: string;
}

export interface AppConfig {
  version: string;
  updatedAt: string;
  taskTypes: Record<string, TaskTypeConfig>;
  palette: PaletteColor[];
  holidays: Record<string, string>;
  commercialDays: Record<string, string>;
  backgrounds?: BackgroundImage[];
  /**
   * Demo-modus: når true vises et banner og destruktive handlinger sperres
   * (Slett oppgave i TaskModal + Reset DB i Settings).
   * Restore er fortsatt tilgjengelig — salgspersonens "reset til ren demo"-verktøy.
   */
  demoMode?: boolean;
  /**
   * Hvilken ISO-uke i inneværende år appen skal anke til ved oppstart i demo-modus.
   * F.eks. demoAnchorWeek: 18 → demo åpner mandag i uke 18.
   * Brukes kun når demoMode === true.
   */
  demoAnchorWeek?: number;
  /** Default synlighet for nye oppgaver. Hvis ikke satt: "public". */
  defaultVisibility?: "public" | "private";
}

// Statiske UI-strenger (ikke brukerkonfigurerbart)
export const MONTH_NAMES = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

export const WEEKDAY_NAMES_SHORT = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

export const TIME_SLOT_LABELS = ["08-10", "10-12", "12-14", "14-16"] as const;
export type TimeSlot = typeof TIME_SLOT_LABELS[number];

// Fallback-config hvis /config.json ikke er tilgjengelig
export const FALLBACK_CONFIG: AppConfig = {
  version: "fallback",
  updatedAt: "",
  taskTypes: {
    OTHER: {
      label: "Annet",
      icon: "Info",
      color: "#A855F7",
      defaultSlot: "12-14",
      active: true,
    },
  },
  palette: [],
  holidays: {},
  commercialDays: {},
};
