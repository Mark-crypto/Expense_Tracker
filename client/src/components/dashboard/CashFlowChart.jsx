import { useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { categoryLabel } from "@/lib/categories";
import { compactNumber, formatKES } from "@/lib/format";

const tick = { fill: "var(--chart-tick)", fontSize: 11 };

const FlowTooltip = ({ active, payload, showIncome }) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const rows = [[formatKES(point.moneyOut), "money out"]];
  if (showIncome) {
    rows.unshift([formatKES(point.moneyIn), "money in"]);
    rows.push([formatKES(point.moneyIn - point.moneyOut), "left over"]);
  }
  return <ChartTooltip title={point.label} rows={rows} />;
};

const CashFlowChart = ({ data, category }) => {
  const reduceMotion = useReducedMotion();
  const showIncome = !category && data.some((month) => month.moneyIn > 0);

  return (
    <Card>
      <CardHeader
        title="Cash flow"
        description={category ? `${categoryLabel(category)} by month` : "Money in against money out, by month"}
      />
      <CardContent>
        {showIncome && (
          <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-chart-in" /> Money in
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary" /> Money out
            </span>
          </div>
        )}
        <div className="h-56" role="img" aria-label="Money in and out by month">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} margin={{ top: 4, right: 0, bottom: 0, left: -18 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tick} />
              <YAxis
                tickCount={4}
                tickFormatter={compactNumber}
                axisLine={false}
                tickLine={false}
                tick={tick}
              />
              <Tooltip
                content={<FlowTooltip showIncome={showIncome} />}
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                isAnimationActive={false}
              />
              {showIncome && (
                <Bar
                  dataKey="moneyIn"
                  fill="var(--chart-in)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={!reduceMotion}
                />
              )}
              <Bar
                dataKey="moneyOut"
                fill="var(--chart-mark)"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
                isAnimationActive={!reduceMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
