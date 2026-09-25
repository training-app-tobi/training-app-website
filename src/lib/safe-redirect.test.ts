import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-redirect";

describe("safeNext", () => {
  it("allows same-site paths", () => {
    expect(safeNext("/calendar?month=2026-09")).toBe("/calendar?month=2026-09");
    expect(safeNext("/reset-password")).toBe("/reset-password");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 42])(
    "rejects %s",
    (value) => expect(safeNext(value)).toBe("/dashboard"),
  );
});
