// Henter branding-tekst fra Vercel env-vars med fornuftige defaults.
// Brukes i header, layout-tittel og footer.
//
// Env-vars:
//   NEXT_PUBLIC_BRAND_NAME    — appens navn (f.eks. "KoDo Planner")
//   NEXT_PUBLIC_BRAND_TAGLINE — under-tekst (f.eks. "Me & Max")

export interface Branding {
  name: string;
  tagline: string;
  version: string;
}

export const APP_VERSION = "v2.1";

export function getBranding(): Branding {
  return {
    name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "KoDo Planner",
    tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() || "Me & Max",
    version: APP_VERSION,
  };
}
