// "Фитнес хайх" хэсгийн жишээ фитнесүүд. Локал seed (`pnpm db:seed`) болон cloud (`pnpm cloud:demo`)
// хоёулаа эндээс уншина. Бүх нэр, хаяг зохиомол. Координат нь тухайн дүүрэг/аймагт ойролцоо.
import type { AmenityCode } from "../src/features/directory/amenities";
import type { AreaCode } from "../src/features/directory/areas";
import type { OpeningHours } from "../src/features/directory/hours";
import type { AdminClient } from "./lib";

export type DemoProfile = {
  slug: string;
  area: AreaCode;
  lat: number;
  lng: number;
  tagline: string;
  description: string;
  hours: OpeningHours;
  amenities: AmenityCode[];
  facebook?: string;
  instagram?: string;
};

export type DemoGym = {
  key: string;
  name: string;
  address: string;
  /** Бүртгэлийн утас (gyms.phone). Нийтэд харагдах эсэхийг contact_phone шийднэ. */
  phone: string;
  managerName: string;
  plans: Array<{ name: string; months: number; price: number }>;
  profile: DemoProfile;
};

const week = (weekday: [string, string] | null, sat: [string, string] | null, sun: [string, string] | null) =>
  ({ mon: weekday, tue: weekday, wed: weekday, thu: weekday, fri: weekday, sat, sun }) as OpeningHours;

/** Үндсэн seed-ийн хоёр фитнесийн танилцуулга (scripts/seed.ts-ийн GYMS-тэй key-ээр холбогдоно). */
export const CORE_GYM_PROFILES: Record<string, DemoProfile> = {
  khuchit: {
    slug: "khuchit-fitnes",
    area: "ub_bayanzurkh",
    lat: 47.9187,
    lng: 106.9612,
    tagline: "Хүчний болон кардио бэлтгэлийн орчин үеийн заал",
    description:
      "600 м² талбайтай заалд чөлөөт жин, 30 гаруй тренажер, кардио бүс бий. " +
      "Мэргэжлийн 3 багш хувийн хөтөлбөр гаргаж, эхлэгчдэд тоног төхөөрөмжийг зааж өгнө.\n\n" +
      "Саун, шүршүүр, хувцасны шүүгээ, үнэгүй зогсоолтой.",
    hours: week(["07:00", "22:00"], ["09:00", "20:00"], ["09:00", "20:00"]),
    amenities: ["cardio", "free_weights", "machines", "personal_training", "sauna", "shower", "lockers", "parking", "wifi"],
  },
  erch: {
    slug: "erch-khuch-sport-klub",
    area: "ub_sukhbaatar",
    lat: 47.9163,
    lng: 106.9262,
    tagline: "Групп хичээл, кроссфит, йог",
    description:
      "Өглөө, оройн групп хичээлүүд: кроссфит, функциональ бэлтгэл, йог, аэробик. " +
      "Хичээл бүр 10–15 хүний бүлэгт явагдана.\n\nХотын төвд, Энхтайваны өргөн чөлөөний дагуу.",
    hours: week(["06:30", "21:30"], ["09:00", "18:00"], null),
    amenities: ["group_classes", "crossfit", "yoga", "cardio", "shower", "lockers", "cafe"],
  },
};

