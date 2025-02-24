import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiUser, FiPlus } from 'react-icons/fi';
import Stats from '../components/dashboard/Stats';
import SalesChart from '../components/dashboard/SalesChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import LowStockAlert from '../components/dashboard/LowStockAlert';

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">POS System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiUser className="text-gray-600" />
                <span className="text-sm text-gray-600">{currentUser?.email}</span>
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                  {userRole}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
        <div className="mb-6">
          <Stats />
        </div>

        {/* Manager-specific content */}
        {userRole === 'manager' && (
          <>
            {/* Sales Chart */}
            <div className="mb-6">
              <SalesChart />
            </div>

            {/* Two-column layout for transactions and inventory */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentTransactions />
              <LowStockAlert />
            </div>
          </>
        )}

        {/* Cashier-specific content */}
        {userRole === 'cashier' && (
          <div className="grid grid-cols-1 gap-6">
            <RecentTransactions />
          </div>
        )}
      </main>
    </div>
  );
} 