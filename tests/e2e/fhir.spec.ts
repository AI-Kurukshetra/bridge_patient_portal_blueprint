import { expect, test } from "@playwright/test";

test("FHIR patient route rejects unauthenticated requests", async ({ request }) => {
  const response = await request.get("/api/fhir/Patient");
  expect(response.status()).toBe(401);
});

test("FHIR condition route rejects unauthenticated requests", async ({ request }) => {
  const response = await request.get("/api/fhir/Condition");
  expect(response.status()).toBe(401);
});

test("FHIR metadata advertises server capabilities", async ({ request }) => {
  const response = await request.get("/api/fhir/metadata");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.resourceType).toBe("CapabilityStatement");
  expect(body.rest[0]?.resource.some((resource: { type: string }) => resource.type === "Procedure")).toBeTruthy();
});