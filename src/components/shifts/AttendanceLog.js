import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiClock, FiCheck, FiX } from 'react-icons/fi';
import { clockIn, clockOut } from '../../utils/shiftQueries';
import toast from 'react-hot-toast';

export default function AttendanceLog({ attendance, shifts, userRole }) {
  const handleClockIn = async (shiftId) => {
    try {
      await clockIn(shiftId);
      toast.success('Clocked in successfully');
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Failed to clock in');
    }
  };

  const handleClockOut = async (attendanceId) => {
    try {
      await clockOut(attendanceId);
      toast.success('Clocked out successfully');
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('Failed to clock out');
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Shifts */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Shifts</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {shifts.map((shift) => {
              const attendanceRecord = attendance.find(a => a.shiftId === shift.id);
              const isActive = attendanceRecord?.status === 'active';

              return (
                <motion.li
                  key={shift.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {shift.cashierName}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiClock className="mr-1" />
                          {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    {userRole === 'cashier' && (
                      <div>
                        {!attendanceRecord ? (
                          <button
                            onClick={() => handleClockIn(shift.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <FiClock className="mr-1" />
                            Clock In
                          </button>
                        ) : isActive ? (
                          <button
                            onClick={() => handleClockOut(attendanceRecord.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                          >
                            <FiX className="mr-1" />
                            Clock Out
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full text-green-700 bg-green-100">
                            <FiCheck className="mr-1" />
                            Completed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.li>
              );
            })}
            {shifts.length === 0 && (
              <li className="p-4 text-center text-gray-500">
                No shifts scheduled for today
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Attendance History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance History</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cashier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record) => {
                const shift = shifts.find(s => s.id === record.shiftId);
                
                return (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.clockInTime), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shift?.cashierName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.clockInTime), 'h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockOutTime
                        ? format(new Date(record.clockOutTime), 'h:mm a')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 