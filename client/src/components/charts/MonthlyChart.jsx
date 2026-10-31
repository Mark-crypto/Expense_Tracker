import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useTheme } from "@/hooks/useTheme";
import { formatKES } from "@/lib/format";
import { chartTokens, compactNumber } from "./chartTokens";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const MonthlyChart = ({ data = [] }) => {
  const theme = useTheme();

  const options = useMemo(() => {
    const t = chartTokens();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...t.tooltip,
          displayColors: false,
          callbacks: { label: (ctx) => formatKES(ctx.parsed.y) },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: t.grid },
          ticks: {
            color: t.tick,
            font: { size: 11 },
            callback(value) {
              return String(this.getLabelForValue(value)).slice(0, 3);
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: t.grid },
          border: { display: false },
          ticks: {
            color: t.tick,
            font: { size: 11 },
            maxTicksLimit: 5,
            callback: compactNumber,
          },
        },
      },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- theme changes the CSS variables read inside
  }, [theme]);

  const chartData = useMemo(() => {
    const t = chartTokens();
    return {
      labels: data.map((item) => item.month),
      datasets: [
        {
          label: "Spent",
          data: data.map((item) => Number(item.monthly_sum)),
          backgroundColor: t.mark,
          borderRadius: { topLeft: 4, topRight: 4 },
          borderSkipped: "bottom",
          maxBarThickness: 28,
        },
      ],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- theme changes the CSS variables read inside
  }, [data, theme]);

  return <Bar data={chartData} options={options} />;
};

export default MonthlyChart;
