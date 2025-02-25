import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiBarChart } from 'react-icons/fi';
import DiscountModal from '../components/discounts/DiscountModal';
import DiscountAnalytics from '../components/discounts/DiscountAnalytics';
import DiscountPerformanceChart from '../components/discounts/DiscountPerformanceChart';
import { getDiscounts, deleteDiscount } from '../utils/discountQueries';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedDiscountForAnalytics, setSelectedDiscountForAnalytics] = useState(null);
  const { userRole } = useAuth();

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const data = await getDiscounts();
      setDiscounts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast.error('Failed to load discounts');
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedDiscount(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (discount) => {
    setSelectedDiscount(discount);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (discount) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await deleteDiscount(discount.id, discount.name);
        toast.success('Discount deleted successfully');
        fetchDiscounts();
      } catch (error) {
        console.error('Error deleting discount:', error);
        toast.error('Failed to delete discount');
      }
    }
  };

  const handleAnalyticsClick = (discount) => {
    setSelectedDiscountForAnalytics(
      selectedDiscountForAnalytics?.id === discount.id ? null : discount
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Discount Management</h1>
        {userRole === 'manager' && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Add Discount
          </button>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {discounts.map((discount) => (
            <motion.li
              key={discount.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {discount.name}
                  </h3>
                  <div className="mt-1 text-sm text-gray-500">
                    {discount.type === 'percentage' ? (
                      <span>{discount.value}% off</span>
                    ) : (
                      <span>Buy One Get One Free</span>
                    )}
                    {discount.minPurchase > 0 && (
                      <span> (Min. ${discount.minPurchase})</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Valid until:{' '}
                    {new Date(discount.validUntil.seconds * 1000).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleAnalyticsClick(discount)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiBarChart className="h-5 w-5" />
                  </button>
                  {userRole === 'manager' && (
                    <>
                      <button
                        onClick={() => handleEditClick(discount)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(discount)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selectedDiscountForAnalytics?.id === discount.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <DiscountAnalytics discountId={discount.id} />
                  <div className="mt-6">
                    <DiscountPerformanceChart discountId={discount.id} />
                  </div>
                </motion.div>
              )}
            </motion.li>
          ))}
        </ul>
      </div>

      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDiscount(null);
        }}
        discount={selectedDiscount}
        onRefetch={fetchDiscounts}
      />
    </div>
  );
}