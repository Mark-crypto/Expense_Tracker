import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { compactNumber, formatDate, formatKES } from "@/lib/format";

const axisTick = { fill: "rgba(255,255,255,.6)", fontSize: 11 };

const shortDate = (date) =>
  date ? new Date(`${date}T00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "";

const CurveTooltip = ({ active, payload }) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const rows = [];
  if (point.actual !== undefined) rows.push([formatKES(point.actual), "spent so far"]);
  if (point.forecast !== undefined && point.actual === undefined) {
    rows.push([formatKES(point.forecast), "forecast"]);
    rows.push([`${compactNumber(point.low)} to ${compactNumber(point.high)}`, "likely range"]);
  }
  if (point.bill) rows.push([formatKES(point.bill), "bill due"]);
  return <ChartTooltip title={formatDate(point.date)} rows={rows} />;
};

// Savings from the what-if controls build up across the days left.
const applySaving = (curve, saved, today) => {
  const remaining = curve.filter((point) => point.date > today).length;
  let step = 0;
  return curve.map((point) => {
    if (point.date <= today) return { ...point, band: point.low !== undefined ? [point.low, point.high] : undefined };
    step += 1;
    const cut = remaining ? (saved * step) / remaining : 0;
    const low = point.low - cut;
    const high = point.high - cut;
    return { ...point, forecast: Math.round(point.forecast - cut), low: Math.round(low), high: Math.round(high), band: [low, high] };
  });
};

const ForecastCurve = ({ forecast, saved }) => {
  const reduceMotion = useReducedMotion();
  const data = useMemo(() => applySaving(forecast.curve, saved, forecast.today), [forecast, saved]);
  const todayPoint = data.find((point) => point.date === forecast.today);
  const dates = data.map((point) => point.date);
  const ticks = [dates[0], dates[Math.floor(dates.length / 2)], dates.at(-1)];

  return (
    <div className="mt-3 h-64 sm:h-72" role="img" aria-label="Spending so far and forecast to the end of the month">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 12 }}>
          <defs>
            <linearGradient id="spentFill" x1="0" y1="0" x2="0" y2="1">
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
            tick={axisTick}
          />
          <YAxis
            orientation="right"
            width={40}
            tickCount={4}
            tickFormatter={compactNumber}
            axisLine={false}
            tickLine={false}
            tick={axisTick}
          />
          <Tooltip content={<CurveTooltip />} cursor={{ stroke: "rgba(255,255,255,.4)" }} isAnimationActive={false} />
          <Area dataKey="band" stroke="none" fill="var(--hero-line)" fillOpacity={0.14} isAnimationActive={false} activeDot={false} />
          <Area
            dataKey="actual"
            stroke="var(--hero-line)"
            strokeWidth={2.5}
            fill="url(#spentFill)"
            dot={false}
            activeDot={{ r: 5, fill: "#fff", stroke: "none" }}
            isAnimationActive={!reduceMotion}
          />
          <Line
            dataKey="forecast"
            stroke="var(--hero-line)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 5, fill: "#fff", stroke: "none" }}
            isAnimationActive={false}
          />
          {forecast.budgetLimit > 0 && (
            <ReferenceLine
              y={forecast.budgetLimit}
              stroke="rgba(255,255,255,.45)"
              strokeDasharray="2 4"
              label={{ value: "Budgets", position: "insideBottomRight", fill: "rgba(255,255,255,.65)", fontSize: 11 }}
            />
          )}
          {data
            .filter((point) => point.bill)
            .map((point) => (
              <ReferenceDot key={point.date} x={point.date} y={point.forecast} r={3.5} fill="#fff" stroke="none" />
            ))}
          {todayPoint && <ReferenceDot x={todayPoint.date} y={todayPoint.actual} r={5} fill="#fff" stroke="var(--hero-line)" strokeWidth={2} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastCurve;
