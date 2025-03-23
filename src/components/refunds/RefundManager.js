import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiFilter, FiDownload, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRefund } from '../../contexts/RefundContext';
import { getRefundAnalytics } from '../../utils/refundQueries';
import { format } from 'date-fns';
import Papa from 'papaparse';

export default function RefundManager() {
  const { refundRequests, loading, error, handleRefundAction } = useRefund();
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '7days',
    cashier: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const data = await getRefundAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const filteredAndSortedRequests = () => {
    let filtered = [...refundRequests];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status);
    }
    if (filters.cashier !== 'all') {
      filtered = filtered.filter(req => req.cashierId === filters.cashier);
    }
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = parseInt(filters.dateRange);
      const cutoff = new Date(now.setDate(now.getDate() - days));
      filtered = filtered.filter(req => new Date(req.timestamp) >= cutoff);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const handleAction = async (refundId, action) => {
    try {
      await handleRefundAction(refundId, action);
      setSelectedRequest(null);
      setShowDetails(false);
    } catch (err) {
      console.error('Error handling refund action:', err);
    }
  };

  const exportToCSV = () => {
    const data = filteredAndSortedRequests().map(req => ({
      'Order ID': req.orderId,
      'Product': req.productName,
      'Amount': req.amount,
      'Status': req.status,
      'Cashier': req.cashierName,
      'Date': new Date(req.timestamp).toLocaleString(),
      'Reason': req.reason
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refund_requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Refunds</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{analytics.totalRefunds}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">${analytics.totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
            <p className="mt-1 text-2xl font-semibold text-green-600">{analytics.approvedRefunds}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
            <p className="mt-1 text-2xl font-semibold text-red-600">{analytics.rejectedRefunds}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      {/* Refund Requests Table */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'timestamp', label: 'Date' },
                  { key: 'orderId', label: 'Order ID' },
                  { key: 'productName', label: 'Product' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'cashierName', label: 'Cashier' },
                  { key: 'status', label: 'Status' },
                  { key: 'actions', label: 'Actions' }
                ].map(column => (
                  <th
                    key={column.key}
                    onClick={() => column.key !== 'actions' && handleSort(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.key !== 'actions' ? 'cursor-pointer hover:text-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.key === sortConfig.key && (
                        sortConfig.direction === 'asc' ? 
                        <FiChevronUp className="w-4 h-4" /> : 
                        <FiChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedRequests().map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(request.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${request.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.cashierName}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetails(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(request.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Refund Request Details</h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setShowDetails(false);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Order ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.orderId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Product</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.productName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Amount</label>
                  <p className="mt-1 text-sm text-gray-900">${selectedRequest.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Cashier</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.cashierName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Reason</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.receipt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Receipt</label>
                  <img
                    src={selectedRequest.receipt}
                    alt="Receipt"
                    className="mt-1 max-h-48 object-contain"
                  />
                </div>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => handleAction(selectedRequest.id, 'approved')}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(selectedRequest.id, 'rejected')}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reject
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
} 