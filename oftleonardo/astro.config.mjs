// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { EnumChangefreq } from "sitemap";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://oftleonardo.com.br",
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Noto Sans",
      cssVariable: "--font-noto-sans",
      styles: ["normal"],
      weights: [400, 700],
      subsets: ["latin"],
      formats: ["woff2"],
      display: "optional",
      fallbacks: ["sans-serif"],
      options: {
        experimental: {
          glyphs: [
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,;:!?()[]{}+-=*/\"'@#%&_`~|\\<>$^~áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ",
          ],
        },
      },
    },
    {
      provider: fontProviders.local(),
      name: "Sloan Optotype",
      cssVariable: "--font-sloan-optotype",
      weights: [400],
      styles: ["normal"],
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./public/fonts/Sloan.woff2"],
          },
        ],
      },
    },
  ],
  output: "server",
  adapter: vercel({
    imageService: true,
    devImageService: "sharp",
  }),
  compressHTML: true,
  build: {
    inlineStylesheets: "always",
  },
  prefetch: {
    prefetchAll: false,
  },
  image: {
    domains: [],
    remotePatterns: [{ protocol: "https" }],
  },
  integrations: [
    react(),
    sitemap({
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "") || "/";
        const lastmod = new Date().toISOString();

        const pageRules = {
          "/": { changefreq: EnumChangefreq.WEEKLY, priority: 1.0 },
          "/conteudos": { changefreq: EnumChangefreq.WEEKLY, priority: 0.8 },
          "/acuidade-visual": { changefreq: EnumChangefreq.WEEKLY, priority: 1.0 },
          "/tela-de-amsler": { changefreq: EnumChangefreq.WEEKLY, priority: 1.0 },
          "/agendamento-pendente": { changefreq: EnumChangefreq.MONTHLY, priority: 0.5 },
          "/politica-de-privacidade": { changefreq: EnumChangefreq.YEARLY, priority: 0.4 },
          "/termos-de-uso": { changefreq: EnumChangefreq.YEARLY, priority: 0.4 },
        };

        if (pageRules[path]) {
          item.changefreq = pageRules[path].changefreq;
          item.priority = pageRules[path].priority;
        } else if (path.startsWith("/conteudos/")) {
          item.changefreq = EnumChangefreq.MONTHLY;
          item.priority = 0.9;
        }

        item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  vite: {
    build: {
      cssMinify: true,
    },

    plugins: [tailwindcss()],
  },
});
