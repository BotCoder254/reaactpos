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

  // Safety check for empty peak hours and ensure proper data structure
  const peakHours = analytics.peakHours || {};
  const peakHourEntries = Object.entries(peakHours).filter(([hour, count]) => 
    !isNaN(parseInt(hour)) && !isNaN(count)
  );
  
  const peakHour = peakHourEntries.length > 0 
    ? peakHourEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0] + ':00'
    : 'N/A';

  const formatChange = (value) => {
    if (!value || isNaN(parseFloat(value))) return '0%';
    const numValue = parseFloat(value);
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  const getChangeType = (value) => {
    if (!value || isNaN(parseFloat(value))) return 'neutral';
    const numValue = parseFloat(value);
    return numValue > 0 ? 'positive' : numValue < 0 ? 'negative' : 'neutral';
  };

  // Ensure all required analytics values exist with defaults
  const {
    totalShifts = 0,
    totalHours = 0,
    attendanceRate = 0,
    shiftsPerDay = {},
    changes = { shifts: 0, hours: 0, attendance: 0 }
  } = analytics;

  const stats = [
    {
      name: 'Total Shifts',
      value: totalShifts,
      icon: FiCalendar,
      change: formatChange(changes.shifts),
      changeType: getChangeType(changes.shifts)
    },
    {
      name: 'Total Hours',
      value: `${Math.round(totalHours)}h`,
      icon: FiClock,
      change: formatChange(changes.hours),
      changeType: getChangeType(changes.hours)
    },
    {
      name: 'Attendance Rate',
      value: `${Math.round(attendanceRate)}%`,
      icon: FiUsers,
      change: formatChange(changes.attendance),
      changeType: getChangeType(changes.attendance)
    },
    {
      name: 'Peak Hour',
      value: peakHour,
      icon: FiTrendingUp,
      change: 'Current period',
      changeType: 'neutral'
    }
  ];

  // Filter and validate shiftsPerDay data
  const validShiftsPerDay = Object.entries(shiftsPerDay)
    .filter(([date, count]) => !isNaN(new Date(date).getTime()) && !isNaN(count))
    .reduce((acc, [date, count]) => {
      acc[date] = count;
      return acc;
    }, {});

  // Calculate max values safely
  const maxShiftsPerDay = Object.values(validShiftsPerDay).length > 0
    ? Math.max(...Object.values(validShiftsPerDay))
    : 1;

  const maxPeakHours = peakHourEntries.length > 0
    ? Math.max(...peakHourEntries.map(([_, count]) => count))
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
          {Object.keys(validShiftsPerDay).length > 0 ? (
            <div className="flex h-full items-end space-x-2">
              {Object.entries(validShiftsPerDay).map(([date, count], index) => (
                <motion.div
                  key={date}
                  initial={{ height: 0 }}
                  animate={{ height: `${(count / maxShiftsPerDay) * 100}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="flex-1 bg-primary-100 rounded-t"
                >
                  <div className="px-2 py-1 text-xs text-center">
                    <div className="font-medium text-primary-700">{count}</div>
                    <div className="text-gray-500">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
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
          {peakHourEntries.length > 0 ? (
            <div className="flex h-full items-end space-x-1">
              {peakHourEntries.map(([hour, count], index) => (
                <motion.div
                  key={hour}
                  initial={{ height: 0 }}
                  animate={{ height: `${(count / maxPeakHours) * 100}%` }}
                  transition={{ delay: index * 0.02, duration: 0.5 }}
                  className="flex-1 bg-primary-100 rounded-t"
                >
                  <div className="px-1 py-1 text-xs text-center">
                    <div className="font-medium text-primary-700">{count}</div>
                    <div className="text-gray-500">{`${hour.padStart(2, '0')}:00`}</div>
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