import { describe, expect, it } from "vitest";
import { formatTL, parseTL } from "@/lib/money";
import { canTransition, nextStatus } from "@/lib/status";

describe("para", () => {
  it("Türkçe biçimde gösterir", () => {
    expect(formatTL(123450)).toBe("₺1.234,50");
  });
  it("virgüllü ve noktalı girdileri kuruşa çevirir", () => {
    expect(parseTL("125,50")).toBe(12550);
    expect(parseTL("1.250,5")).toBe(125050);
    expect(parseTL("abc")).toBeNull();
    expect(parseTL("-5")).toBeNull();
  });
});

describe("durum geçişleri", () => {
  it("izin verilen geçişler", () => {
    expect(canTransition("new", "preparing")).toBe(true);
    expect(canTransition("ready", "cancelled")).toBe(false);
    expect(nextStatus("preparing")).toBe("ready");
    expect(nextStatus("served")).toBeNull();
  });
});
