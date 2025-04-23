import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';
import BackupManager from './BackupManager';
import RecoveryRequest from './RecoveryRequest';

const BackupRouteGuard = () => {
  const { currentUser } = useAuth();
  const { effectiveRole } = useRole();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Render appropriate component based on user role
  if (effectiveRole === 'manager') {
    return <BackupManager />;
  } else if (effectiveRole === 'cashier') {
    return <RecoveryRequest />;
  }

  // Redirect to home if user doesn't have appropriate role
  return <Navigate to="/" />;
};

export default BackupRouteGuard; 
