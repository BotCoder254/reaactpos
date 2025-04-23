import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiClock,
  FiRefreshCw,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';
import { toast } from 'react-toastify';
import {
  getBackups,
  requestRecovery,
  getRecoveryRequests
} from '../../utils/backupQueries';

const RecoveryRequest = () => {
  const { currentUser } = useAuth();
  const { effectiveRole } = useRole();
  const [backups, setBackups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [reason, setReason] = useState('');
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [backupsData, requestsData] = await Promise.all([
        getBackups(),
        getRecoveryRequests(currentUser.uid, effectiveRole)
      ]);
      setBackups(backupsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBackup || !reason || collections.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await requestRecovery(currentUser.uid, selectedBackup, collections, reason);
      toast.success('Recovery request submitted successfully');
      setSelectedBackup('');
      setReason('');
      setCollections([]);
      await fetchData();
    } catch (error) {
      console.error('Error submitting recovery request:', error);
      toast.error('Failed to submit recovery request');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiRefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
            <button
              onClick={fetchData}
              className="ml-4 text-sm underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Request Data Recovery</h1>

        {/* Request Form */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-4 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">New Recovery Request</h2>
          </div>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Backup Point
                </label>
                <select
                  value={selectedBackup}
                  onChange={(e) => setSelectedBackup(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  required
                  disabled={loading}
                >
                  <option value="">Select a backup</option>
                  {backups.map((backup) => (
                    <option key={backup.id} value={backup.id}>
                      {backup.createdAt.toDate().toLocaleString()} - {backup.description || 'No description'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Data to Recover
                </label>
                <div className="mt-2 space-y-2">
                  {['sales', 'products', 'inventory'].map((collection) => (
                    <label key={collection} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={collections.includes(collection)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCollections([...collections, collection]);
                          } else {
                            setCollections(collections.filter(c => c !== collection));
                          }
                        }}
                        className="form-checkbox h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{collection}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Recovery
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Explain why you need to recover this data..."
                  required
                  disabled={loading}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Request History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Request History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recovery requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requestedAt.toDate().toLocaleString()}
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
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryRequest; 
