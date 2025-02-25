import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUserPlus,
  FiSearch,
  FiEdit2,
  FiShoppingBag,
  FiTrash2,
  FiAlertCircle
} from 'react-icons/fi';
import CustomerModal from '../components/customers/CustomerModal';
import PurchaseHistoryModal from '../components/customers/PurchaseHistoryModal';
import { searchCustomers, deleteCustomer } from '../utils/customerQueries';
import { useAuth } from '../contexts/AuthContext';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, 'customers');
        const customersQuery = query(customersCollection, orderBy('name'));
        const customersSnapshot = await getDocs(customersQuery);
        const customersList = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersList);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleViewPurchases = (customer) => {
    setSelectedCustomer(customer);
    setIsPurchaseHistoryOpen(true);
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCustomer(customerToDelete.id);
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      const fetchCustomers = async () => {
        try {
          const customersCollection = collection(db, 'customers');
          const customersQuery = query(customersCollection, orderBy('name'));
          const customersSnapshot = await getDocs(customersQuery);
          const customersList = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCustomers(customersList);
        } catch (error) {
          console.error('Error fetching customers:', error);
        }
      };
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.totalOrders || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${customer.totalSpent?.toFixed(2) || '0.00'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedCustomer}
        onRefetch={() => {}}
      />

      <PurchaseHistoryModal
        isOpen={isPurchaseHistoryOpen}
        onClose={() => setIsPurchaseHistoryOpen(false)}
        customer={selectedCustomer}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center mb-4">
              <FiAlertCircle className="text-red-600 w-6 h-6 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Delete Customer
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {customerToDelete?.name}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 