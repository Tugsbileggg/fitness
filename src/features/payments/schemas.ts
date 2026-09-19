import { z } from "zod";
import { isISODate } from "@/lib/dates";
import { parseMNT } from "@/lib/money";
import { optionalText } from "@/lib/validation";

export const paymentSchema = z
  .object({
    planId: z.string({ error: "Багц сонгоно уу" }).uuid("Багц сонгоно уу"),
    paidOn: z.string().refine(isISODate, "Огноо буруу байна"),
    method: z.enum(["cash", "bank_transfer"], { error: "Төлбөрийн хэлбэрээ сонгоно уу" }),
    discountType: z.enum(["none", "amount", "percent"]),
    discountValue: z.string().optional(),
    note: optionalText("Тэмдэглэл", 500),
  })
  .transform((v, ctx) => {
    let discountValue = 0;
    if (v.discountType === "amount") {
      const amount = parseMNT(v.discountValue ?? "");
      if (amount === null || amount <= 0) {
        ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Хөнгөлөлтийн дүнг оруулна уу" });
        return z.NEVER;
      }
      discountValue = amount;
    } else if (v.discountType === "percent") {
      const raw = (v.discountValue ?? "").trim();
      if (!/^\d{1,3}$/.test(raw) || Number(raw) < 1 || Number(raw) > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Хувийг 1-100 хооронд бүхэл тоогоор оруулна уу",
        });
        return z.NEVER;
      }
      discountValue = Number(raw);
    }
    return { ...v, discountValue };
  });

export type PaymentInput = z.input<typeof paymentSchema>;
export type PaymentValues = z.output<typeof paymentSchema>;

export const voidSchema = z.object({
  reason: z.string().trim().min(3, "Шалтгаанаа бичнэ үү").max(300, "Шалтгаан хэт урт байна"),
});
