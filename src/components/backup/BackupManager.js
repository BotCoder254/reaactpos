import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDatabase,
  FiCalendar,
  FiClock,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiDownload,
  FiPlus
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import {
  createBackup,
  getBackups,
  scheduleBackup,
  getBackupSchedules,
  getAllRecoveryRequests,
  updateRecoveryRequest
} from '../../utils/backupQueries';
import { toast } from 'react-toastify';

const BackupManager = () => {
  const { currentUser } = useAuth();
  const [backups, setBackups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [recoveryRequests, setRecoveryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [backupFormat, setBackupFormat] = useState('json');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState({
    frequency: 'daily',
    time: '00:00',
    dayOfWeek: 0,
    dayOfMonth: 1
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Modal styles with high z-index
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 9998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    content: {
      position: 'relative',
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '0.5rem',
      maxWidth: '500px',
      width: '90%',
      zIndex: 9999
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [backupsData, schedulesData, requestsData] = await Promise.all([
        getBackups(),
        getBackupSchedules(),
        getAllRecoveryRequests()
      ]);
      setBackups(backupsData);
      setSchedules(schedulesData);
      setRecoveryRequests(requestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await createBackup(currentUser.uid, description, backupFormat);
      toast.success('Backup created successfully');
      setShowCreateModal(false);
      setDescription('');
      setBackupFormat('json');
      await fetchData();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleBackup = async () => {
    try {
      setLoading(true);
      await scheduleBackup(currentUser.uid, schedule);
      toast.success('Backup scheduled successfully');
      setShowScheduleModal(false);
      setSchedule({
        frequency: 'daily',
        time: '00:00',
        dayOfWeek: 0,
        dayOfMonth: 1
      });
      await fetchData();
    } catch (error) {
      console.error('Error scheduling backup:', error);
      toast.error('Failed to schedule backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryAction = async (requestId, status) => {
    try {
      setLoading(true);
      await updateRecoveryRequest(
        requestId,
        status,
        currentUser.uid,
        status === 'rejected' ? rejectionReason : ''
      );
      toast.success(`Recovery request ${status}`);
      setSelectedRequest(null);
      setRejectionReason('');
      await fetchData();
    } catch (error) {
      console.error('Error updating recovery request:', error);
      toast.error('Failed to update recovery request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Backup Manager</h1>
          <div className="space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              Create Backup
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center px-4 py-2 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiCalendar className="mr-2 -ml-1 h-5 w-5" />
              Schedule Backup
            </button>
          </div>
        </div>

        {/* Backup List */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-4 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Backup History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.createdAt.toDate().toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.format || 'json'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(backup.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {backup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => window.open(backup.fileUrl, '_blank')}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiDownload className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recovery Requests Section */}
        <div className="bg-white rounded-lg shadow-sm mt-8">
          <div className="px-4 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recovery Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recoveryRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recovery requests found
                    </td>
                  </tr>
                ) : (
                  recoveryRequests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requestedAt.toDate().toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requestedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {request.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRecoveryAction(request.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              <FiCheck className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              <FiX className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Backup Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={modalStyles.overlay}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                style={modalStyles.content}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Create New Backup</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter backup description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Format
                    </label>
                    <select
                      value={backupFormat}
                      onChange={(e) => setBackupFormat(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="sql">SQL</option>
                      <option value="xml">XML</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="btn btn-secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateBackup}
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Backup'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule Backup Modal */}
        <AnimatePresence>
          {showScheduleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={modalStyles.overlay}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                style={modalStyles.content}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Schedule Backup</h2>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={schedule.frequency}
                      onChange={(e) =>
                        setSchedule({ ...schedule, frequency: e.target.value })
                      }
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) =>
                        setSchedule({ ...schedule, time: e.target.value })
                      }
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  {schedule.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week
                      </label>
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            dayOfWeek: parseInt(e.target.value)
                          })
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                  )}
                  {schedule.frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Month
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={schedule.dayOfMonth}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            dayOfMonth: parseInt(e.target.value)
                          })
                        }
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="btn btn-secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleScheduleBackup}
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Scheduling...' : 'Schedule Backup'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rejection Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9999 }}>
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reject Recovery Request
                    </h3>
                    <div className="mt-2">
                      <textarea
                        rows={3}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    onClick={() => handleRecoveryAction(selectedRequest.id, 'rejected')}
                    disabled={!rejectionReason || loading}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => {
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupManager;

