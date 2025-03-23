import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  TagIcon,
  ChartPieIcon,
  FlagIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  InboxStackIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiShoppingCart, FiUsers, FiSettings, FiRefreshCcw, FiStar } from 'react-icons/fi';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser, userRole } = useAuth();
  const location = useLocation();

  // If user is not authenticated, don't render the sidebar
  if (!currentUser) return null;

  const managerNavItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/' },
    { name: 'POS', icon: ShoppingCartIcon, path: '/pos' },
    // { name: 'Products', icon: ShoppingBagIcon, path: '/products' },
    { name: 'Inventory', icon: ArchiveBoxIcon, path: '/inventory' },
    { name: 'Inventory Dashboard', icon: ChartBarIcon, path: '/inventory/dashboard' },
    { name: 'Stock Management', icon: InboxStackIcon, path: '/inventory/stock' },
    { name: 'Low Stock Alerts', icon: ExclamationCircleIcon, path: '/inventory/alerts' },
    { name: 'Orders', icon: ClipboardDocumentListIcon, path: '/orders' },
    { name: 'Sales History', icon: ReceiptPercentIcon, path: '/sales' },
    { name: 'Sales Goals', icon: ChartBarIcon, path: '/sales-goals' },
    { name: 'Customers', icon: UserGroupIcon, path: '/customers' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/analytics' },
    { name: 'Staff', icon: UsersIcon, path: '/staff' },
    { name: 'Staff Stats', icon: ChartPieIcon, path: '/staff-stats' },
    // { name: 'Employee Stats', icon: ChartPieIcon, path: '/employee-stats' },
    { name: 'Discounts', icon: TagIcon, path: '/discounts' },
    { name: 'Marketing', icon: PhotoIcon, path: '/marketing' },
    { name: 'Expenses', icon: ChartBarIcon, path: '/expenses' },
    { name: 'Reports', icon: DocumentTextIcon, path: '/reports' },
    { name: 'Profit and Loss', icon: ChartBarIcon, path: '/profit-loss' },
    { name: 'Loyalty Program', icon: FiStar, path: '/loyalty' },
    { name: 'Settings', icon: CogIcon, path: '/settings' },
    { name: 'Refunds', icon: FiRefreshCcw, path: '/refunds' }
  ];

  const cashierNavItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/' },
    { name: 'POS', icon: ShoppingCartIcon, path: '/pos' },
    { name: 'Products', icon: ShoppingBagIcon, path: '/products' },
    { name: 'Inventory', icon: ArchiveBoxIcon, path: '/inventory' },
    { name: 'Inventory Dashboard', icon: ChartBarIcon, path: '/inventory/dashboard' },
    { name: 'Orders', icon: ClipboardDocumentListIcon, path: '/orders' },
    { name: 'Sales History', icon: ReceiptPercentIcon, path: '/sales' },
    { name: 'Sales Goals', icon: ChartBarIcon, path: '/sales-goals' },
    { name: 'Customers', icon: UserGroupIcon, path: '/customers' },
    { name: 'Marketing', icon: PhotoIcon, path: '/marketing' },
    { name: 'Employee Stats', icon: ChartPieIcon, path: '/employee-stats' },
    { name: 'Loyalty Program', icon: FiStar, path: '/loyalty' },
    { name: 'Settings', icon: CogIcon, path: '/settings' },
    { name: 'Refunds', icon: FiRefreshCcw, path: '/refunds' }
  ];

  const navItems = userRole === 'manager' ? managerNavItems : cashierNavItems;

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? '5rem' : '16rem' }}
      className="h-screen bg-white border-r border-gray-200 flex flex-col"
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-primary-600"
          >
            POS System
          </motion.h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isCollapsed
                  ? 'M13 5l7 7-7 7M5 5l7 7-7 7'
                  : 'M11 19l-7-7 7-7M19 19l-7-7 7-7'
              }
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-6 h-6 flex-shrink-0" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-3 font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {userRole?.[0]?.toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3"
            >
              <p className="text-sm font-medium text-gray-700">
                {userRole?.[0]?.toUpperCase() + userRole?.slice(1)}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 