import assert from "node:assert/strict";
import test from "node:test";
import { mapIpApiCityToSupportedCity } from "../../src/lib/geo/city.ts";
import { extractClientIp, isPublicIp } from "../../src/lib/geo/ip.ts";

test("maps supported cities from ip-api payload", () => {
  assert.equal(
    mapIpApiCityToSupportedCity({
      city: "Fortaleza",
      countryCode: "BR",
    }),
    "fortaleza",
  );

  assert.equal(
    mapIpApiCityToSupportedCity({
      city: "São Domingos do Maranhão",
      countryCode: "BR",
      region: "MA",
    }),
    "sao-domingos-do-maranhao",
  );

  assert.equal(
    mapIpApiCityToSupportedCity({
      city: "Fortuna",
      countryCode: "BR",
      region: "MA",
    }),
    "fortuna-ma",
  );
});

test("does not map unknown or ambiguous cities", () => {
  assert.equal(
    mapIpApiCityToSupportedCity({
      city: "Fortuna",
      countryCode: "BR",
      region: "CE",
    }),
    null,
  );

  assert.equal(
    mapIpApiCityToSupportedCity({
      city: "Teresina",
      countryCode: "BR",
      region: "PI",
    }),
    null,
  );
});

test("extracts first forwarded IP and validates public ranges", () => {
  const request = new Request("https://example.com", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 10.0.0.5",
    },
  });

  assert.equal(extractClientIp(request), "203.0.113.10");
  assert.equal(isPublicIp("203.0.113.10"), true);
  assert.equal(isPublicIp("10.1.2.3"), false);
  assert.equal(isPublicIp("127.0.0.1"), false);
});
