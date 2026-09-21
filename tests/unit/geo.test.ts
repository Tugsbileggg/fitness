import { describe, expect, it } from "vitest";
import { directionsUrl, distanceMeters, formatDistance, isInMongolia, UB_CENTER } from "@/lib/geo";

describe("distanceMeters", () => {
  it("ижил цэг 0 метр", () => {
    expect(distanceMeters(UB_CENTER, UB_CENTER)).toBe(0);
  });

  it("Сүхбаатарын талбайгаас Зайсан ойролцоогоор 4 км", () => {
    const zaisan = { lat: 47.8836, lng: 106.9163 };
    expect(distanceMeters(UB_CENTER, zaisan)).toBeGreaterThan(3800);
    expect(distanceMeters(UB_CENTER, zaisan)).toBeLessThan(4100);
  });

  it("Улаанбаатараас Дархан ойролцоогоор 190 км", () => {
    const darkhan = { lat: 49.4867, lng: 105.9228 };
    const km = distanceMeters(UB_CENTER, darkhan) / 1000;
    expect(km).toBeGreaterThan(180);
    expect(km).toBeLessThan(200);
  });

  it("тэгш хэмтэй", () => {
    const a = { lat: 47.92, lng: 106.9 };
    const b = { lat: 47.88, lng: 106.95 };
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6);
  });
});

describe("formatDistance", () => {
  it.each([
    [0, "10 м"],
    [4, "10 м"],
    [849, "850 м"],
    [999, "1.0 км"],
    [1234, "1.2 км"],
    [9949, "9.9 км"],
    [9950, "10 км"],
    [15600, "16 км"],
    [190_400, "190 км"],
  ])("%d м → %s", (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });

  it("буруу утга", () => {
    expect(formatDistance(Number.NaN)).toBe("—");
    expect(formatDistance(-5)).toBe("—");
  });
});

describe("isInMongolia", () => {
  it("Улаанбаатар, Ховд, Дорнод дотор", () => {
    expect(isInMongolia(UB_CENTER)).toBe(true);
    expect(isInMongolia({ lat: 48.0056, lng: 91.6419 })).toBe(true);
    expect(isInMongolia({ lat: 48.0706, lng: 114.5228 })).toBe(true);
  });

  it("Бээжин, Москва, 0,0 гадна", () => {
    expect(isInMongolia({ lat: 39.9042, lng: 116.4074 })).toBe(false);
    expect(isInMongolia({ lat: 55.7558, lng: 37.6173 })).toBe(false);
    expect(isInMongolia({ lat: 0, lng: 0 })).toBe(false);
  });
});

it("directionsUrl нь Google Maps-ийн чиглэлийн холбоос", () => {
  expect(directionsUrl({ lat: 47.9, lng: 106.9 })).toBe(
    "https://www.google.com/maps/dir/?api=1&destination=47.9,106.9",
  );
});
