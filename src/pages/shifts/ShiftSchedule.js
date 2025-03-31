import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import ShiftForm from '../../components/shifts/ShiftForm';
import ShiftCalendar from '../../components/shifts/ShiftCalendar';
import toast from 'react-hot-toast';

export default function ShiftSchedule() {
  const { currentUser, userRole } = useAuth();
  const { shifts, loading, error, refreshShifts } = useShift();
  const [showForm, setShowForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filteredShifts, setFilteredShifts] = useState([]);

  useEffect(() => {
    // Initial fetch of shifts
    refreshShifts?.();

    // Set up real-time refresh interval
    const interval = setInterval(() => {
      refreshShifts?.();
    }, 30000); // Refresh every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [refreshShifts]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Filter shifts based on user role
  useEffect(() => {
    if (!shifts) {
      setFilteredShifts([]);
      return;
    }

    if (userRole === 'cashier') {
      const cashierShifts = shifts.filter(shift => shift.employeeId === currentUser?.uid);
      setFilteredShifts(cashierShifts);
    } else {
      setFilteredShifts(shifts);
    }
  }, [shifts, userRole, currentUser]);

  const handleCreateShift = () => {
    setSelectedShift(null);
    setShowForm(true);
  };

  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setShowForm(true);
  };

  const handleCloseForm = async (shouldRefresh = false) => {
    setShowForm(false);
    setSelectedShift(null);
    if (shouldRefresh) {
      await refreshShifts?.();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={refreshShifts}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      );
    }

    if (filteredShifts.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {userRole === 'manager' ? 'No shifts scheduled yet.' : 'You have no shifts scheduled.'}
          </p>
          {userRole === 'manager' && (
            <button
              onClick={handleCreateShift}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create First Shift
            </button>
          )}
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow"
      >
        <ShiftCalendar
          shifts={filteredShifts}
          onShiftClick={userRole === 'manager' ? handleEditShift : undefined}
          viewOnly={userRole !== 'manager'}
        />
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {userRole === 'manager' ? 'Shift Schedule Management' : 'My Schedule'}
        </h1>
        {userRole === 'manager' && (
          <button
            onClick={handleCreateShift}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Create New Shift
          </button>
        )}
      </div>

      {renderContent()}

      {showForm && (
        <ShiftForm
          shift={selectedShift}
          onClose={() => handleCloseForm(false)}
          onSuccess={() => handleCloseForm(true)}
        />
      )}
    </div>
  );
} 
