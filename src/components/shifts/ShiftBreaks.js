import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiCoffee, FiClock, FiPlay, FiPause, FiRotateCcw, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { getBreakHistory } from '../../utils/shiftQueries';
import toast from 'react-hot-toast';

const BREAK_TYPES = {
  SHORT: { label: 'Short Break', duration: 15, color: 'blue' },
  LUNCH: { label: 'Lunch Break', duration: 30, color: 'green' },
  EXTENDED: { label: 'Extended Break', duration: 45, color: 'yellow' }
};

export default function ShiftBreaks() {
  const { currentUser, userRole } = useAuth();
  const { shifts, attendance, updateBreakStatus } = useShift();
  const [activeBreak, setActiveBreak] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState('SHORT');
  const [breakHistory, setBreakHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && timer < BREAK_TYPES[selectedBreakType].duration * 60) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const newTimer = prevTimer + 1;
          if (newTimer >= BREAK_TYPES[selectedBreakType].duration * 60) {
            setIsRunning(false);
            handleBreakComplete();
          }
          return newTimer;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, selectedBreakType]);

  useEffect(() => {
    fetchBreakHistory();
  }, [currentUser]);

  const fetchBreakHistory = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      // Get current week's date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const history = await getBreakHistory(currentUser.uid, startDate, endDate);
      
      if (Array.isArray(history)) {
        // Filter out any invalid records and ensure all required fields exist
        const validHistory = history.filter(record => 
          record && record.type && BREAK_TYPES[record.type] && record.startTime
        );
        setBreakHistory(validHistory);
      } else {
        setBreakHistory([]);
      }
    } catch (error) {
      console.error('Error fetching break history:', error);
      toast.error('Failed to load break history');
      setBreakHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartBreak = async () => {
    try {
      setLoading(true);
      const currentTime = new Date();
      const newBreak = {
        type: selectedBreakType,
        startTime: currentTime,
        duration: BREAK_TYPES[selectedBreakType].duration,
        status: 'active'
      };

      await updateBreakStatus({
        employeeId: currentUser.uid,
        breakData: newBreak
      });

      setActiveBreak(newBreak);
      setIsRunning(true);
      toast.success(`Started ${BREAK_TYPES[selectedBreakType].label}`);
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error(error.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseBreak = async () => {
    try {
      setLoading(true);
      await updateBreakStatus({
        employeeId: currentUser.uid,
        breakId: activeBreak.id,
        status: 'paused'
      });
      setIsRunning(false);
    } catch (error) {
      console.error('Error pausing break:', error);
      toast.error('Failed to pause break');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeBreak = async () => {
    try {
      setLoading(true);
      await updateBreakStatus({
        employeeId: currentUser.uid,
        breakId: activeBreak.id,
        status: 'active'
      });
      setIsRunning(true);
    } catch (error) {
      console.error('Error resuming break:', error);
      toast.error('Failed to resume break');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakComplete = async () => {
    try {
      setLoading(true);
      await updateBreakStatus({
        employeeId: currentUser.uid,
        breakId: activeBreak.id,
        status: 'completed',
        endTime: new Date()
      });
      
      setActiveBreak(null);
      setTimer(0);
      setIsRunning(false);
      fetchBreakHistory();
      toast.success(`${BREAK_TYPES[selectedBreakType].label} completed`);
    } catch (error) {
      console.error('Error completing break:', error);
      toast.error('Failed to complete break');
    } finally {
      setLoading(false);
    }
  };

  const handleResetBreak = async () => {
    try {
      setLoading(true);
      await updateBreakStatus({
        employeeId: currentUser.uid,
        breakId: activeBreak.id,
        status: 'cancelled'
      });
      
      setTimer(0);
      setIsRunning(false);
      setActiveBreak(null);
      fetchBreakHistory();
    } catch (error) {
      console.error('Error resetting break:', error);
      toast.error('Failed to reset break');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    const maxSeconds = BREAK_TYPES[selectedBreakType].duration * 60;
    return (timer / maxSeconds) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-center mb-8">
          <FiCoffee className="mx-auto h-12 w-12 text-primary-500" />
          <h2 className="mt-2 text-xl font-semibold text-gray-900">Break Timer</h2>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Break Type Selection */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Object.entries(BREAK_TYPES).map(([type, { label, duration, color }]) => (
            <button
              key={type}
              onClick={() => !isRunning && setSelectedBreakType(type)}
              className={`
                p-4 rounded-lg text-center transition-colors
                ${selectedBreakType === type
                  ? `bg-${color}-100 border-2 border-${color}-500 text-${color}-700`
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }
                ${isRunning || loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={isRunning || loading}
            >
              <div className="font-medium">{label}</div>
              <div className="text-sm text-gray-500">{duration} mins</div>
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          <div className="flex justify-center items-center">
            <div className="text-4xl font-bold text-gray-900">
              {formatTime(timer)}
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${BREAK_TYPES[selectedBreakType].color}-500 transition-all duration-1000`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500 text-center">
            {BREAK_TYPES[selectedBreakType].duration - Math.floor(timer / 60)} minutes remaining
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!isRunning && !activeBreak && (
            <button
              onClick={handleStartBreak}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiPlay className="mr-2" />
                  Start Break
                </>
              )}
            </button>
          )}
          {isRunning && (
            <button
              onClick={handlePauseBreak}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiPause className="mr-2" />
                  Pause
                </>
              )}
            </button>
          )}
          {!isRunning && activeBreak && (
            <>
              <button
                onClick={handleResumeBreak}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiPlay className="mr-2" />
                    Resume
                  </>
                )}
              </button>
              <button
                onClick={handleResetBreak}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <>
                    <FiRotateCcw className="mr-2" />
                    Reset
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Break History */}
        {(userRole === 'manager' || breakHistory.length > 0) && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Break History</h3>
            <div className="space-y-4">
              {breakHistory.map((breakRecord) => (
                <motion.div
                  key={breakRecord.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    breakRecord.status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : breakRecord.status === 'cancelled'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {BREAK_TYPES[breakRecord.type].label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(breakRecord.startTime), 'MMM d, h:mm a')}
                        {breakRecord.endTime && ` - ${format(new Date(breakRecord.endTime), 'h:mm a')}`}
                      </div>
                    </div>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${breakRecord.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : breakRecord.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }
                    `}>
                      {breakRecord.status.charAt(0).toUpperCase() + breakRecord.status.slice(1)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
