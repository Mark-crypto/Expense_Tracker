import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const tick = { fill: "var(--chart-tick)", fontSize: 11 };

const UsersTooltip = ({ active, payload }) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <ChartTooltip title={point.month} rows={[[point.users, "active users"]]} />;
};

const ActiveUsersChart = ({ data = [] }) => {
  const chartData = months.map((month, index) => ({
    month,
    users: data.find((item) => item.month === index + 1)?.active_users ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={tick} />
        <YAxis allowDecimals={false} tickCount={4} axisLine={false} tickLine={false} tick={tick} />
        <Tooltip content={<UsersTooltip />} cursor={{ stroke: "var(--chart-tick)" }} />
        <Line
          dataKey="users"
          stroke="var(--chart-mark)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ActiveUsersChart;
