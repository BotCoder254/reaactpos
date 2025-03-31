import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiClock, FiCheck, FiX, FiLock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import toast from 'react-hot-toast';

export default function ShiftClock() {
  const { currentUser } = useAuth();
  const { shifts, attendance, clockIn, clockOut } = useShift();
  const [pin, setPin] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);
  const [action, setAction] = useState(null); // 'in' or 'out'
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find current active shift and attendance
  const currentShift = shifts.find(shift => {
    const shiftDate = new Date(shift.startTime);
    return (
      shift.employeeId === currentUser.uid &&
      shiftDate.getDate() === currentTime.getDate() &&
      shiftDate.getMonth() === currentTime.getMonth() &&
      shiftDate.getFullYear() === currentTime.getFullYear()
    );
  });

  const currentAttendance = attendance.find(a => 
    a.shiftId === currentShift?.id && a.status === 'active'
  );

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handlePinClear = () => {
    setPin('');
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      if (action === 'in') {
        if (!currentShift) {
          throw new Error('No shift scheduled for current time');
        }
        const shiftStart = new Date(currentShift.startTime);
        const shiftEnd = new Date(currentShift.endTime);
        const now = new Date();

        if (now < shiftStart) {
          throw new Error('Cannot clock in before shift starts');
        }
        if (now > shiftEnd) {
          throw new Error('Cannot clock in after shift ends');
        }

        await clockIn(currentShift.id, pin);
        toast.success('Successfully clocked in');
      } else {
        if (!currentAttendance) {
          throw new Error('No active attendance record found');
        }
        await clockOut(currentAttendance.id, pin);
        toast.success('Successfully clocked out');
      }
      setShowPinPad(false);
      setPin('');
    } catch (error) {
      console.error('Clock action failed:', error);
      toast.error(error.message || 'Failed to process clock action');
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = (clockAction) => {
    setAction(clockAction);
    setShowPinPad(true);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-center">
          <FiClock className="mx-auto h-12 w-12 text-primary-500" />
          <h2 className="mt-2 text-xl font-semibold text-gray-900">Time Clock</h2>
          <p className="mt-1 text-sm text-gray-500">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </p>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {format(currentTime, 'h:mm:ss a')}
          </div>
        </div>

        {currentShift ? (
          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900">Current Shift</h3>
              <div className="mt-2 text-sm text-gray-500">
                {format(new Date(currentShift.startTime), 'h:mm a')} - {format(new Date(currentShift.endTime), 'h:mm a')}
              </div>
              {currentAttendance ? (
                <div className="mt-4">
                  <div className="text-sm text-green-600">
                    Clocked In: {format(new Date(currentAttendance.clockInTime), 'h:mm a')}
                  </div>
                  <button
                    onClick={() => handleClockAction('out')}
                    className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FiClock className="mr-2" />
                        Clock Out
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleClockAction('in')}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiClock className="mr-2" />
                      Clock In
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center text-sm text-gray-500">
            No shift scheduled for today
          </div>
        )}

        {showPinPad && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPinPad(false)}></div>
              <div className="relative bg-white rounded-lg p-8 max-w-sm w-full">
                <div className="text-center mb-6">
                  <FiLock className="mx-auto h-8 w-8 text-primary-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Enter PIN</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please enter your 4-digit PIN to {action === 'in' ? 'clock in' : 'clock out'}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-center space-x-4">
                    {[1,2,3,4].map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: i < pin.length ? '#4F46E5' : '#D1D5DB' }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3,4,5,6,7,8,9,'clear',0,'enter'].map((digit, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (digit === 'clear') handlePinClear();
                        else if (digit === 'enter') handlePinSubmit();
                        else handlePinInput(digit);
                      }}
                      disabled={loading}
                      className={`
                        p-4 text-center rounded-lg text-lg font-medium transition-colors
                        ${typeof digit === 'number'
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          : digit === 'clear'
                            ? 'bg-red-100 hover:bg-red-200 text-red-600'
                            : 'bg-green-100 hover:bg-green-200 text-green-600'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {digit === 'clear' ? <FiX className="mx-auto" /> :
                       digit === 'enter' ? <FiCheck className="mx-auto" /> :
                       digit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 