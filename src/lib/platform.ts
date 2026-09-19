import "server-only";

/** Платформын төлбөр хүлээн авах данс, холбоо барих мэдээлэл (.env). */
export function getPlatformContact() {
  return {
    bankName: process.env.PLATFORM_BANK_NAME || null,
    bankAccount: process.env.PLATFORM_BANK_ACCOUNT || null,
    bankAccountHolder: process.env.PLATFORM_BANK_ACCOUNT_HOLDER || null,
    supportPhone: process.env.PLATFORM_SUPPORT_PHONE || null,
  };
}
