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
  const categories = data?.map((item) => item.category);
  const totals = data?.map((item) => item.total);

  const BarData = {
    labels: categories,
    datasets: [
      {
        label: "Total per Category",
        data: totals,
        backgroundColor: "rgba(96, 165, 250, 0.7)",
        hoverBackgroundColor: "rgba(37, 99, 235, 1)",
        borderRadius: 4,
        barPercentage: 0.7,
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
        text: "Expenses by Category",
        color: "#4B5563",
        font: {
          size: 16,
          weight: "bold",
        },
        padding: {
          top: 5,
          bottom: 15,
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
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#6B7280",
          font: {
            weight: "500",
            size: 11, // Smaller on mobile
          },
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10, // Limit number of labels shown on mobile
        },
        grid: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#6B7280",
          font: {
            weight: "500",
            size: 10, // Smaller on mobile
          },
          callback: function (value) {
            // Compact number formatting for mobile
            if (value >= 1000000) {
              return `Sh. ${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `Sh. ${(value / 1000).toFixed(1)}K`;
            }
            return `Sh. ${value}`;
          },
          maxTicksLimit: 6,
          padding: 8,
        },
        grid: {
          color: "#E5E7EB",
          drawBorder: false,
        },
        border: {
          dash: [4, 4],
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      bar: {
        borderWidth: 0,
      },
    },
    // Horizontal scrolling for many categories
    indexAxis: "x",
  };

  // Optional: Handle many categories by rotating labels more
  const hasManyCategories = categories?.length > 8;
  if (hasManyCategories) {
    options.scales.x.ticks.maxRotation = 90;
    options.scales.x.ticks.minRotation = 45;
    options.scales.x.ticks.font.size = 10;
  }

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
      {data?.length > 0 ? (
        <Bar
          data={BarData}
          options={options}
          key={categories?.length} // Re-render when data changes
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-gray-500 text-center">
            No category expense data available
          </p>
        </div>
      )}
    </div>
  );
};

export default BarChart2;
