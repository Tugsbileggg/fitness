import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENING_HOURS,
  describeOpenState,
  isAlwaysOpen,
  type OpeningHours,
  openState,
  parseOpeningHours,
  summarizeHours,
  ubWeekdayTime,
} from "@/features/directory/hours";

// 2026-09-21 бол Даваа гараг. Улаанбаатар = UTC+8 (зуны цаг байхгүй).
const ub = (isoLocal: string) => new Date(`${isoLocal}+08:00`);

const ALWAYS: OpeningHours = {
  mon: ["00:00", "24:00"],
  tue: ["00:00", "24:00"],
  wed: ["00:00", "24:00"],
  thu: ["00:00", "24:00"],
  fri: ["00:00", "24:00"],
  sat: ["00:00", "24:00"],
  sun: ["00:00", "24:00"],
};

describe("ubWeekdayTime", () => {
  it("Улаанбаатарын цагаар гараг солигдоно (UTC-ийн ням гараг 16:30 = УБ-ын даваа 00:30)", () => {
    expect(ubWeekdayTime(new Date("2026-09-20T16:30:00Z"))).toEqual({ day: "mon", time: "00:30" });
  });

  it("шөнө дунд 00:00 (24:00 биш)", () => {
    expect(ubWeekdayTime(ub("2026-09-22T00:00:00"))).toEqual({ day: "tue", time: "00:00" });
  });
});

describe("openState", () => {
  it("ажлын цагт нээлттэй", () => {
    expect(openState(DEFAULT_OPENING_HOURS, ub("2026-09-21T10:00:00"))).toEqual({ open: true, closesAt: "22:00" });
  });

  it("нээхээс өмнө: өнөөдөр нээнэ", () => {
    expect(openState(DEFAULT_OPENING_HOURS, ub("2026-09-21T06:30:00"))).toEqual({
      open: false,
      opensAt: "07:00",
      opensOn: "today",
    });
  });

  it("хаах цагт яг хаагдсан байна: маргааш нээнэ", () => {
    expect(openState(DEFAULT_OPENING_HOURS, ub("2026-09-21T22:00:00"))).toEqual({
      open: false,
      opensAt: "07:00",
      opensOn: "tomorrow",
    });
  });

  it("амралтын өдрийг алгасна", () => {
    const closedSunday: OpeningHours = { ...DEFAULT_OPENING_HOURS, sun: null };
    // Бямба 21:00 → ням амарна → даваа 07:00
    expect(openState(closedSunday, ub("2026-09-26T21:00:00"))).toEqual({
      open: false,
      opensAt: "07:00",
      opensOn: "mon",
    });
  });

  it("24/7 үргэлж нээлттэй", () => {
    expect(openState(ALWAYS, ub("2026-09-23T03:15:00"))).toEqual({ open: true, closesAt: "24:00" });
    expect(openState(ALWAYS, ub("2026-09-23T23:59:00")).open).toBe(true);
  });

  it("бүх өдөр амарна", () => {
    const closed = Object.fromEntries(Object.keys(ALWAYS).map((d) => [d, null])) as OpeningHours;
    expect(openState(closed, ub("2026-09-21T10:00:00"))).toEqual({ open: false, opensAt: null, opensOn: null });
  });
});

describe("describeOpenState", () => {
  it.each([
    [{ open: true, closesAt: "22:00" }, "Нээлттэй", "22:00 хүртэл"],
    [{ open: false, opensAt: "07:00", opensOn: "today" }, "Хаалттай", "07:00 цагт нээнэ"],
    [{ open: false, opensAt: "07:00", opensOn: "tomorrow" }, "Хаалттай", "Маргааш 07:00 цагт нээнэ"],
    [{ open: false, opensAt: "09:00", opensOn: "sat" }, "Хаалттай", "Бямба 09:00 цагт нээнэ"],
    [{ open: false, opensAt: null, opensOn: null }, "Хаалттай", null],
  ] as const)("%j", (state, status, detail) => {
    expect(describeOpenState(state)).toEqual({ status, detail });
  });
});

describe("summarizeHours", () => {
  it("ажлын өдөр ба амралтын өдрийг бүлэглэнэ", () => {
    expect(summarizeHours(DEFAULT_OPENING_HOURS)).toEqual([
      { days: "Да–Ба", hours: "07:00–22:00" },
      { days: "Бя–Ня", hours: "09:00–20:00" },
    ]);
  });

  it("ганц өдрийг бүтэн нэрээр, амралтыг 'Амарна'", () => {
    expect(summarizeHours({ ...DEFAULT_OPENING_HOURS, sat: ["10:00", "18:00"], sun: null })).toEqual([
      { days: "Да–Ба", hours: "07:00–22:00" },
      { days: "Бямба", hours: "10:00–18:00" },
      { days: "Ням", hours: "Амарна" },
    ]);
  });

  it("бүх өдөр ижил", () => {
    const same = Object.fromEntries(Object.keys(ALWAYS).map((d) => [d, ["08:00", "21:00"]])) as unknown as OpeningHours;
    expect(summarizeHours(same)).toEqual([{ days: "Өдөр бүр", hours: "08:00–21:00" }]);
  });

  it("24/7", () => {
    expect(isAlwaysOpen(ALWAYS)).toBe(true);
    expect(summarizeHours(ALWAYS)).toEqual([{ days: "Өдөр бүр", hours: "24 цаг" }]);
  });
});

describe("parseOpeningHours", () => {
  it("зөв утгыг хүлээн авна", () => {
    expect(parseOpeningHours(DEFAULT_OPENING_HOURS)).toEqual(DEFAULT_OPENING_HOURS);
  });

  it.each([
    ["null", null],
    ["массив", []],
    ["өдөр дутуу", { mon: ["07:00", "22:00"] }],
    ["буруу цаг", { ...DEFAULT_OPENING_HOURS, mon: ["7:00", "22:00"] }],
    ["хаах < нээх", { ...DEFAULT_OPENING_HOURS, tue: ["22:00", "07:00"] }],
    ["24:00-д нээх", { ...DEFAULT_OPENING_HOURS, wed: ["24:00", "24:00"] }],
    ["гурван утга", { ...DEFAULT_OPENING_HOURS, thu: ["07:00", "12:00", "22:00"] }],
  ])("%s → null", (_label, value) => {
    expect(parseOpeningHours(value)).toBeNull();
  });
});
