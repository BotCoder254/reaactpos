import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiTrendingUp, FiCalendar } from 'react-icons/fi';

export default function ShiftAnalytics({ analytics }) {
  if (!analytics) {
    return (
      <div className="text-center text-gray-500 py-8">
        No analytics data available
      </div>
    );
  }

  // Safety check for empty peak hours
  const peakHourEntries = Object.entries(analytics.peakHours || {});
  const peakHour = peakHourEntries.length > 0 
    ? peakHourEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0] + ':00'
    : 'N/A';

  const stats = [
    {
      name: 'Total Shifts',
      value: analytics.totalShifts || 0,
      icon: FiCalendar,
      change: '+4.75%',
      changeType: 'positive'
    },
    {
      name: 'Total Hours',
      value: `${Math.round(analytics.totalHours || 0)}h`,
      icon: FiClock,
      change: '+1.23%',
      changeType: 'positive'
    },
    {
      name: 'Attendance Rate',
      value: `${Math.round(analytics.attendanceRate || 0)}%`,
      icon: FiUsers,
      change: '-0.32%',
      changeType: 'negative'
    },
    {
      name: 'Peak Hour',
      value: peakHour,
      icon: FiTrendingUp,
      change: 'No change',
      changeType: 'neutral'
    }
  ];

  // Safety check for empty data
  const shiftsPerDay = analytics.shiftsPerDay || {};
  const peakHours = analytics.peakHours || {};

  // Get max values safely
  const maxShiftsPerDay = Object.values(shiftsPerDay).length > 0 
    ? Math.max(...Object.values(shiftsPerDay))
    : 1;
  
  const maxPeakHours = Object.values(peakHours).length > 0
    ? Math.max(...Object.values(peakHours))
    : 1;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-primary-100 text-primary-600">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className={`text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' :
                stat.changeType === 'negative' ? 'text-red-600' :
                'text-gray-500'
              }`}>
                {stat.change} from last period
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Shifts per Day Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shifts per Day</h3>
        <div className="h-64">
          {Object.keys(shiftsPerDay).length > 0 ? (
            <div className="flex h-full items-end space-x-2">
              {Object.entries(shiftsPerDay).map(([date, count], index) => (
                <motion.div
                  key={date}
                  initial={{ height: 0 }}
                  animate={{ height: `${(count / maxShiftsPerDay) * 100}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="flex-1 bg-primary-100 rounded-t"
                >
                  <div className="px-2 py-1 text-xs text-center">
                    <div className="font-medium text-primary-700">{count}</div>
                    <div className="text-gray-500">{date}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No shift data available
            </div>
          )}
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Peak Hours</h3>
        <div className="h-64">
          {Object.keys(peakHours).length > 0 ? (
            <div className="flex h-full items-end space-x-1">
              {Object.entries(peakHours).map(([hour, count], index) => (
                <motion.div
                  key={hour}
                  initial={{ height: 0 }}
                  animate={{ height: `${(count / maxPeakHours) * 100}%` }}
                  transition={{ delay: index * 0.02, duration: 0.5 }}
                  className="flex-1 bg-primary-100 rounded-t"
                >
                  <div className="px-1 py-1 text-xs text-center">
                    <div className="font-medium text-primary-700">{count}</div>
                    <div className="text-gray-500">{hour}:00</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No peak hours data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 