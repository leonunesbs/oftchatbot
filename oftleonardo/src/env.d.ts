/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    geoCity?: import("./lib/geo/resolve-city").GeoCityResolution;
  }
}

interface Window {
  __oftInitFunnelAnalytics?: () => void;
}
