import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const RoleContext = createContext();

export function useRole() {
  return useContext(RoleContext);
}

export function RoleProvider({ children }) {
  const { currentUser, userRole: baseRole } = useAuth();
  const [temporaryRole, setTemporaryRole] = useState(null);
  const [roleRequest, setRoleRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // The effective role is either the temporary role or the base role
  const effectiveRole = temporaryRole || baseRole;

  // Function to request temporary role elevation
  const requestRoleElevation = async (reason) => {
    try {
      setIsLoading(true);
      const requestRef = doc(db, 'roleRequests', currentUser.uid);
      await setDoc(requestRef, {
        userId: currentUser.uid,
        baseRole,
        requestedRole: 'manager',
        reason,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      setRoleRequest({ status: 'pending', timestamp: new Date() });
      toast.success('Role elevation request submitted');
    } catch (error) {
      console.error('Error requesting role elevation:', error);
      toast.error('Failed to submit role elevation request');
    } finally {
      setIsLoading(false);
    }
  };

  // Function for managers to temporarily switch to cashier role
  const switchToCashierRole = async (duration = 60) => {
    try {
      setIsLoading(true);
      const roleRef = doc(db, 'temporaryRoles', currentUser.uid);
      const expiresAt = new Date(Date.now() + duration * 60000);
      
      await setDoc(roleRef, {
        userId: currentUser.uid,
        baseRole,
        temporaryRole: 'cashier',
        expiresAt,
        timestamp: serverTimestamp(),
      });
      
      setTemporaryRole('cashier');
      toast.success(`Switched to cashier role for ${duration} minutes`);
      
      // Set timeout to revert role
      const timeoutId = setTimeout(() => {
        revertToBaseRole();
      }, duration * 60000);

      // Store timeout ID for cleanup
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Failed to switch role');
    } finally {
      setIsLoading(false);
    }
  };

  // Function for managers to approve role elevation requests
  const approveRoleRequest = async (userId, duration = 60) => {
    try {
      setIsLoading(true);
      const requestRef = doc(db, 'roleRequests', userId);
      const roleRef = doc(db, 'temporaryRoles', userId);

      await Promise.all([
        setDoc(requestRef, { status: 'approved' }, { merge: true }),
        setDoc(roleRef, {
          userId,
          temporaryRole: 'manager',
          expiresAt: new Date(Date.now() + duration * 60000),
          timestamp: serverTimestamp(),
        }),
      ]);

      toast.success('Role request approved');
    } catch (error) {
      console.error('Error approving role request:', error);
      toast.error('Failed to approve role request');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to revert to base role
  const revertToBaseRole = async () => {
    try {
      setIsLoading(true);
      const roleRef = doc(db, 'temporaryRoles', currentUser.uid);
      await setDoc(roleRef, {
        userId: currentUser.uid,
        temporaryRole: null,
        timestamp: serverTimestamp(),
      });
      setTemporaryRole(null);
      toast.success('Reverted to original role');
      
      // Only navigate if the current path requires manager role and user is not a manager
      const managerOnlyPaths = ['/analytics', '/reports', '/staff-stats', '/sales-goals', '/marketing', '/expenses', '/profit-loss', '/stock', '/low-stock', '/staff', '/discounts', '/inventory-dashboard', '/shift-management', '/role-requests'];
      if (managerOnlyPaths.includes(window.location.pathname) && baseRole !== 'manager') {
        navigate('/');
      }
    } catch (error) {
      console.error('Error reverting role:', error);
      toast.error('Failed to revert role');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing temporary role or role request on mount
  useEffect(() => {
    if (!currentUser) return;

    const checkExistingRole = async () => {
      try {
        const [roleDoc, requestDoc] = await Promise.all([
          getDoc(doc(db, 'temporaryRoles', currentUser.uid)),
          getDoc(doc(db, 'roleRequests', currentUser.uid)),
        ]);

        if (roleDoc.exists()) {
          const roleData = roleDoc.data();
          if (roleData.expiresAt?.toDate() > new Date()) {
            setTemporaryRole(roleData.temporaryRole);
            
            // Set timeout for role expiration
            const timeUntilExpiry = roleData.expiresAt.toDate() - new Date();
            if (timeUntilExpiry > 0) {
              const timeoutId = setTimeout(() => {
                revertToBaseRole();
              }, timeUntilExpiry);

              // Cleanup timeout on unmount
              return () => clearTimeout(timeoutId);
            }
          } else {
            // Clean up expired role
            revertToBaseRole();
          }
        }

        if (requestDoc.exists()) {
          const requestData = requestDoc.data();
          if (requestData.status === 'pending') {
            setRoleRequest(requestData);
          }
        }
      } catch (error) {
        console.error('Error checking existing role:', error);
      }
    };

    checkExistingRole();
  }, [currentUser]);

  const value = {
    effectiveRole,
    baseRole,
    isTemporaryRole: !!temporaryRole,
    roleRequest,
    isLoading,
    requestRoleElevation,
    switchToCashierRole,
    approveRoleRequest,
    revertToBaseRole,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
} 