/** Зөвхөн "Фитнес хайх"-д зориулсан нэмэлт фитнесүүд (үйлчлүүлэгчгүй). */
export const DIRECTORY_GYMS: DemoGym[] = [
  {
    key: "zaisan",
    name: "Зайсан фитнес клуб",
    address: "Улаанбаатар, Хан-Уул дүүрэг, 11-р хороо, Зайсангийн гудамж 7",
    phone: "77113344",
    managerName: "Отгонбаяр Мөнх-Эрдэнэ",
    plans: [
      { name: "1 сар", months: 1, price: 120000 },
      { name: "3 сар", months: 3, price: 330000 },
      { name: "6 сар", months: 6, price: 600000 },
      { name: "1 жил", months: 12, price: 1080000 },
    ],
    profile: {
      slug: "zaisan-fitnes-klub",
      area: "ub_khan_uul",
      lat: 47.8858,
      lng: 106.9147,
      tagline: "Уулын бэлд, тав тухтай фитнес клуб",
      description:
        "Шинэ тоног төхөөрөмж, цэвэр агаартай, цонхноос Богд уул харагдах заал. " +
        "Хувийн дасгалжуулагч, групп хичээл, саун, шүршүүртэй.",
      hours: week(["06:30", "22:00"], ["08:00", "20:00"], ["08:00", "20:00"]),
      amenities: ["cardio", "free_weights", "machines", "group_classes", "personal_training", "sauna", "shower", "lockers", "parking", "wifi"],
    },
  },
  {
    key: "tsetseg",
    name: "Цэцэг йог студи",
    address: "Улаанбаатар, Сүхбаатар дүүрэг, 8-р хороо, Бага тойруу 21",
    phone: "88114455",
    managerName: "Цэцэгмаа Нарангэрэл",
    plans: [
      { name: "1 сар", months: 1, price: 90000 },
      { name: "3 сар", months: 3, price: 240000 },
      { name: "6 сар", months: 6, price: 450000 },
    ],
    profile: {
      slug: "tsetseg-iog-studi",
      area: "ub_sukhbaatar",
      lat: 47.9262,
      lng: 106.9245,
      tagline: "Йог, пилатес, бясалгалын жижиг студи",
      description:
        "Хатха, виньяса йог, пилатес, амьсгалын дасгал. Анхан шатнаас ахисан түвшин хүртэлх бүлгүүд. " +
        "Дэвсгэр, хэрэгслийг студи өөрөө бэлдэнэ.",
      hours: week(["07:00", "21:00"], ["09:00", "17:00"], null),
      amenities: ["yoga", "group_classes", "shower", "lockers", "women_only", "wifi"],
    },
  },
  {
    key: "avarga",
    name: "Аварга бокс заал",
    address: "Улаанбаатар, Баянгол дүүрэг, 3-р хороо, Энхтайваны өргөн чөлөө 110",
    phone: "99115566",
    managerName: "Ганболд Төмөрбаатар",
    plans: [
      { name: "1 сар", months: 1, price: 80000 },
      { name: "3 сар", months: 3, price: 210000 },
      { name: "1 жил", months: 12, price: 750000 },
    ],
    profile: {
      slug: "avarga-boks-zaal",
      area: "ub_bayangol",
      lat: 47.9133,
      lng: 106.8792,
      tagline: "Бокс, кикбокс, бөхийн бэлтгэл",
      description:
        "Олон улсын хэмжээний дасгалжуулагчтай бокс, кикбоксын заал. " +
        "Насанд хүрэгчид болон 8-аас дээш насны хүүхдийн бүлэгтэй.",
      hours: week(["09:00", "21:00"], ["10:00", "18:00"], null),
      amenities: ["martial_arts", "free_weights", "personal_training", "kids", "shower", "lockers"],
    },
  },
  {
    key: "udur-shunu",
    name: "Өдөр шөнө 24/7 жим",
    address: "Улаанбаатар, Сонгинохайрхан дүүрэг, 1-р хороо, 1-р хорооллын гудамж 5",
    phone: "95116677",
    managerName: "Батцэцэг Энхжаргал",
    plans: [
      { name: "1 сар", months: 1, price: 70000 },
      { name: "3 сар", months: 3, price: 190000 },
      { name: "6 сар", months: 6, price: 360000 },
      { name: "1 жил", months: 12, price: 650000 },
    ],
    profile: {
      slug: "udur-shunu-24-7-jim",
      area: "ub_songinokhairkhan",
      lat: 47.9171,
      lng: 106.842,
      tagline: "24 цагаар нээлттэй жим",
      description:
        "Ажлын дараа, шөнө ч хамаагүй хүссэн цагтаа дасгалаа хий. " +
        "Картаар нэвтэрдэг, камерын хяналттай, өдрийн цагаар дасгалжуулагчтай.",
      hours: week(["00:00", "24:00"], ["00:00", "24:00"], ["00:00", "24:00"]),
      amenities: ["cardio", "free_weights", "machines", "shower", "lockers", "parking", "wifi"],
    },
  },
  {
    key: "saruul",
    name: "Саруул фитнес",
    address: "Улаанбаатар, Чингэлтэй дүүрэг, 4-р хороо, Жамъян гүний гудамж 9",
    phone: "80117788",
    managerName: "Саруул Батжаргал",
    plans: [
      { name: "1 сар", months: 1, price: 110000 },
      { name: "3 сар", months: 3, price: 300000 },
      { name: "1 жил", months: 12, price: 1000000 },
    ],
    profile: {
      slug: "saruul-fitnes",
      area: "ub_chingeltei",
      lat: 47.9322,
      lng: 106.9078,
      tagline: "Гэр бүлээрээ хамт хичээллэх фитнес",
      description:
        "Том хүмүүсийн заал, хүүхдийн хичээл, усан бассейн нэг дор. " +
        "Хүүхдээ хичээлд нь өгөөд өөрөө дасгалаа хийх боломжтой.",
      hours: week(["07:00", "22:00"], ["09:00", "20:00"], ["09:00", "20:00"]),
      amenities: ["cardio", "machines", "group_classes", "kids", "pool", "sauna", "shower", "lockers", "cafe"],
    },
  },
  {
    key: "darkhan",
    name: "Дархан хүч фитнес",
    address: "Дархан-Уул аймаг, Дархан сум, 11-р баг, Шинэ Дархан 3",
    phone: "70371122",
    managerName: "Энхболд Ганзориг",
    plans: [
      { name: "1 сар", months: 1, price: 60000 },
      { name: "3 сар", months: 3, price: 160000 },
      { name: "1 жил", months: 12, price: 580000 },
    ],
    profile: {
      slug: "darkhan-khuch-fitnes",
      area: "darkhan_uul",
      lat: 49.4867,
      lng: 105.9228,
      tagline: "Дарханы хамгийн том тренажерын заал",
      description: "Хүчний болон кроссфит бэлтгэлийн тоног төхөөрөмжтэй, хувийн дасгалжуулагчтай заал.",
      hours: week(["07:00", "22:00"], ["10:00", "19:00"], ["10:00", "19:00"]),
      amenities: ["cardio", "free_weights", "machines", "personal_training", "crossfit", "shower", "lockers", "parking"],
    },
  },
  {
    key: "orkhon",
    name: "Орхон фитнес",
    address: "Орхон аймаг, Баян-Өндөр сум, Сэлэнгэ баг, Их наяд 14",
    phone: "70351133",
    managerName: "Оюунчимэг Баярсайхан",
    plans: [
      { name: "1 сар", months: 1, price: 65000 },
      { name: "3 сар", months: 3, price: 175000 },
      { name: "6 сар", months: 6, price: 330000 },
    ],
    profile: {
      slug: "orkhon-fitnes",
      area: "orkhon",
      lat: 49.027,
      lng: 104.044,
      tagline: "Эрдэнэт хотын төвд байрлах фитнес",
      description: "Кардио, тренажер, йогийн хичээл, массажтай. Ажлын өдрүүдэд оройн групп хичээлтэй.",
      hours: week(["07:00", "21:00"], ["09:00", "18:00"], ["10:00", "16:00"]),
      amenities: ["cardio", "free_weights", "machines", "group_classes", "yoga", "sauna", "shower", "lockers", "massage"],
    },
  },
];

