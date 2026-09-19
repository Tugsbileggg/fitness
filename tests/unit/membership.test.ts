import { describe, expect, it } from "vitest";
import {
  computeDiscount,
  computePeriod,
  DiscountError,
  durationLabel,
  membershipStatus,
} from "@/lib/membership";
import { DISCOUNT_CASES, PERIOD_CASES } from "../fixtures/membership-cases";

describe("computePeriod (SQL app.compute_period-тэй ижил)", () => {
  it.each(PERIOD_CASES)("$name", ({ currentEnd, paidOn, months, startsOn, endsOn }) => {
    const result = computePeriod(currentEnd, paidOn, months);
    expect({ startsOn: result.startsOn, endsOn: result.endsOn }).toEqual({ startsOn, endsOn });
  });

  it("сунгалт эсэхийг тэмдэглэнэ", () => {
    expect(computePeriod("2026-10-19", "2026-10-10", 1).extending).toBe(true);
    expect(computePeriod("2026-10-19", "2026-10-20", 1).extending).toBe(false);
    expect(computePeriod(null, "2026-10-20", 1).extending).toBe(false);
  });
});

describe("computeDiscount (SQL app.compute_discount-тэй ижил)", () => {
  it.each(DISCOUNT_CASES)("$name", ({ price, type, value, expected }) => {
    if (expected === "error") {
      expect(() => computeDiscount(price, type, value)).toThrow(DiscountError);
    } else {
      expect(computeDiscount(price, type, value)).toBe(expected);
    }
  });
});

describe("membershipStatus", () => {
  const today = "2026-09-19";
  it("эрхгүй", () => expect(membershipStatus(null, today, 7)).toEqual({ status: "none", daysLeft: null }));
  it("өчигдөр дууссан", () =>
    expect(membershipStatus("2026-09-18", today, 7)).toEqual({ status: "expired", daysLeft: -1 }));
  it("өнөөдөр дуусна (хүчинтэй)", () =>
    expect(membershipStatus("2026-09-19", today, 7)).toEqual({ status: "expiring", daysLeft: 0 }));
  it("7 хоногийн дараа дуусна", () =>
    expect(membershipStatus("2026-09-26", today, 7)).toEqual({ status: "expiring", daysLeft: 7 }));
  it("8 хоногийн дараа = идэвхтэй", () =>
    expect(membershipStatus("2026-09-27", today, 7)).toEqual({ status: "active", daysLeft: 8 }));
  it("фитнесийн тохиргоо 14 хоног", () =>
    expect(membershipStatus("2026-09-27", today, 14).status).toBe("expiring"));
});

describe("durationLabel", () => {
  it("сар ба жил", () => {
    expect(durationLabel(1)).toBe("1 сар");
    expect(durationLabel(6)).toBe("6 сар");
    expect(durationLabel(12)).toBe("1 жил");
    expect(durationLabel(24)).toBe("2 жил");
  });
});
