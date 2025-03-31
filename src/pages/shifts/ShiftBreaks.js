import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import ShiftBreaks from '../../components/shifts/ShiftBreaks';

export default function ShiftBreaksPage() {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {userRole === 'manager' ? 'Break Management' : 'Break Timer'}
        </h1>
        <ShiftBreaks />
      </motion.div>
    </div>
  );
} 