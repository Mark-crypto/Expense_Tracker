import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";
import { titleCase } from "@/lib/format";

// The Get started checklist, in the order it is shown. kind is the dialog it opens.
export const SETUP_ITEMS = [
  { key: "accounts", kind: "accounts", title: "Add an account", why: "Expenses come off the right balance", action: "Add" },
  { key: "payDay", kind: "pay", title: "Set your pay day", why: "Safe to spend lasts until you're paid", action: "Set" },
  { key: "statement", kind: "statement", title: "Add your M-Pesa statement", why: "See where your money really goes", action: "Add" },
  { key: "bills", kind: "bills", title: "Track your bills", why: "Hear about them before they're due", action: "Track" },
  { key: "budgets", kind: "plan", title: "Plan your month", why: "Get warned before you overspend", action: "Plan" },
  { key: "pin", kind: "pin", title: "Protect the app with a PIN", why: "Keeps your balances private", action: "Set" },
  { key: "goal", kind: "goal", title: "Set a savings goal", why: "Know what to put aside each week", action: "Set" },
];

export const useSetup = () =>
  useQuery({
    queryKey: ["setup"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/setup");
      return { ...data, firstName: titleCase(data.firstName) };
    },
    staleTime: 60_000,
  });

const pad = (value) => String(value).padStart(2, "0");

// Same rule as the server: this month's pay day if it's still ahead, otherwise next month's.
export const nextPayday = (today, payDay) => {
  const [year, month] = today.split("-").map(Number);
  const onDay = (y, m) => `${y}-${pad(m)}-${pad(Math.min(payDay, new Date(y, m, 0).getDate()))}`;
  const thisMonth = onDay(year, month);
  if (thisMonth > today) return thisMonth;
  return month === 12 ? onDay(year + 1, 1) : onDay(year, month + 1);
};

export const daysUntil = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000);
