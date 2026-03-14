import { describe, expect, it } from "vitest";
import { messageSchema } from "@/lib/validations/message";

describe("message validation", () => {
  it("accepts a valid secure message", () => {
    expect(
      messageSchema.safeParse({
        body: "Please confirm whether I should continue this medication.",
        category: "care_plan",
        subject: "Medication question",
      }).success,
    ).toBe(true);
  });

  it("rejects a message body that is too short", () => {
    expect(
      messageSchema.safeParse({
        body: "Hey",
        category: "general",
        subject: "Quick note",
      }).success,
    ).toBe(false);
  });
});
