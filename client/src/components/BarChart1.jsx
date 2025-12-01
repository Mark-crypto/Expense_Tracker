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
  const months = data?.map((item) => item.month);
  const totals = data?.map((item) => item.monthly_sum);

  const BarData = {
    labels: months,
    datasets: [
      {
        label: "Total Expenses",
        data: totals,
        backgroundColor: "rgba(128, 90, 213, 0.7)",
        hoverBackgroundColor: "rgba(107, 70, 193, 1)",
        borderRadius: 6,
        barPercentage: 0.7, // Adjust bar width automatically
        categoryPercentage: 0.8,
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
          size: 16,
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
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#fff",
        bodyColor: "#fff",
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#6B7280",
          font: {
            weight: "bold",
            size: 12, // Smaller font on mobile
          },
          maxRotation: 45, // Rotate labels on mobile
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#6B7280",
          font: {
            weight: "bold",
            size: 11, // Smaller font on mobile
          },
          callback: function (value) {
            // Format large numbers with K or M suffix for mobile
            if (value >= 1000000) {
              return `Sh. ${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `Sh. ${(value / 1000).toFixed(1)}K`;
            }
            return `Sh. ${value}`;
          },
          maxTicksLimit: 6, // Limit number of ticks on mobile
        },
        grid: {
          color: "#E5E7EB",
        },
      },
    },
    // Mobile-specific adjustments
    interaction: {
      intersect: false,
      mode: "index",
    },
    // Adjust bar thickness based on screen size
    // This will be handled by barPercentage instead
  };

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
      {data?.length > 0 ? (
        <Bar data={BarData} options={options} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-center p-4">
            No monthly expense data available
          </p>
        </div>
      )}
    </div>
  );
};

export default BarChart1;
