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
      
      // Initialize arrays to store promises
      const promises = [];
      const results = [];

      // Add shifts promise
      promises.push(
        getShifts(start, end, userRole === 'cashier' ? currentUser?.uid : null)
          .then(data => {
            results[0] = data || [];
            return data;
          })
          .catch(error => {
            console.error('Error fetching shifts:', error);
            results[0] = [];
            throw error;
          })
      );

      // Add attendance promise
      promises.push(
        getAttendanceLogs(start, end)
          .then(data => {
            results[1] = data || [];
            return data;
          })
          .catch(error => {
            console.error('Error fetching attendance:', error);
            results[1] = [];
            throw error;
          })
      );

      // Add analytics promise only for managers
      if (userRole === 'manager') {
        promises.push(
          getShiftAnalytics(start, end)
            .then(data => {
              results[2] = data;
              return data;
            })
            .catch(error => {
              console.error('Error fetching analytics:', error);
              results[2] = null;
              throw error;
            })
        );
      }

      // Wait for all promises to settle
      await Promise.allSettled(promises);

      // Update state with results, even if some requests failed
      setShifts(results[0]);
      setAttendance(results[1]);
      if (userRole === 'manager') {
        setAnalytics(results[2]);
      }

      setRetryCount(0); // Reset retry count on any successful fetch
    } catch (error) {
      console.error('Error fetching shift data:', error);
      setError('Failed to load shift data. Please try again.');
      toast.error('Failed to load shift data');
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData();
        }, retryDelay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, userRole, currentUser?.uid, retryCount]);

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
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center px-4 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
            {userRole === 'manager' && (
              <button
                onClick={() => setIsAddingShift(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiPlus className="mr-2" />
                Add Shift
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FiCalendar className="h-5 w-5 text-gray-500" />
            </button>
            <span className="text-sm font-medium text-gray-900">
              {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d, yyyy')}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FiCalendar className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

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

      <div className="flex-1 overflow-auto p-4">
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

      {/* Add/Edit Shift Modal */}
      {isAddingShift && (
        <ShiftForm
          isOpen={isAddingShift}
          onClose={() => setIsAddingShift(false)}
          onSuccess={() => {
            setIsAddingShift(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
} 