import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Shifts() {
  const { userRole } = useAuth();

  // Redirect to appropriate shift page based on role
  if (userRole === 'manager') {
    return <Navigate to="/shifts/schedule" replace />;
  } else if (userRole === 'cashier') {
    return <Navigate to="/shifts/clock" replace />;
  }

  // If role is not determined yet, show loading
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
} 