import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { createShift, updateShift, createNotification, getCashiers } from '../../utils/shiftQueries';
import toast from 'react-hot-toast';

export default function ShiftForm({ shift, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    cashierId: '',
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
        cashierId: shift.cashierId,
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

      if (!formData.cashierId) {
        throw new Error('Please select a cashier');
      }

      const shiftData = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      };

      if (shift) {
        await updateShift(shift.id, shiftData);
      } else {
        await createShift(shiftData);
      }

      // Create notification for the assigned cashier
      await createNotification(
        formData.cashierId,
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {shift ? 'Edit Shift' : 'Add New Shift'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

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
                  value={formData.cashierId}
                  onChange={(e) => {
                    const cashier = cashiers.find(c => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      cashierId: e.target.value,
                      cashierName: cashier ? cashier.name : ''
                    });
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a cashier</option>
                  {cashiers.map(cashier => (
                    <option key={cashier.id} value={cashier.id}>
                      {cashier.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add any additional notes..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : shift ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 