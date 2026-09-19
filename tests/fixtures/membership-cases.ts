// SQL (app.compute_period / app.compute_discount) болон TypeScript (src/lib/membership.ts)
// хувилбарууд ИЖИЛ үр дүн өгөхийг шалгах нийтлэг кейсүүд.

export const PERIOD_CASES: Array<{
  name: string;
  currentEnd: string | null;
  paidOn: string;
  months: number;
  startsOn: string;
  endsOn: string;
}> = [
  { name: "анхны төлбөр", currentEnd: null, paidOn: "2026-09-19", months: 1, startsOn: "2026-09-19", endsOn: "2026-10-19" },
  { name: "идэвхтэй үед сунгах", currentEnd: "2026-10-19", paidOn: "2026-10-10", months: 1, startsOn: "2026-10-20", endsOn: "2026-11-19" },
  { name: "дуусах өдөр сунгах", currentEnd: "2026-10-19", paidOn: "2026-10-19", months: 3, startsOn: "2026-10-20", endsOn: "2027-01-19" },
  { name: "дууссаны маргааш", currentEnd: "2026-10-19", paidOn: "2026-10-20", months: 1, startsOn: "2026-10-20", endsOn: "2026-11-20" },
  { name: "удаан дууссаны дараа", currentEnd: "2026-06-01", paidOn: "2026-09-19", months: 6, startsOn: "2026-09-19", endsOn: "2027-03-19" },
  { name: "сарын сүүлийн өдөр", currentEnd: null, paidOn: "2027-01-31", months: 1, startsOn: "2027-01-31", endsOn: "2027-02-28" },
  { name: "өндөр жил", currentEnd: null, paidOn: "2028-01-31", months: 1, startsOn: "2028-01-31", endsOn: "2028-02-29" },
  { name: "12 сар", currentEnd: null, paidOn: "2026-09-19", months: 12, startsOn: "2026-09-19", endsOn: "2027-09-19" },
  { name: "жил дамжих сунгалт", currentEnd: "2026-12-31", paidOn: "2026-12-20", months: 2, startsOn: "2027-01-01", endsOn: "2027-02-28" },
];

export const DISCOUNT_CASES: Array<{
  name: string;
  price: number;
  type: "none" | "amount" | "percent";
  value: number;
  expected: number | "error";
}> = [
  { name: "хөнгөлөлтгүй", price: 80000, type: "none", value: 999, expected: 0 },
  { name: "дүнгээр", price: 80000, type: "amount", value: 10000, expected: 10000 },
  { name: "бүтэн үнээр", price: 80000, type: "amount", value: 80000, expected: 80000 },
  { name: "үнээс их дүн", price: 80000, type: "amount", value: 80001, expected: "error" },
  { name: "10 хувь", price: 80000, type: "percent", value: 10, expected: 8000 },
  { name: "хувь бүхэлтгэх (доош)", price: 99999, type: "percent", value: 15, expected: 15000 },
  { name: "хувь бүхэлтгэх (0.5 дээш)", price: 45, type: "percent", value: 10, expected: 5 },
  { name: "100 хувь", price: 150000, type: "percent", value: 100, expected: 150000 },
  { name: "100-аас их хувь", price: 150000, type: "percent", value: 101, expected: "error" },
  { name: "сөрөг", price: 150000, type: "amount", value: -1, expected: "error" },
  { name: "бутархай", price: 150000, type: "percent", value: 12.5, expected: "error" },
];
