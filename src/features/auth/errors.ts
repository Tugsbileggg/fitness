import type { AuthError } from "@supabase/supabase-js";

/** Supabase Auth-ийн алдааг хэрэглэгчид ойлгомжтой монгол мессеж болгоно. */
export function authErrorMessage(error: Pick<AuthError, "code" | "message" | "status">): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Имэйл эсвэл нууц үг буруу байна";
    case "email_not_confirmed":
      return "Имэйл хаягаа баталгаажуулаагүй байна. Бүртгүүлэхэд ирсэн имэйл дэх холбоос дээр дарна уу.";
    case "user_already_exists":
    case "email_exists":
      return "Энэ имэйлээр бүртгэл аль хэдийн үүссэн байна. Нэвтрэх эсвэл нууц үгээ сэргээнэ үү.";
    case "weak_password":
      return "Нууц үг хэт энгийн байна. Үсэг, тоо холисон 8-аас дээш тэмдэгт ашиглана уу.";
    case "same_password":
      return "Шинэ нууц үг хуучнаасаа өөр байх ёстой";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Хэт олон удаа оролдлоо. Хэдэн минут хүлээгээд дахин оролдоно уу.";
    case "email_address_invalid":
      return "Имэйл хаяг буруу байна";
    case "signup_disabled":
      return "Шинэ бүртгэл түр хаагдсан байна";
    case "user_banned":
      return "Таны бүртгэл түр хаагдсан байна";
    default:
      return "Алдаа гарлаа. Дахин оролдоно уу.";
  }
}
