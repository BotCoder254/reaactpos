import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeamPerformance from '../components/employees/TeamPerformance';
import EmployeePerformance from '../components/employees/EmployeePerformance';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { FiLoader, FiTrendingUp, FiUsers, FiClock, FiDollarSign } from 'react-icons/fi';

export default function StaffStats() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [staffStats, setStaffStats] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = collection(db, 'users');
        const q = query(userRef, where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setError('Failed to fetch user role');
      }
    };

    const fetchStaffStats = async () => {
      try {
        // Get all staff members
        const staffRef = collection(db, 'users');
        const staffQuery = query(staffRef, where('role', 'in', ['cashier', 'manager']));
        const staffSnapshot = await getDocs(staffQuery);
        const staffMembers = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get sales data
        const salesRef = collection(db, 'sales');
        const salesQuery = query(salesRef, orderBy('timestamp', 'desc'));
        const salesSnapshot = await getDocs(salesQuery);
        const sales = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate staff statistics
        const stats = {
          totalStaff: staffMembers.length,
          activeStaff: staffMembers.filter(staff => staff.status === 'active').length,
          totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
          averageSalesPerStaff: sales.reduce((sum, sale) => sum + sale.total, 0) / staffMembers.length,
          topPerformers: staffMembers
            .map(staff => {
              const staffSales = sales.filter(sale => sale.cashierId === staff.uid);
              return {
                ...staff,
                totalSales: staffSales.reduce((sum, sale) => sum + sale.total, 0),
                transactionCount: staffSales.length
              };
            })
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 5)
        };

        setStaffStats(stats);
      } catch (error) {
        console.error('Error fetching staff stats:', error);
        setError('Failed to fetch staff statistics');
      }
    };

    Promise.all([fetchUserRole(), fetchStaffStats()]).finally(() => {
      setLoading(false);
    });
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600">
          <FiLoader className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Only allow access to managers and admins
  if (!currentUser || !userRole || !['admin', 'manager'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff Statistics</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiUsers className="h-6 w-6 text-primary-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Total Staff</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-primary-600">
            {staffStats?.totalStaff || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiClock className="h-6 w-6 text-green-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Active Staff</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {staffStats?.activeStaff || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiDollarSign className="h-6 w-6 text-blue-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Total Sales</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            ${staffStats?.totalSales.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FiTrendingUp className="h-6 w-6 text-purple-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Avg Sales/Staff</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-purple-600">
            ${staffStats?.averageSalesPerStaff.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performers</h2>
        <div className="space-y-4">
          {staffStats?.topPerformers.map((staff, index) => (
            <div
              key={staff.id}
              className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {(staff.name || staff.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {staff.name || staff.email}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {staff.transactionCount} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">
                    ${staff.totalSales.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Total Sales</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance Component */}
      <div className="mt-6">
        <TeamPerformance />
      </div>
    </div>
  );
} 