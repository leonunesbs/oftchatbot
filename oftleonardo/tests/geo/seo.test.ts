import assert from "node:assert/strict";
import test from "node:test";
import { buildHomeSeoFromCity } from "../../src/lib/geo/seo.ts";

test("builds dynamic SEO title and description from city", () => {
  const seo = buildHomeSeoFromCity("Fortaleza");

  assert.match(seo.title, /Oftalmologista em Fortaleza/i);
  assert.match(seo.description, /oftalmologista em Fortaleza/i);
});
