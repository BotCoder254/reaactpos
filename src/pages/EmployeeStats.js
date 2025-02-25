import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeamPerformance from '../components/employees/TeamPerformance';
import EmployeePerformance from '../components/employees/EmployeePerformance';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { FiLoader } from 'react-icons/fi';

export default function EmployeeStats() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
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
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserRole();
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

  // Redirect if not authorized
  if (!currentUser || (userRole !== 'manager' && userRole !== 'admin' && userRole !== 'cashier')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Show personal stats for cashiers */}
      {userRole === 'cashier' && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Performance</h1>
          <EmployeePerformance employeeId={currentUser.uid} />
        </div>
      )}

      {/* Show team performance for managers and admins */}
      {(userRole === 'manager' || userRole === 'admin') && (
        <div>
          <TeamPerformance />
        </div>
      )}
    </div>
  );
} 