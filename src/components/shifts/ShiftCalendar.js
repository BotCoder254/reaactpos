import React from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { FiClock, FiUser } from 'react-icons/fi';

export default function ShiftCalendar({ shifts, currentDate, onShiftClick }) {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate)
  });

  const getShiftsForDay = (date) => {
    if (!shifts || !Array.isArray(shifts)) return [];
    
    return shifts.filter(shift => {
      if (!shift.startTime) return false;
      try {
        const shiftDate = typeof shift.startTime === 'string' ? parseISO(shift.startTime) : new Date(shift.startTime);
        return isSameDay(shiftDate, date);
      } catch (error) {
        console.error('Error parsing shift date:', error);
        return false;
      }
    });
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Calendar Header */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="h-12 flex items-center justify-center font-medium text-gray-500">
            Time
          </div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="h-12 flex flex-col items-center justify-center"
            >
              <span className="text-sm font-medium text-gray-900">
                {format(day, 'EEE')}
              </span>
              <span className="text-xs text-gray-500">
                {format(day, 'MMM d')}
              </span>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="space-y-2">
          {timeSlots.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2">
              {/* Time Label */}
              <div className="h-16 flex items-center justify-center text-sm text-gray-500">
                {format(new Date().setHours(hour), 'ha')}
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => {
                const dayShifts = getShiftsForDay(day).filter(shift => {
                  try {
                    const shiftStart = typeof shift.startTime === 'string' 
                      ? parseISO(shift.startTime) 
                      : new Date(shift.startTime);
                    return shiftStart.getHours() === hour;
                  } catch (error) {
                    console.error('Error parsing shift start time:', error);
                    return false;
                  }
                });

                return (
                  <div
                    key={dayIndex}
                    className="h-16 border-t border-gray-100 relative group"
                  >
                    {dayShifts.map((shift) => (
                      <motion.div
                        key={shift.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`absolute left-0 right-0 m-1 p-2 rounded-lg ${
                          shift.status === 'active'
                            ? 'bg-green-100 border-green-200'
                            : 'bg-blue-100 border-blue-200'
                        } border cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => onShiftClick && onShiftClick(shift)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FiClock className="text-gray-500" />
                            <span className="text-xs font-medium">
                              {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiUser className="text-gray-500" />
                            <span className="text-xs">{shift.cashierName || 'Unknown'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 