import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { buildChange, buildCurve, inMonths, total } from "@/lib/dashboard";
import { categoryLabel } from "@/lib/categories";
import { compactNumber, formatDate, formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";
import AnimatedAmount from "./AnimatedAmount";

const shortDate = (date) =>
  date
    ? new Date(`${date}T00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
    : "";

const CurveTooltip = ({ active, payload }) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const rows = [];
  if (point.running !== null) {
    rows.push([formatKES(point.running), "spent so far"], [formatKES(point.spent), "on this day"]);
  }
  if (point.previousRunning !== null) {
    rows.push([formatKES(point.previousRunning), "same point, period before"]);
  }
  return <ChartTooltip title={formatDate(point.date ?? point.previousDate)} rows={rows} />;
};

const HeroCurve = ({ expenses, period, category, today }) => {
  const reduceMotion = useReducedMotion();
  const curve = useMemo(
    () => buildCurve(expenses, period, period.partial ? today : null),
    [expenses, period, today]
  );
  const spent = total(inMonths(expenses, period.months));
  const change = buildChange(curve);
  const dates = curve.map((point) => point.date).filter(Boolean);
  const ticks = [dates[0], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]];
  const todayPoint = period.partial && curve.findLast((point) => point.running !== null);

  return (
    <div className="relative flex min-h-96 flex-col overflow-hidden rounded-2xl bg-hero p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/70">
            Spent on {category ? categoryLabel(category) : "everything"}, {period.label.toLowerCase()}
          </p>
          <AnimatedAmount
            value={spent}
            className="mt-0.5 block text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
          />
          {change && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/85">
              {change.percent === 0 ? (
                `About the same as the period before (${formatKES(change.previous)})`
              ) : (
                <>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                      change.percent > 0
                        ? "bg-red-400/20 text-red-200"
                        : "bg-emerald-400/20 text-emerald-200"
                    )}
                  >
                    {change.percent > 0 ? (
                      <ArrowUpRight className="size-3" aria-hidden />
                    ) : (
                      <ArrowDownRight className="size-3" aria-hidden />
                    )}
                    {Math.abs(change.percent)}%
                  </span>
                  {change.percent > 0 ? "more" : "less"} than the period before (
                  {formatKES(change.previous)})
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-4 text-xs text-white/70">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-hero-line" />
            {period.label}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-white/45" />
            Period before
          </span>
        </div>
      </div>

      <div
        className="mt-3 min-h-44 flex-1"
        role="img"
        aria-label={`Running spending total for ${period.label}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curve} margin={{ top: 8, right: 8, bottom: 0, left: 12 }}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--hero-line)" stopOpacity={0.4} />
                <stop offset="1" stopColor="var(--hero-line)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              ticks={ticks}
              interval={0}
              padding={{ left: 10, right: 10 }}
              tickFormatter={shortDate}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,.6)", fontSize: 11 }}
            />
            <YAxis
              orientation="right"
              width={38}
              tickCount={3}
              tickFormatter={compactNumber}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,.6)", fontSize: 11 }}
            />
            <Tooltip
              content={<CurveTooltip />}
              cursor={{ stroke: "rgba(255,255,255,.4)" }}
              isAnimationActive={false}
            />
            <Line
              dataKey="previousRunning"
              stroke="rgba(255,255,255,.45)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Area
              dataKey="running"
              stroke="var(--hero-line)"
              strokeWidth={2.5}
              fill="url(#heroFill)"
              dot={false}
              activeDot={{ r: 5, fill: "#fff", stroke: "none" }}
              isAnimationActive={!reduceMotion}
              animationDuration={900}
            />
            {todayPoint && (
              <ReferenceDot x={todayPoint.date} y={todayPoint.running} r={5} fill="#fff" stroke="none" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HeroCurve;
