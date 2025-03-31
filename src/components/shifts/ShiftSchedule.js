import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { FiPlus, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import ShiftForm from './ShiftForm';
import ShiftCalendar from './ShiftCalendar';
import toast from 'react-hot-toast';

export default function ShiftSchedule() {
  const { userRole } = useAuth();
  const { shifts, loading, error } = useShift();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const handlePreviousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const handleShiftClick = (shift) => {
    if (userRole === 'manager') {
      setSelectedShift(shift);
      setIsAddingShift(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Shifts</h2>
          {userRole === 'manager' && (
            <button
              onClick={() => {
                setSelectedShift(null);
                setIsAddingShift(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <FiPlus className="mr-2" />
              Add Shift
            </button>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePreviousWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center">
            <FiCalendar className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d, yyyy')}
            </span>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ShiftCalendar
              shifts={shifts}
              currentDate={currentDate}
              onShiftClick={handleShiftClick}
            />
          </motion.div>
        )}
      </div>

      {isAddingShift && (
        <ShiftForm
          shift={selectedShift}
          onClose={() => {
            setIsAddingShift(false);
            setSelectedShift(null);
          }}
          onSuccess={() => {
            setIsAddingShift(false);
            setSelectedShift(null);
            toast.success(selectedShift ? 'Shift updated successfully' : 'Shift created successfully');
          }}
        />
      )}
    </div>
  );
} 