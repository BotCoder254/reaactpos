import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getShifts, getShiftsForWeek, getAttendanceLogs } from '../utils/shiftQueries';
import AttendanceLog from '../components/shifts/AttendanceLog';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { format, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

export default function Shifts() {
  const { currentUser, userRole } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('day'); // 'day' or 'week'

  const fetchShifts = async (date) => {
    try {
      setLoading(true);
      let shiftsData;
      
      if (view === 'day') {
        const start = startOfDay(date);
        const end = endOfDay(date);
        shiftsData = await getShifts(
          start,
          end,
          userRole === 'cashier' ? currentUser.uid : null
        );
      } else {
        const start = startOfWeek(date);
        const end = endOfWeek(date);
        shiftsData = await getShiftsForWeek(
          start,
          end,
          userRole === 'cashier' ? currentUser.uid : null
        );
      }
      
      setShifts(shiftsData);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      if (error.code === 'failed-precondition') {
        toast.error('System configuration needed. Please contact administrator.');
      } else {
        toast.error('Failed to fetch shifts');
      }
    }
  };

  const fetchAttendance = async (date) => {
    try {
      let start, end;
      
      if (view === 'day') {
        start = startOfDay(date);
        end = endOfDay(date);
      } else {
        start = startOfWeek(date);
        end = endOfWeek(date);
      }
      
      const attendanceData = await getAttendanceLogs(
        start,
        end,
        userRole === 'cashier' ? currentUser.uid : null
      );
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchShifts(selectedDate);
      fetchAttendance(selectedDate);
    }
  }, [currentUser, selectedDate, view]);

  const handleDateChange = (direction) => {
    const newDate = direction === 'next' 
      ? (view === 'day' ? addDays(selectedDate, 1) : addDays(selectedDate, 7))
      : (view === 'day' ? subDays(selectedDate, 1) : subDays(selectedDate, 7));
    setSelectedDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
    // Reset to start of current week when switching to week view
    if (newView === 'week') {
      setSelectedDate(startOfWeek(selectedDate));
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Please log in to view shifts</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {userRole === 'manager' ? 'Shift Management' : 'My Shifts'}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-2">
            <button
              onClick={() => handleViewChange('day')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                view === 'day'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                view === 'week'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium">
              {view === 'day' 
                ? format(selectedDate, 'MMMM d, yyyy')
                : `Week of ${format(selectedDate, 'MMMM d, yyyy')}`
              }
            </span>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-gray-600">Loading shifts...</div>
        </div>
      ) : (
        <AttendanceLog 
          attendance={attendance} 
          shifts={shifts} 
          userRole={userRole}
          currentUser={currentUser}
          view={view}
          onUpdate={() => {
            fetchShifts(selectedDate);
            fetchAttendance(selectedDate);
          }}
        />
      )}
    </div>
  );
} 