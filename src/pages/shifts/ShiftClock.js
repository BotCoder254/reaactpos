import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import ShiftClock from '../../components/shifts/ShiftClock';
import { Navigate } from 'react-router-dom';

export default function ShiftClockPage() {
  const { currentUser, userRole } = useAuth();

  // Redirect managers to schedule page
  if (userRole === 'manager') {
    return <Navigate to="/shifts/schedule" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Clock In/Out</h1>
        <ShiftClock />
      </motion.div>
    </div>
  );
} 