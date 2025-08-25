import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Calendar, Download, RefreshCw } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineGraph = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [loading, setLoading] = useState(true);
  
  // Sample data - in a real app, this would come from an API
  const monthlyUserData = {
    '6months': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [120, 190, 300, 500, 250, 400]
    },
    '12months': {
      labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [80, 120, 190, 300, 500, 250, 400, 600, 750, 900, 800, 950]
    }
  };

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    // Simulate API fetch
    setLoading(true);
    const timer = setTimeout(() => {
      const data = monthlyUserData[timeRange];
      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: 'Active Users',
            data: data.data,
            borderColor: '#7e22ce',
            backgroundColor: 'rgba(126, 34, 206, 0.1)',
            pointBackgroundColor: '#7e22ce',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#7e22ce',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4
          }
        ]
      });
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#6b7280',
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          precision: 0
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const handleDownload = () => {
    // In a real app, this would export the chart data
    console.log('Downloading chart data...');
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate refreshed data with slight variations
      const data = monthlyUserData[timeRange];
      const newData = data.data.map(value => 
        Math.max(50, value + Math.floor(Math.random() * 100) - 50)
      );
      
      setChartData({
        labels: data.labels,
        datasets: [
          {
            ...chartData.datasets[0],
            data: newData
          }
        ]
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">User Growth</h2>
          <p className="text-gray-600 text-sm">Monthly active users overview</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTimeRange('6months')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '6months' ? 'bg-purple-600 text-white' : 'text-gray-600'}`}
            >
              6M
            </button>
            <button
              onClick={() => setTimeRange('12months')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '12months' ? 'bg-purple-600 text-white' : 'text-gray-600'}`}
            >
              12M
            </button>
          </div>
          
          <button
            onClick={refreshData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            title="Download chart"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      <div className="relative h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading chart data...</div>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
      
      <div className="mt-4 flex items-center text-sm text-gray-500">
        <TrendingUp size={16} className="mr-1" />
        <span>23% growth compared to previous period</span>
      </div>
    </div>
  );
};

export default LineGraph;