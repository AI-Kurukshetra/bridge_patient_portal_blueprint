import { describe, expect, it } from "vitest";
import { documentSchema, documentUploadSchema } from "@/lib/validations/document";

describe("document validation", () => {
  it("accepts valid persisted document metadata", () => {
    expect(
      documentSchema.safeParse({
        category: "lab_report",
        fileSize: 1024,
        mimeType: "application/pdf",
        storagePath: "user-1/report.pdf",
        title: "Lab report",
      }).success,
    ).toBe(true);
  });

  it("accepts a valid upload payload", () => {
    const file = new File(["demo"], "report.pdf", { type: "application/pdf" });
    expect(
      documentUploadSchema.safeParse({
        category: "lab_report",
        file,
        title: "Lab report",
      }).success,
    ).toBe(true);
  });

  it("rejects uploads over 10MB", () => {
    const file = new File([new Uint8Array(10_000_001)], "huge.pdf", { type: "application/pdf" });
    expect(
      documentUploadSchema.safeParse({
        category: "lab_report",
        file,
        title: "Large upload",
      }).success,
    ).toBe(false);
  });
});
