// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://oftleonardo.com.br",
  experimental: {
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
  },
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
      changefreq: "monthly",
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "") || "/";
        const lastmod = new Date().toISOString();

        const pageRules = {
          "/": { changefreq: "weekly", priority: 1.0 },
          "/conteudos": { changefreq: "weekly", priority: 0.8 },
          "/acuidade-visual": { changefreq: "weekly", priority: 1.0 },
          "/tela-de-amsler": { changefreq: "weekly", priority: 1.0 },
          "/agendamento-pendente": { changefreq: "monthly", priority: 0.5 },
          "/politica-de-privacidade": { changefreq: "yearly", priority: 0.4 },
          "/termos-de-uso": { changefreq: "yearly", priority: 0.4 },
        };

        if (pageRules[path]) {
          item.changefreq = pageRules[path].changefreq;
          item.priority = pageRules[path].priority;
        } else if (path.startsWith("/conteudos/")) {
          item.changefreq = "monthly";
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
      rollupOptions: {
        output: {
          manualChunks: {
            "framer-motion": ["framer-motion"],
            "react-vendor": ["react", "react-dom"],
          },
        },
      },
    },

    plugins: [tailwindcss()],
  },
});
