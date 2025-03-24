import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ShiftManager from '../components/shifts/ShiftManager';
import ShiftCalendar from '../components/shifts/ShiftCalendar';
import AttendanceLog from '../components/shifts/AttendanceLog';
import ShiftAnalytics from '../components/shifts/ShiftAnalytics';
import ShiftNotifications from '../components/shifts/ShiftNotifications';

export default function ShiftManagement() {
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Shift Management
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow-sm rounded-lg"
            >
              {userRole === 'manager' ? (
                <ShiftManager />
              ) : (
                <div className="space-y-6 p-6">
                  <ShiftCalendar />
                  <AttendanceLog />
                  <ShiftNotifications />
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
} 