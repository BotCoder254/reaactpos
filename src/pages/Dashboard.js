import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiUser, FiPlus } from 'react-icons/fi';
import Stats from '../components/dashboard/Stats';
import SalesChart from '../components/dashboard/SalesChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import LowStockAlert from '../components/dashboard/LowStockAlert';
import SalesGoals from '../components/dashboard/SalesGoals';

export default function Dashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      setError('Failed to log out');
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FiUser className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">
              {currentUser?.email} ({userRole})
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiLogOut className="mr-2 -ml-1 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      {/* Quick Action Button for Cashiers */}
      {userRole === 'cashier' && (
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/pos')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPlus className="mr-2" />
            New Sale
          </button>
        </motion.div>
      )}

      {/* Stats Section */}
      <motion.div
        variants={itemVariants}
        className="mb-6"
      >
        <Stats />
      </motion.div>

      {/* Manager-specific content */}
      {userRole === 'manager' && (
        <>
          {/* Sales Goals */}
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <SalesGoals />
          </motion.div>

          {/* Sales Chart */}
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <SalesChart />
          </motion.div>

          {/* Two-column layout for transactions and inventory */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div variants={itemVariants}>
              <RecentTransactions />
            </motion.div>
            <motion.div variants={itemVariants}>
              <LowStockAlert />
            </motion.div>
          </div>
        </>
      )}

      {/* Cashier-specific content */}
      {userRole === 'cashier' && (
        <motion.div
          variants={itemVariants}
          className="mt-6"
        >
          <RecentTransactions />
        </motion.div>
      )}
    </motion.div>
  );
} 