import { expect, test } from "@playwright/test";

test("FHIR patient route rejects unauthenticated requests", async ({ request }) => {
  const response = await request.get("/api/fhir/Patient");
  expect(response.status()).toBe(401);
});

test("FHIR condition route rejects unauthenticated requests", async ({ request }) => {
  const response = await request.get("/api/fhir/Condition");
  expect(response.status()).toBe(401);
});
