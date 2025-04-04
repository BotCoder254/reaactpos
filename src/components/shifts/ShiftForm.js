import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import toast from 'react-hot-toast';
import { getCashiers } from '../../utils/shiftQueries';

export default function ShiftForm({ shift, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const { createShift: contextCreateShift, updateShift: contextUpdateShift } = useShift();
  const [formData, setFormData] = useState({
    employeeId: shift?.employeeId || '',
    startTime: shift?.startTime ? format(new Date(shift.startTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: shift?.endTime ? format(new Date(shift.endTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(Date.now() + 8 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    notes: shift?.notes || ''
  });
  const [cashiers, setCashiers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cashiersList = await getCashiers();
      
      if (Array.isArray(cashiersList) && cashiersList.length > 0) {
        // Validate each cashier object has required fields
        const validCashiers = cashiersList.filter(cashier => 
          cashier && cashier.id && (cashier.name || cashier.email)
        );
        setCashiers(validCashiers);
      } else {
        setError('No cashiers available. Please add cashiers first.');
        toast.error('No cashiers available');
      }
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      setError('Failed to load cashiers. Please try again.');
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
      if (!selectedCashier) {
        throw new Error('Selected cashier is no longer available');
      }

      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);

      if (startDate >= endDate) {
        throw new Error('End time must be after start time');
      }

      if (startDate < new Date()) {
        throw new Error('Cannot create shifts in the past');
      }

      const shiftData = {
        employeeId: formData.employeeId,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        notes: formData.notes,
        status: 'active',
        cashierName: selectedCashier.name || selectedCashier.email,
        cashierEmail: selectedCashier.email
      };

      if (shift) {
        await contextUpdateShift(shift.id, shiftData);
        toast.success('Shift updated successfully');
      } else {
        await contextCreateShift(shiftData);
        toast.success('Shift created successfully');
      }

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-lg w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {shift ? 'Edit Shift' : 'Create New Shift'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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
      </div>
    </motion.div>
  );
} 