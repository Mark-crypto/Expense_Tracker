import {
  Baby,
  Bank,
  Briefcase,
  Bus,
  Coins,
  FirstAidKit,
  Gift,
  GraduationCap,
  HandCoins,
  HouseLine,
  Laptop,
  Lightning,
  Airplane,
  PawPrint,
  PiggyBank,
  Receipt,
  Shapes,
  ShieldCheck,
  ShoppingCartSimple,
  Sparkle,
  TShirt,
  Couch,
  Ticket,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Fixed order, tested for colour-blind separation. Colour follows the group, never rank.
const GROUP_COLOR = {
  money: "var(--cat-1)",
  transport: "var(--cat-2)",
  food: "var(--cat-3)",
  people: "var(--cat-4)",
  home: "var(--cat-5)",
  lifestyle: "var(--cat-6)",
};

const CATEGORY_STYLE = {
  housing: [HouseLine, "home"],
  utilities: [Lightning, "home"],
  householdSupplies: [Couch, "home"],
  transportation: [Bus, "transport"],
  travel: [Airplane, "transport"],
  food: [ShoppingCartSimple, "food"],
  debt: [HandCoins, "money"],
  savings: [PiggyBank, "money"],
  taxes: [Receipt, "money"],
  insurance: [ShieldCheck, "money"],
  retirement: [Coins, "money"],
  healthcare: [FirstAidKit, "people"],
  family: [Baby, "people"],
  personalCare: [Sparkle, "people"],
  gifts: [Gift, "people"],
  pets: [PawPrint, "people"],
  entertainment: [Ticket, "lifestyle"],
  clothing: [TShirt, "lifestyle"],
  education: [GraduationCap, "lifestyle"],
  work: [Briefcase, "lifestyle"],
  technology: [Laptop, "lifestyle"],
  emergency: [WarningCircle, "lifestyle"],
  miscellaneous: [Shapes, "lifestyle"],
};

export const categoryColor = (category) => GROUP_COLOR[CATEGORY_STYLE[category]?.[1] ?? "lifestyle"];

export const CategoryIcon = ({ category, className }) => {
  const [Icon, group] = CATEGORY_STYLE[category] ?? [Shapes, "lifestyle"];
  return (
    <Icon
      aria-hidden
      weight="duotone"
      className={cn("size-4 shrink-0", className)}
      style={{ color: GROUP_COLOR[group] }}
    />
  );
};

// Deep, saturated tones that all carry white initials well.
const MERCHANT_COLORS = [
  "#c2341f", "#1a7f4b", "#1f4fa3", "#a8701a", "#7a3fb5",
  "#14707a", "#a0307a", "#475069", "#3f4fb5", "#b3421a",
];

const initials = (name) =>
  name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const colorFor = (name) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return MERCHANT_COLORS[hash % MERCHANT_COLORS.length];
};

export const MerchantTile = ({ name, className }) => (
  <span
    aria-hidden
    className={cn(
      "flex size-8 shrink-0 items-center justify-center rounded-[9px] text-xs font-semibold text-white shadow-sm ring-1 ring-white/10 ring-inset",
      className
    )}
    style={{ background: colorFor(name) }}
  >
    {initials(name)}
  </span>
);
