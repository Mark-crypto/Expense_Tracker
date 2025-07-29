import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart1 = ({ data }) => {
  const months = data.map((item) => item.month);
  const totals = data.map((item) => item.monthly_sum);

  const BarData = {
    labels: months,
    datasets: [
      {
        label: "Total Expenses",
        data: totals,
        backgroundColor: "rgba(128, 90, 213, 0.7)",
        hoverBackgroundColor: "rgba(107, 70, 193, 1)",
        borderRadius: 6,
        barThickness: 30,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Monthly Expenses Summary",
        color: "#4B5563",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Sh. ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#6B7280",
          font: {
            weight: "bold",
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: "#6B7280",
          font: {
            weight: "bold",
          },
          callback: function (value) {
            return `Sh. ${value}`;
          },
        },
        grid: {
          color: "#E5E7EB",
        },
      },
    },
  };

  return (
    <div className="h-96 w-full">
      <Bar options={options} data={BarData} />
    </div>
  );
};

export default BarChart1;
