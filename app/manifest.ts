import type { MetadataRoute } from "next";
import { getBranding } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  const branding = getBranding();
  return {
    name: `${branding.name} · ${branding.tagline}`,
    short_name: branding.name,
    description: "Visuell ukeplanlegger for tasks og content",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
