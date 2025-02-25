import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SalesGoalsComponent from '../components/dashboard/SalesGoals';

export default function SalesGoalsPage() {
  const { userRole } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sales Goals</h1>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'manager' 
              ? 'Set and monitor sales targets for your team'
              : 'View current sales goals and progress'
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <SalesGoalsComponent />
        </div>

        {userRole === 'manager' && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tips for Setting Goals</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Set realistic and achievable targets based on historical data</li>
              <li>• Consider seasonal variations and market conditions</li>
              <li>• Break down monthly goals into weekly and daily targets</li>
              <li>• Regularly review and adjust goals based on performance</li>
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
}