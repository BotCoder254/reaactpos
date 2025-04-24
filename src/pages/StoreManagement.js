import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiMapPin, FiTruck, FiEdit2, FiTrash2, FiCheck, FiX, FiBarChart2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import CrossStoreReport from '../components/stores/CrossStoreReport';
import { useSearchParams } from 'react-router-dom';

export default function StoreManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stores';
  const { stores, createStore, updateStore, transfers, createTransfer, updateTransfer } = useStore();
  const { currentUser } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    status: 'active'
  });

  const [transferData, setTransferData] = useState({
    fromStore: '',
    toStore: '',
    items: [],
    notes: ''
  });

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      await createStore(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        manager: '',
        status: 'active'
      });
      toast.success('Store created successfully');
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error('Failed to create store');
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    try {
      await createTransfer(transferData);
      setIsTransferModalOpen(false);
      setTransferData({
        fromStore: '',
        toStore: '',
        items: [],
        notes: ''
      });
      toast.success('Transfer created successfully');
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error('Failed to create transfer');
    }
  };

  const handleUpdateTransfer = async (transferId, status) => {
    try {
      await updateTransfer(transferId, status);
      toast.success(`Transfer ${status} successfully`);
    } catch (error) {
      console.error('Error updating transfer:', error);
      toast.error('Failed to update transfer');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
        {activeTab === 'stores' && (
          <div className="space-x-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Create Store
            </button>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiTruck className="mr-2 h-4 w-4" />
              Create Transfer
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('stores')}
            className={`${
              activeTab === 'stores'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiMapPin className="mr-2 h-4 w-4" />
            Stores & Transfers
          </button>
          <button
            onClick={() => handleTabChange('reports')}
            className={`${
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FiBarChart2 className="mr-2 h-4 w-4" />
            Cross-Store Reports
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'stores' ? (
        <>
          {/* Stores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stores.map((store) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
                    <p className="text-sm text-gray-500">{store.address}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {store.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Manager: {store.manager}</p>
                  <p>Phone: {store.phone}</p>
                  <p>Email: {store.email}</p>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedStore(store);
                      setFormData(store);
                      setIsCreateModalOpen(true);
                    }}
                    className="p-2 text-gray-600 hover:text-primary-600"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Transfers List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Transfer History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
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
                  {transfers.map((transfer) => (
                    <motion.tr
                      key={transfer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stores.find(s => s.id === transfer.fromStore)?.name || 'Unknown Store'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stores.find(s => s.id === transfer.toStore)?.name || 'Unknown Store'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transfer.items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transfer.status === 'approved' ? 'bg-green-100 text-green-800' :
                          transfer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transfer.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateTransfer(transfer.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateTransfer(transfer.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create/Edit Store Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setSelectedStore(null);
                        setFormData({
                          name: '',
                          address: '',
                          phone: '',
                          email: '',
                          manager: '',
                          status: 'active'
                        });
                      }}
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <span className="sr-only">Close</span>
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedStore ? 'Edit Store' : 'Create Store'}
                      </h3>
                      <div className="mt-4">
                        <form onSubmit={handleCreateStore} className="space-y-4">
                          <div className="grid grid-cols-1 gap-y-4">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Store Name</label>
                              <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                              <textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={2}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                  type="tel"
                                  id="phone"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                  type="email"
                                  id="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label htmlFor="manager" className="block text-sm font-medium text-gray-700">Manager</label>
                              <input
                                type="text"
                                id="manager"
                                value={formData.manager}
                                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                              <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreateModalOpen(false);
                                setSelectedStore(null);
                                setFormData({
                                  name: '',
                                  address: '',
                                  phone: '',
                                  email: '',
                                  manager: '',
                                  status: 'active'
                                });
                              }}
                              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                            >
                              {selectedStore ? 'Update Store' : 'Create Store'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Transfer Modal */}
          {isTransferModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsTransferModalOpen(false)} />
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTransferModalOpen(false);
                        setTransferData({
                          fromStore: '',
                          toStore: '',
                          items: [],
                          notes: ''
                        });
                      }}
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <span className="sr-only">Close</span>
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Create Transfer</h3>
                      <div className="mt-4">
                        <form onSubmit={handleCreateTransfer} className="space-y-4">
                          <div className="grid grid-cols-1 gap-y-4">
                            <div>
                              <label htmlFor="fromStore" className="block text-sm font-medium text-gray-700">From Store</label>
                              <select
                                id="fromStore"
                                value={transferData.fromStore}
                                onChange={(e) => setTransferData({ ...transferData, fromStore: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                              >
                                <option value="">Select store</option>
                                {stores.map((store) => (
                                  <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="toStore" className="block text-sm font-medium text-gray-700">To Store</label>
                              <select
                                id="toStore"
                                value={transferData.toStore}
                                onChange={(e) => setTransferData({ ...transferData, toStore: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                              >
                                <option value="">Select store</option>
                                {stores
                                  .filter((store) => store.id !== transferData.fromStore)
                                  .map((store) => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                              <textarea
                                id="notes"
                                value={transferData.notes}
                                onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                                rows={3}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Add any additional notes or instructions..."
                              />
                            </div>
                          </div>
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsTransferModalOpen(false);
                                setTransferData({
                                  fromStore: '',
                                  toStore: '',
                                  items: [],
                                  notes: ''
                                });
                              }}
                              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                            >
                              Create Transfer
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <CrossStoreReport />
      )}
    </div>
  );
} 
