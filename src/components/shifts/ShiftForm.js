import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { createShift, updateShift, createNotification, getCashiers } from '../../utils/shiftQueries';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ShiftForm({ shift, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    employeeId: '',
    cashierName: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(new Date(Date.now() + 8 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });
  const [cashiers, setCashiers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (shift) {
      setFormData({
        employeeId: shift.employeeId || shift.cashierId,
        cashierName: shift.cashierName,
        startTime: format(new Date(shift.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(shift.endTime), "yyyy-MM-dd'T'HH:mm"),
        notes: shift.notes || ''
      });
    }
    fetchCashiers();
  }, [shift]);

  const fetchCashiers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cashiersList = await getCashiers();
      setCashiers(cashiersList);
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      setError('Failed to load cashiers');
      toast.error('Failed to load cashiers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      if (!formData.employeeId) {
        throw new Error('Please select a cashier');
      }

      const selectedCashier = cashiers.find(c => c.id === formData.employeeId);
      
      const shiftData = {
        employeeId: formData.employeeId,
        cashierId: formData.employeeId, // For backward compatibility
        cashierName: selectedCashier ? selectedCashier.name : 'Unknown',
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        notes: formData.notes,
        status: 'active'
      };

      if (shift) {
        await updateShift(shift.id, shiftData);
      } else {
        await createShift(shiftData);
      }

      // Create notification for the assigned cashier
      await createNotification(
        formData.employeeId,
        'New Shift Assignment',
        `You have been assigned a shift on ${format(new Date(formData.startTime), 'MMM d, yyyy')} from ${format(new Date(formData.startTime), 'h:mm a')} to ${format(new Date(formData.endTime), 'h:mm a')}`,
        'shift_assignment'
      );

      toast.success(shift ? 'Shift updated successfully' : 'Shift created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving shift:', error);
      setError(error.message || 'Failed to save shift');
      toast.error(error.message || 'Failed to save shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cashier</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" />
                </div>
                {isLoading ? (
                  <div className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md">
                    Loading cashiers...
                  </div>
                ) : (
                  <select
                    value={formData.employeeId}
                    onChange={(e) => {
                      const cashier = cashiers.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        employeeId: e.target.value,
                        cashierName: cashier ? cashier.name : ''
                      });
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a cashier</option>
                    {cashiers.map(cashier => (
                      <option key={cashier.id} value={cashier.id}>
                        {cashier.name || cashier.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiClock className="text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <div className="mt-1">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSubmitting ? 'Saving...' : shift ? 'Update Shift' : 'Create Shift'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
} 