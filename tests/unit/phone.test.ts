import { describe, expect, it } from "vitest";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/phone";

describe("normalizePhone", () => {
  it("зай, зураас, улсын кодыг арилгана", () => {
    expect(normalizePhone("99112233")).toBe("99112233");
    expect(normalizePhone("9911-2233")).toBe("99112233");
    expect(normalizePhone(" 9911 2233 ")).toBe("99112233");
    expect(normalizePhone("+976 9911 2233")).toBe("99112233");
    expect(normalizePhone("+97699112233")).toBe("99112233");
    expect(normalizePhone("0097699112233")).toBe("99112233");
    expect(normalizePhone("97699112233")).toBe("99112233");
    expect(normalizePhone("70112233")).toBe("70112233");
  });

  it("8 оронтой биш эсвэл 0-ээр эхэлсэн дугаарыг хүлээж авахгүй", () => {
    expect(normalizePhone("9911223")).toBeNull();
    expect(normalizePhone("991122334")).toBeNull();
    expect(normalizePhone("09112233")).toBeNull();
    expect(normalizePhone("9911a233")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });

  it("isValidPhone", () => {
    expect(isValidPhone("8811 2233")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });
});

describe("formatPhone", () => {
  it("4-4 хэлбэрээр харуулна", () => {
    expect(formatPhone("99112233")).toBe("9911 2233");
    expect(formatPhone(null)).toBe("—");
    expect(formatPhone("123")).toBe("123");
  });
});
