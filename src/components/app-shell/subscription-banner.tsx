import { AlertTriangleIcon, LockIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { GymContext } from "@/lib/auth/context";
import { formatDate } from "@/lib/dates";
import { getPlatformContact } from "@/lib/platform";
import { formatPhone } from "@/lib/phone";

/**
 * Платформын эрхийн анхааруулга:
 *  - past_due / suspended → read-only горимын мэдэгдэл (бүх ажилтанд)
 *  - эрх дуусахад ≤5 хоног → сануулга (зөвхөн менежерт)
 */
export function SubscriptionBanner({ gym }: { gym: GymContext }) {
  const contact = getPlatformContact();
  const phone = contact.supportPhone ? ` Холбоо барих: ${formatPhone(contact.supportPhone)}.` : "";

  if (gym.status === "suspended") {
    return (
      <div className="px-4 pt-4 lg:px-8">
        <Alert variant="danger">
          <LockIcon />
          <AlertTitle>Зөвхөн харах горим</AlertTitle>
          <AlertDescription>
            Таны фитнесийн эрхийг платформын админ түр зогсоосон байна. Өгөгдөл тань хадгалагдсан, гэхдээ
            шинээр бүртгэх, засах боломжгүй.{phone}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (gym.status === "past_due") {
    return (
      <div className="px-4 pt-4 lg:px-8">
        <Alert variant="danger">
          <LockIcon />
          <AlertTitle>Платформын эрхийн хугацаа дууссан</AlertTitle>
          <AlertDescription>
            Эрх {formatDate(gym.accessEndsOn)}-нд дууссан тул систем зөвхөн харах горимд шилжлээ. Өгөгдөл тань
            хадгалагдсан. {gym.isManager ? "Төлбөрөө шилжүүлсний дараа бүрэн ажиллана." : "Менежерт мэдэгдэнэ үү."}
            {phone}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (gym.isManager && gym.showRenewalWarning && gym.accessDaysLeft !== null) {
    const what = gym.status === "trial" ? "Үнэгүй туршилт" : "Платформын эрх";
    const when =
      gym.accessDaysLeft === 0 ? "өнөөдөр дуусна" : `${gym.accessDaysLeft} хоногийн дараа дуусна`;
    return (
      <div className="px-4 pt-4 lg:px-8">
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertTitle>
            {what} {when} ({formatDate(gym.accessEndsOn)})
          </AlertTitle>
          <AlertDescription>
            Хугацаа дуусвал систем зөвхөн харах горимд шилжинэ.
            {contact.bankAccount &&
              ` Төлбөрөө ${contact.bankName ?? ""} ${contact.bankAccount}${
                contact.bankAccountHolder ? ` (${contact.bankAccountHolder})` : ""
              } дансанд шилжүүлнэ үү.`}
            {phone}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
