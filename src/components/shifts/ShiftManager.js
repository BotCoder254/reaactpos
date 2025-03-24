import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiCalendar, FiClock, FiUsers, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import ShiftCalendar from './ShiftCalendar';
import ShiftForm from './ShiftForm';
import AttendanceLog from './AttendanceLog';
import ShiftAnalytics from './ShiftAnalytics';
import { getShifts, getAttendanceLogs, getShiftAnalytics } from '../../utils/shiftQueries';
import toast from 'react-hot-toast';

export default function ShiftManager() {
  const { currentUser, userRole } = useAuth();
  const [view, setView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      
      const [shiftsData, attendanceData, analyticsData] = await Promise.all([
        getShifts(start, end, userRole === 'cashier' ? currentUser?.uid : null),
        getAttendanceLogs(start, end),
        userRole === 'manager' ? getShiftAnalytics(start, end) : null
      ]);

      setShifts(shiftsData || []);
      setAttendance(attendanceData || []);
      setAnalytics(analyticsData);
      setRetryCount(0); // Reset retry count on successful fetch
    } catch (error) {
      console.error('Error fetching shift data:', error);
      setError('Failed to load shift data. Please try again.');
      toast.error('Failed to load shift data');
      
      // Retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, view, userRole, currentUser?.uid, retryCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePreviousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchData();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
        {userRole === 'manager' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingShift(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Add New Shift
          </motion.button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-4">
            <button
              onClick={() => setView('calendar')}
              className={`py-4 px-6 inline-flex items-center ${
                view === 'calendar'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiCalendar className="mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setView('attendance')}
              className={`py-4 px-6 inline-flex items-center ${
                view === 'attendance'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiClock className="mr-2" />
              Attendance
            </button>
            {userRole === 'manager' && (
              <button
                onClick={() => setView('analytics')}
                className={`py-4 px-6 inline-flex items-center ${
                  view === 'analytics'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiBarChart2 className="mr-2" />
                Analytics
              </button>
            )}
          </nav>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold">
            {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d, yyyy')}
          </h3>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiRefreshCw className="mr-2" />
                Retry
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {view === 'calendar' && (
                  <ShiftCalendar
                    shifts={shifts}
                    currentDate={currentDate}
                    onShiftClick={userRole === 'manager' ? setIsAddingShift : undefined}
                  />
                )}
                {view === 'attendance' && (
                  <AttendanceLog
                    attendance={attendance}
                    shifts={shifts}
                    userRole={userRole}
                  />
                )}
                {view === 'analytics' && userRole === 'manager' && (
                  <ShiftAnalytics analytics={analytics} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Add/Edit Shift Modal */}
      <AnimatePresence>
        {isAddingShift && (
          <ShiftForm
            onClose={() => setIsAddingShift(false)}
            onSuccess={() => {
              setIsAddingShift(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 