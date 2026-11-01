import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useTheme } from "@/hooks/useTheme";
import { chartTokens } from "./chartTokens";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ActiveUsersChart = ({ data = [] }) => {
  const theme = useTheme();

  const { chartData, options } = useMemo(() => {
    const t = chartTokens();
    return {
      chartData: {
        labels: months,
        datasets: [
          {
            label: "Active users",
            data: months.map(
              (_, index) => data.find((item) => item.month === index + 1)?.active_users ?? 0
            ),
            borderColor: t.mark,
            backgroundColor: t.mark,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHitRadius: 20,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: { ...t.tooltip, displayColors: false },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: t.grid },
            ticks: { color: t.tick, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: t.grid },
            border: { display: false },
            ticks: { color: t.tick, font: { size: 11 }, precision: 0, maxTicksLimit: 5 },
          },
        },
      },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- theme changes the CSS variables read inside
  }, [data, theme]);

  return <Line data={chartData} options={options} />;
};

export default ActiveUsersChart;
