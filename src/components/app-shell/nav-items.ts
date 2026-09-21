import {
  CircleUserIcon,
  CreditCardIcon,
  DumbbellIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  SettingsIcon,
  StoreIcon,
  TagsIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import type { StaffRole } from "@/lib/auth/context";

export type NavItem = {
  href: string;
  label: string;
  /** Утасны доод навигацад харагдах богино нэр. */
  shortLabel?: string;
  icon: LucideIcon;
  roles: StaffRole[];
  /** Утасны доод навигацад шууд харагдах эсэх (бусад нь "Цэс" дотор). */
  primary?: boolean;
};

// Шинэ хуудас нэмэгдэх бүрт энд бүртгэнэ.
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Хяналт",
    icon: LayoutDashboardIcon,
    roles: ["manager", "trainer"],
    primary: true,
  },
  {
    href: "/clients",
    label: "Үйлчлүүлэгчид",
    shortLabel: "Үйлчлүүлэгч",
    icon: UsersIcon,
    roles: ["manager", "trainer"],
    primary: true,
  },
  {
    href: "/payments",
    label: "Төлбөрүүд",
    shortLabel: "Төлбөр",
    icon: WalletIcon,
    roles: ["manager"],
    primary: true,
  },
  {
    href: "/plans",
    label: "Эрхийн багц",
    icon: TagsIcon,
    roles: ["manager"],
  },
  {
    href: "/trainers",
    label: "Багш нар",
    icon: DumbbellIcon,
    roles: ["manager"],
  },
  {
    href: "/listing",
    label: "Танилцуулга",
    icon: StoreIcon,
    roles: ["manager"],
  },
  {
    href: "/settings",
    label: "Тохиргоо",
    icon: SettingsIcon,
    roles: ["manager"],
  },
  {
    href: "/billing",
    label: "Платформын эрх",
    icon: CreditCardIcon,
    roles: ["manager"],
  },
  {
    href: "/account",
    label: "Миний бүртгэл",
    icon: CircleUserIcon,
    roles: ["manager", "trainer"],
  },
];

export function navItemsFor(role: StaffRole) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  manager: "Менежер",
  trainer: "Багш",
};
