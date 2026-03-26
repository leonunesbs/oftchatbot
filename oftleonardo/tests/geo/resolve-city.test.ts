import assert from "node:assert/strict";
import test from "node:test";
import { resolveGeoCity } from "../../src/lib/geo/resolve-city.ts";
import { GEO_CITY_COOKIE_NAME } from "../../src/lib/geo/constants.ts";

interface CookieValue {
  value: string;
}

function createCookieStore(initialValue?: string) {
  const store = new Map<string, CookieValue>();
  if (initialValue) {
    store.set(GEO_CITY_COOKIE_NAME, { value: initialValue });
  }

  return {
    get(name: string) {
      return store.get(name);
    },
    set(name: string, value: string) {
      store.set(name, { value });
    },
  };
}

test("returns supported city from cookie without external lookup", async () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("should not be called");
  }) as typeof fetch;

  try {
    const cookies = createCookieStore("fortaleza");
    const city = await resolveGeoCity({
      request: new Request("https://oftleonardo.com.br"),
      cookies: cookies as never,
    });

    assert.equal(city.slug, "fortaleza");
    assert.equal(city.source, "cookie");
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falls back to fortaleza when ip-api is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("network failure");
  }) as typeof fetch;

  try {
    const cookies = createCookieStore();
    const city = await resolveGeoCity({
      request: new Request("https://oftleonardo.com.br", {
        headers: {
          "x-forwarded-for": "203.0.113.25",
        },
      }),
      cookies: cookies as never,
      timeoutMs: 50,
    });

    assert.equal(city.slug, "fortaleza");
    assert.equal(city.source, "fallback");
    assert.equal(cookies.get(GEO_CITY_COOKIE_NAME)?.value, "fortaleza");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maps a valid ip-api city and persists in cookie", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        status: "success",
        city: "Fortuna",
        region: "MA",
        regionName: "Maranhão",
        countryCode: "BR",
      }),
      { status: 200 },
    )) as typeof fetch;

  try {
    const cookies = createCookieStore();
    const city = await resolveGeoCity({
      request: new Request("https://oftleonardo.com.br", {
        headers: {
          "x-forwarded-for": "198.51.100.80",
        },
      }),
      cookies: cookies as never,
      timeoutMs: 200,
    });

    assert.equal(city.slug, "fortuna-ma");
    assert.equal(city.source, "ip-api");
    assert.equal(cookies.get(GEO_CITY_COOKIE_NAME)?.value, "fortuna-ma");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
