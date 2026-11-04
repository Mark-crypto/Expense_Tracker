import { CheckCircle, Clock, TrendDown, TrendUp } from "@phosphor-icons/react";
import { dayMonth } from "@/lib/accounts";
import { formatKES } from "@/lib/format";

export const GOAL_STATES = {
  on_track: { label: "On track", icon: TrendUp, className: "text-success" },
  behind: { label: "Behind", icon: TrendDown, className: "text-warning" },
  late: { label: "Date passed", icon: Clock, className: "text-danger" },
  reached: { label: "Reached", icon: CheckCircle, className: "text-success" },
  open: { label: "No date", icon: null, className: "text-muted-foreground" },
};

export const progressOf = (goal) => Math.min((goal.saved / goal.target) * 100, 100);

export const daysText = (days) => (days === 1 ? "1 day left" : `${days} days left`);

// The one line that tells you what to do next.
export const goalAdvice = (goal) => {
  if (goal.state === "reached") return "You've reached it. Archive the goal or set a new target.";
  if (goal.state === "late") return `The date has passed with ${formatKES(goal.remaining)} still to go. Pick a new date.`;
  if (goal.state === "open") return `${formatKES(goal.remaining)} to go, at your own pace.`;
  const when = `${daysText(goal.daysLeft)}, by ${dayMonth(goal.dueDate)}`;
  if (goal.state === "behind") return `Put aside ${formatKES(goal.weekly)} a week to still make it. ${when}.`;
  return `${formatKES(goal.weekly)} a week, about ${formatKES(goal.monthly)} a month. ${when}.`;
};

// The same sum as the server, for the preview while typing.
export const weeklyFor = (target, saved, dueDate, today) => {
  const days = Math.round((new Date(dueDate) - new Date(today)) / 86400000);
  const remaining = Math.max(target - saved, 0);
  if (!dueDate || days <= 0 || remaining === 0) return null;
  return Math.ceil(((remaining / days) * 7) / 10) * 10;
};
