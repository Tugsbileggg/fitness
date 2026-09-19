import { describe, expect, it } from "vitest";
import { ageFromBirthYear, clientSchema } from "@/features/clients/schemas";
import { escapeLike, parseClientSearch } from "@/features/clients/search";

describe("parseClientSearch", () => {
  it("тоо бол утсаар хайна", () => {
    expect(parseClientSearch("9911")).toEqual({ kind: "phone", pattern: "%9911%" });
    expect(parseClientSearch("9911 22")).toEqual({ kind: "phone", pattern: "%991122%" });
    expect(parseClientSearch("+976 9911 2233")).toEqual({ kind: "phone", pattern: "%99112233%" });
  });

  it("үсэг бол нэрээр хайна, тусгай тэмдэгтийг escape хийнэ", () => {
    expect(parseClientSearch("  Бат  эрдэнэ ")).toEqual({ kind: "name", pattern: "%Бат эрдэнэ%" });
    expect(parseClientSearch("50%_off")).toEqual({ kind: "name", pattern: "%50\\%\\_off%" });
  });

  it("хоосон бол шүүлтгүй", () => {
    expect(parseClientSearch("")).toBeNull();
    expect(parseClientSearch("   ")).toBeNull();
    expect(parseClientSearch(null)).toBeNull();
    expect(parseClientSearch("--")).toBeNull();
  });

  it("escapeLike", () => {
    expect(escapeLike("a\\b%c_d")).toBe("a\\\\b\\%c\\_d");
  });
});

describe("clientSchema", () => {
  const valid = {
    fullName: "Батболд",
    phone: "9911-2233",
    gender: "male" as const,
    birthYear: "1995",
    assignedTrainerId: "none",
    notes: "",
  };

  it("утсыг normalize хийж, оныг тоо болгоно, 'none' багшийг null болгоно", () => {
    const result = clientSchema.parse(valid);
    expect(result).toMatchObject({ phone: "99112233", birthYear: 1995, assignedTrainerId: null, notes: null });
  });

  it("буруу утгуудад монгол алдаа өгнө", () => {
    const result = clientSchema.safeParse({ ...valid, phone: "123", birthYear: "1800", gender: undefined });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    expect(messages).toContain("phone: Утасны дугаар 8 оронтой байх ёстой");
    expect(messages).toContain("birthYear: Төрсөн он буруу байна");
    expect(messages).toContain("gender: Хүйсээ сонгоно уу");
  });

  it("ирээдүйн он хүлээж авахгүй", () => {
    expect(clientSchema.safeParse({ ...valid, birthYear: "2999" }).success).toBe(false);
  });

  it("насыг тооцоолно", () => {
    expect(ageFromBirthYear(1995, "2026-09-19")).toBe(31);
  });
});