export const demoManagerEmail = (gym: Pick<DemoGym, "key">) => `gym.${gym.key}@demo.test`;

/**
 * Танилцуулгыг бичнэ (secret key-ээр, RLS-гүй). contactPhone = null бол "Залгах" товч гарахгүй:
 * cloud дээр зохиомол дугаар бодит хүнийх байж болох тул утас харуулахгүй.
 */
export async function upsertDemoProfile(
  supabase: AdminClient,
  gymId: string,
  profile: DemoProfile,
  options: { contactPhone: string | null; published?: boolean },
) {
  await supabase
    .from("gym_profiles")
    .upsert(
      {
        gym_id: gymId,
        slug: profile.slug,
        is_published: options.published ?? true,
        tagline: profile.tagline,
        description: profile.description,
        area: profile.area,
        latitude: profile.lat,
        longitude: profile.lng,
        contact_phone: options.contactPhone,
        opening_hours: profile.hours,
        amenities: profile.amenities,
        facebook_url: profile.facebook ?? null,
        instagram_url: profile.instagram ?? null,
      },
      { onConflict: "gym_id" },
    )
    .throwOnError();
}

/**
 * Жишээ фитнес үүсгэнэ: менежер (бүртгэлийн trigger фитнес, туршилтыг үүсгэнэ), эрхийн багц,
 * танилцуулга, баталгаажуулалт. password = undefined бол менежер нэвтрэх боломжгүй (cloud).
 */
export async function createDirectoryGym(
  supabase: AdminClient,
  gym: DemoGym,
  options: { password?: string; contactPhone: boolean },
): Promise<string> {
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: demoManagerEmail(gym),
    password: options.password,
    email_confirm: true,
    user_metadata: {
      signup_type: "gym_owner",
      full_name: gym.managerName,
      gym_name: gym.name,
      gym_address: gym.address,
      gym_phone: gym.phone,
    },
  });
  if (error) throw new Error(`${gym.name}: ${error.message}`);

  const { data: membership } = await supabase
    .from("gym_users")
    .select("gym_id")
    .eq("user_id", user.user.id)
    .single()
    .throwOnError();
  const gymId = membership.gym_id;

  await supabase
    .from("membership_plans")
    .insert(gym.plans.map((p, i) => ({ gym_id: gymId, name: p.name, duration_months: p.months, price: p.price, sort_order: i })))
    .throwOnError();
  await upsertDemoProfile(supabase, gymId, gym.profile, { contactPhone: options.contactPhone ? gym.phone : null });
  await supabase
    .from("gym_subscriptions")
    .update({ verified_at: new Date().toISOString() })
    .eq("gym_id", gymId)
    .throwOnError();
  return gymId;
}
