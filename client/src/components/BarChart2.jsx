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

const BarChart2 = ({ data }) => {
  const categories = data.map((item) => item.category);
  const totals = data.map((item) => item.total);

  const BarData = {
    labels: categories,
    datasets: [
      {
        label: "Total per Category",
        data: totals,
        backgroundColor: "rgba(96, 165, 250, 0.7)",
        hoverBackgroundColor: "rgba(37, 99, 235, 1)",
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
        text: "Expenses by Category",
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

export default BarChart2;
