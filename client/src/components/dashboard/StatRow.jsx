import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import AnimatedAmount from "./AnimatedAmount";

const WIDTH = 200;
const HEIGHT = 34;

const Sparkline = ({ values, color }) => {
  if (values.length < 2) return <div className="mt-2 h-8" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const step = WIDTH / (values.length - 1);
  const y = (value) => HEIGHT - 4 - ((value - min) * (HEIGHT - 8)) / (max - min || 1);
  const line = values.map((value, i) => `${i ? "L" : "M"}${i * step} ${y(value)}`).join("");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="mt-2 h-8 w-full"
      aria-hidden
    >
      <path d={`${line}L${WIDTH} ${HEIGHT}L0 ${HEIGHT}Z`} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const StatRow = ({ stats }) => (
  <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Summary">
    {stats.map(({ label, value, trend, color, missing }) => (
      <Card key={label} className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        {missing ? (
          <>
            <p className="mt-1 text-sm font-medium">Not available yet</p>
            <Link to="/import" className="text-xs font-medium text-primary hover:underline">
              Import a statement
            </Link>
          </>
        ) : (
          <>
            <AnimatedAmount
              value={value}
              className="mt-0.5 block truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
            />
            <Sparkline values={trend} color={color} />
          </>
        )}
      </Card>
    ))}
  </section>
);

export default StatRow;
