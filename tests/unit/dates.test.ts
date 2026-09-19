import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  addMonthsISO,
  diffDaysISO,
  formatDate,
  formatDateTime,
  isISODate,
  monthRangeISO,
  todayUB,
} from "@/lib/dates";

describe("todayUB", () => {
  it("Улаанбаатарын цагаар (UTC+8) өдрийг тооцно", () => {
    // UTC 15:59 = УБ 23:59 → мөн өдөр
    expect(todayUB(new Date("2026-09-19T15:59:00Z"))).toBe("2026-09-19");
    // UTC 16:00 = УБ 00:00 → маргааш
    expect(todayUB(new Date("2026-09-19T16:00:00Z"))).toBe("2026-09-20");
    // UTC шөнө дунд = УБ 08:00
    expect(todayUB(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
});

describe("formatDate", () => {
  it("огнооны мөрийг цагийн бүсгүйгээр форматлана", () => {
    expect(formatDate("2026-09-19")).toBe("2026.09.19");
    expect(formatDate("2026-01-01")).toBe("2026.01.01");
  });

  it("timestamp-ийг Улаанбаатарын цагаар форматлана", () => {
    expect(formatDate("2026-09-18T20:00:00Z")).toBe("2026.09.19");
    expect(formatDate(new Date("2026-09-19T15:59:59Z"))).toBe("2026.09.19");
  });

  it("хоосон ба буруу утга", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("not a date")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("огноо ба цаг", () => {
    expect(formatDateTime("2026-09-19T06:05:00Z")).toBe("2026.09.19 14:05");
    expect(formatDateTime("2026-09-19T16:30:00Z")).toBe("2026.09.20 00:30");
  });
});

describe("огнооны тооцоо", () => {
  it("isISODate хүчинтэй огноог шалгана", () => {
    expect(isISODate("2026-09-19")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2028-02-29")).toBe(true);
    expect(isISODate("2027-02-29")).toBe(false);
    expect(isISODate("2026-9-19")).toBe(false);
  });

  it("addDaysISO сар, жил дамжина", () => {
    expect(addDaysISO("2026-09-19", 14)).toBe("2026-10-03");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("addMonthsISO сарын сүүлийн өдрөөр тасална (Postgres-тэй адил)", () => {
    expect(addMonthsISO("2026-09-19", 1)).toBe("2026-10-19");
    expect(addMonthsISO("2026-09-19", 12)).toBe("2027-09-19");
    expect(addMonthsISO("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonthsISO("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsISO("2026-08-31", 3)).toBe("2026-11-30");
    expect(addMonthsISO("2026-11-15", 3)).toBe("2027-02-15");
    expect(addMonthsISO("2026-03-31", -1)).toBe("2026-02-28");
  });

  it("diffDaysISO", () => {
    expect(diffDaysISO("2026-09-19", "2026-09-26")).toBe(7);
    expect(diffDaysISO("2026-09-19", "2026-09-19")).toBe(0);
    expect(diffDaysISO("2026-09-19", "2026-09-10")).toBe(-9);
    expect(diffDaysISO("2026-12-25", "2027-01-05")).toBe(11);
  });

  it("monthRangeISO", () => {
    expect(monthRangeISO("2026-09-19")).toEqual(["2026-09-01", "2026-09-30"]);
    expect(monthRangeISO("2028-02-10")).toEqual(["2028-02-01", "2028-02-29"]);
  });

  it("буруу огноонд алдаа шидэнэ", () => {
    expect(() => addDaysISO("2026-02-30", 1)).toThrow(RangeError);
  });
});
