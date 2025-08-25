import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, UserPlus, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';

const UserCard = ({ title, value, change, icon: Icon, trend, color, loading }) => {
  const trendColors = {
    up: { bg: 'bg-green-100', text: 'text-green-800', icon: TrendingUp },
    down: { bg: 'bg-red-100', text: 'text-red-800', icon: TrendingUp }
  };

  const TrendIcon = trendColors[trend].icon;

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 p-6"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          )}
          <div className="flex items-center mt-3">
            {loading ? (
              <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-full"></div>
            ) : (
              <span className={`${trendColors[trend].bg} ${trendColors[trend].text} text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center`}>
                <TrendIcon size={14} className="mr-1" />
                {change} 
              </span>
            )}
            <span className="text-sm text-gray-500 ml-2">from last week</span>
          </div>
        </div>
        <div className={`bg-${color}-100 p-3 rounded-lg`}>
          {loading ? (
            <div className="h-8 w-8 bg-gray-300 animate-pulse rounded"></div>
          ) : (
            <Icon size={32} className={`text-${color}-600`} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DashboardHeader = () => (
  <div className="mb-8">
    <motion.h1 
      className="text-3xl font-bold text-gray-800 mb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      User Analytics Dashboard
    </motion.h1>
    <motion.p 
      className="text-gray-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      Monitor your user base with real-time metrics and insights
    </motion.p>
  </div>
);

const UserStatsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    inactiveUsers: 0
  });

  // Simulate fetching data from server
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would come from your server API in a real application
      setUserData({
        totalUsers: 1248,
        activeUsers: 893,
        newUsers: 124,
        inactiveUsers: 355
      });
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate slightly changed data
      setUserData({
        totalUsers: 1253,
        activeUsers: 901,
        newUsers: 132,
        inactiveUsers: 352
      });
      setLoading(false);
    }, 1000);
  };

  const userCards = [
    {
      title: 'Total Users',
      value: userData.totalUsers,
      change: '+5.2%',
      icon: Users,
      trend: 'up',
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: userData.activeUsers,
      change: '+3.1%',
      icon: UserCheck,
      trend: 'up',
      color: 'green'
    },
    {
      title: 'New Users',
      value: userData.newUsers,
      change: '+12.4%',
      icon: UserPlus,
      trend: 'up',
      color: 'blue'
    },
    {
      title: 'Inactive Users',
      value: userData.inactiveUsers,
      change: '-2.3%',
      icon: UserX,
      trend: 'down',
      color: 'red'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">User Overview</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshData}
            disabled={loading}
            className="flex items-center text-purple-700 bg-purple-100 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <UserCard {...card} loading={loading} />
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800">Registration Source</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span>Direct</span>
                  <span className="font-medium">42%</span>
                </div>
                <div className="flex justify-between">
                  <span>Social Media</span>
                  <span className="font-medium">31%</span>
                </div>
                <div className="flex justify-between">
                  <span>Referral</span>
                  <span className="font-medium">27%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800">Active Sessions</h3>
              <p className="text-2xl font-bold mt-2">1,243</p>
              <div className="flex items-center mt-2">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  +8% 
                </span>
                <span className="text-sm text-gray-500 ml-2">from yesterday</span>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800">User Engagement</h3>
              <p className="text-2xl font-bold mt-2">4.2 min</p>
              <p className="text-sm text-gray-600">Average session duration</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserStatsDashboard;