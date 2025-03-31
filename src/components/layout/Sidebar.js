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
  ShieldExclamationIcon,
  CalendarIcon,
  ClockIcon,
  UserCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiShoppingCart, FiUsers, FiSettings, FiRefreshCcw, FiStar, FiUserPlus, FiClock, FiCalendar, FiCoffee } from 'react-icons/fi';
import { useRole } from '../../contexts/RoleContext';
import { classNames } from '../../utils/classNames';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser, userRole } = useAuth();
  const location = useLocation();
  const roleContext = useRole();
  const effectiveRole = roleContext?.effectiveRole || userRole;
  const isTemporaryRole = roleContext?.isTemporaryRole || false;

  // If user is not authenticated, don't render the sidebar
  if (!currentUser) return null;

  const managerNavItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/' },
    { name: 'POS', icon: ShoppingCartIcon, path: '/pos' },
    { name: 'Products', icon: ShoppingBagIcon, path: '/products' },
    { name: 'Inventory', icon: ArchiveBoxIcon, path: '/inventory' },
    { name: 'Inventory Dashboard', icon: ArchiveBoxIcon, path: '/inventory-dashboard' },
    { name: 'Stock Management', icon: InboxStackIcon, path: '/stock' },
    { name: 'Low Stock Alerts', icon: ExclamationCircleIcon, path: '/low-stock' },
    { name: 'Orders', icon: ClipboardDocumentListIcon, path: '/orders' },
    { name: 'Sales History', icon: ReceiptPercentIcon, path: '/sales' },
    { name: 'Sales Goals', icon: ChartBarIcon, path: '/sales-goals' },
    { name: 'Customers', icon: UserGroupIcon, path: '/customers' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/analytics' },
    
    // Updated Staff & Shift Management Section
    { name: 'Staff Management', icon: UsersIcon, path: '/staff', 
      subItems: [
        { name: 'Staff List', icon: UserGroupIcon, path: '/staff' },
        { name: 'Staff Stats', icon: ChartPieIcon, path: '/staff-stats' },
        { name: 'Role Requests', icon: UserCircleIcon, path: '/role-requests' },
      ]
    },
    { name: 'Shift Management', icon: CalendarIcon, path: '/shifts',
      subItems: [
        { name: 'Schedule Shifts', icon: FiCalendar, path: '/shifts/schedule' },
        // { name: 'Shift Calendar', icon: CalendarIcon, path: '/shifts/calendar' },
        // { name: 'Attendance Log', icon: ClipboardDocumentListIcon, path: '/shifts/attendance' },
        // { name: 'Shift Analytics', icon: ChartBarIcon, path: '/shifts/analytics' },
        // { name: 'Break Management', icon: FiCoffee, path: '/shifts/breaks' },
      ]
    },
    
    { name: 'Discounts', icon: TagIcon, path: '/discounts' },
    { name: 'Marketing', icon: PhotoIcon, path: '/marketing' },
    { name: 'Expenses', icon: ChartBarIcon, path: '/expenses' },
    { name: 'Reports', icon: DocumentTextIcon, path: '/reports' },
    { name: 'Profit and Loss', icon: ChartBarIcon, path: '/profit-loss' },
    { name: 'Loyalty Program', icon: FiStar, path: '/loyalty' },
    { name: 'Settings', icon: CogIcon, path: '/settings' },
    { name: 'Refunds', icon: FiRefreshCcw, path: '/refunds' },
    { name: 'Fraud Monitoring', icon: ShieldExclamationIcon, path: '/fraud-monitoring' }
  ];

  const cashierNavItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/' },
    { name: 'POS', icon: ShoppingCartIcon, path: '/pos' },
    { name: 'Products', icon: ShoppingBagIcon, path: '/products' },
    { name: 'Inventory', icon: ArchiveBoxIcon, path: '/inventory' },
    { name: 'Orders', icon: ClipboardDocumentListIcon, path: '/orders' },
    { name: 'Sales History', icon: ReceiptPercentIcon, path: '/sales' },
    { name: 'Customers', icon: UserGroupIcon, path: '/customers' },
    { name: 'Marketing', icon: PhotoIcon, path: '/marketing' },
    
    // Updated Shift Management Section for Cashiers
    // { name: 'My Shifts', icon: CalendarIcon, path: '/shifts',
    //   subItems: [
    //     { name: 'View Schedule', icon: FiCalendar, path: '/shifts/schedule' },
    //     { name: 'Clock In/Out', icon: ClockIcon, path: '/shifts/clock' },
    //     { name: 'Break Timer', icon: FiCoffee, path: '/shifts/breaks' },
    //     { name: 'Attendance History', icon: ClipboardDocumentListIcon, path: '/shifts/attendance' },
    //     { name: 'Notifications', icon: BellIcon, path: '/shifts/notifications' },
    //   ]
    // },
    
    { name: 'Employee Stats', icon: ChartPieIcon, path: '/employee-stats' },
    { name: 'Loyalty Program', icon: FiStar, path: '/loyalty' },
    { name: 'Settings', icon: CogIcon, path: '/settings' },
    { name: 'Refund Request', icon: FiRefreshCcw, path: '/refunds' }
  ];

  const navItems = effectiveRole === 'manager' ? managerNavItems : cashierNavItems;

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? '5rem' : '16rem' }}
      className="fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 flex flex-col h-screen overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-primary-600 truncate"
          >
            POS System
          </motion.h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 shrink-0"
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

      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <div key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md whitespace-nowrap'
                  )
                }
              >
                <item.icon
                  className={classNames(
                    'flex-shrink-0 h-6 w-6',
                    isTemporaryRole ? 'text-yellow-500' : 'text-primary-500'
                  )}
                />
                {!isCollapsed && (
                  <span className="ml-3 truncate">{item.name}</span>
                )}
              </NavLink>
              
              {/* Render subItems if they exist and sidebar is not collapsed */}
              {!isCollapsed && item.subItems && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <NavLink
                      key={subItem.name}
                      to={subItem.path}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? 'bg-primary-50 text-primary-900'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-2 py-1.5 text-sm rounded-md whitespace-nowrap'
                        )
                      }
                    >
                      <subItem.icon
                        className={classNames(
                          'flex-shrink-0 h-5 w-5',
                          isTemporaryRole ? 'text-yellow-400' : 'text-primary-400'
                        )}
                      />
                      <span className="ml-2 truncate">{subItem.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-primary-600 font-medium">
              {effectiveRole?.[0]?.toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 min-w-0"
            >
              <p className="text-sm font-medium text-gray-700 truncate">
                {effectiveRole?.[0]?.toUpperCase() + effectiveRole?.slice(1)}
              </p>
              {isTemporaryRole && (
                <p className="text-xs text-yellow-600 truncate">Temporary Role</p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {isTemporaryRole && !isCollapsed && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-100 shrink-0">
          <p className="text-sm text-yellow-800 truncate">
            Temporary role active
          </p>
        </div>
      )}
    </motion.div>
  );
}