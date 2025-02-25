import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiUsers, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import { getDiscountAnalytics } from '../../utils/discountQueries';

export default function DiscountAnalytics({ discountId }) {
  const [analytics, setAnalytics] = useState({
    totalSavings: 0,
    usageCount: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getDiscountAnalytics(discountId);
        setAnalytics({
          ...data,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching discount analytics:', error);
        setAnalytics(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load analytics'
        }));
      }
    };

    fetchAnalytics();
  }, [discountId]);

  const stats = [
    {
      name: 'Total Savings',
      value: `$${analytics.totalSavings.toFixed(2)}`,
      icon: FiDollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Usage Count',
      value: analytics.usageCount,
      icon: FiUsers,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Avg. Order Value',
      value: `$${analytics.averageOrderValue.toFixed(2)}`,
      icon: FiShoppingCart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Conversion Rate',
      value: `${(analytics.conversionRate * 100).toFixed(1)}%`,
      icon: FiTrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    }
  ];

  if (analytics.loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{analytics.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}
              >
                <stat.icon
                  className={`h-6 w-6 ${stat.color}`}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 