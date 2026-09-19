import { describe, expect, it } from "vitest";
import { formatMNT, formatMNTInput, parseMNT } from "@/lib/money";

describe("formatMNT", () => {
  it("мянгатын таслалтай, ₮ тэмдэгтэй", () => {
    expect(formatMNT(1250000)).toBe("1,250,000₮");
    expect(formatMNT(0)).toBe("0₮");
    expect(formatMNT(999)).toBe("999₮");
    expect(formatMNT(-5000)).toBe("-5,000₮");
  });

  it("хоосон утгад зураас", () => {
    expect(formatMNT(null)).toBe("—");
    expect(formatMNT(undefined)).toBe("—");
    expect(formatMNT(Number.NaN)).toBe("—");
  });
});

describe("parseMNT", () => {
  it("янз бүрийн бичлэгийг ойлгоно", () => {
    expect(parseMNT("1,250,000")).toBe(1250000);
    expect(parseMNT("1 250 000₮")).toBe(1250000);
    expect(parseMNT("1.250.000")).toBe(1250000);
    expect(parseMNT(" 80000 ")).toBe(80000);
    expect(parseMNT(80000)).toBe(80000);
  });

  it("буруу утгыг хүлээж авахгүй", () => {
    expect(parseMNT("")).toBeNull();
    expect(parseMNT("abc")).toBeNull();
    expect(parseMNT("-5000")).toBeNull();
    expect(parseMNT(12.5)).toBeNull();
    expect(parseMNT(-1)).toBeNull();
    expect(parseMNT(null)).toBeNull();
  });
});

describe("formatMNTInput", () => {
  it("бичих явцад бүлэглэнэ", () => {
    expect(formatMNTInput("1250000")).toBe("1,250,000");
    expect(formatMNTInput("1,2500")).toBe("12,500");
    expect(formatMNTInput("00150")).toBe("150");
    expect(formatMNTInput("abc")).toBe("");
  });
});
