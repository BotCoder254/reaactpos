import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUpload, 
  FiX, 
  FiSearch, 
  FiDollarSign, 
  FiHash, 
  FiFileText, 
  FiPackage,
  FiSend,
  FiAlertCircle
} from 'react-icons/fi';
import { useRefund } from '../../contexts/RefundContext';
import { getProducts } from '../../utils/inventoryQueries';
import { getOrders } from '../../utils/orderQueries';

export default function RefundRequest() {
  const { initiateRefund, loading, error } = useRefund();
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [showOrderSearch, setShowOrderSearch] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    };
    fetchProducts();
    fetchOrders();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'image/jpeg' || file.type === 'image/png') {
        setReceipt(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setSubmitError('Please upload a JPEG or PNG image');
      }
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (product.price) {
      setAmount(product.price.toString());
    }
    setShowProductSearch(false);
    setSearchTerm(product.name);
  };

  const handleOrderSelect = (order) => {
    setOrderId(order.id);
    setOrderSearchTerm(`${order.id} - ${order.customerName}`);
    setShowOrderSearch(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(orderSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!orderId || !amount || !reason || !selectedProduct) {
      setSubmitError('Please fill in all required fields and select a product');
      return;
    }

    try {
      // Clean and validate data before submission
      const refundData = {
        orderId: orderId.trim(),
        amount: parseFloat(amount) || 0,
        reason: reason.trim(),
        productId: selectedProduct?.id || '',
        productName: selectedProduct?.name || '',
        productSKU: selectedProduct?.sku || '',  // Add fallback for undefined SKU
        timestamp: new Date(),
        status: 'pending'
      };

      // Only add receipt if it exists
      if (receipt) {
        refundData.receipt = receipt;
      }

      // Additional validation
      if (refundData.amount <= 0) {
        setSubmitError('Refund amount must be greater than 0');
        return;
      }

      await initiateRefund(refundData);
      
      // Reset form
      setOrderId('');
      setAmount('');
      setReason('');
      setReceipt(null);
      setPreviewUrl('');
      setSelectedProduct(null);
      setSearchTerm('');
      setOrderSearchTerm('');
    } catch (err) {
      console.error('Refund submission error:', err);
      setSubmitError(err.message || 'Failed to create refund request. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <FiFileText className="w-5 h-5 mr-2" />
          Request a Refund
        </h2>

        {(error || submitError) && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
            <FiAlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error || submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="orderId"
              className="block text-sm font-medium text-gray-700 flex items-center"
            >
              <FiHash className="w-4 h-4 mr-1" />
              Order ID
            </label>
            <div className="relative">
              <input
                type="text"
                id="orderId"
                value={orderSearchTerm}
                onChange={(e) => {
                  setOrderSearchTerm(e.target.value);
                  setShowOrderSearch(true);
                }}
                onFocus={() => setShowOrderSearch(true)}
                className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search by order ID or customer name"
              />
              {showOrderSearch && filteredOrders.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderSelect(order)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">{order.id}</div>
                      <div className="text-sm text-gray-500">
                        Customer: {order.customerName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FiPackage className="w-4 h-4 mr-1" />
              Product
            </label>
            <div className="relative">
              <div className="relative mt-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowProductSearch(true);
                  }}
                  onFocus={() => setShowProductSearch(true)}
                  className="block w-full h-10 border border-gray-300 rounded-md shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search for product"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {showProductSearch && filteredProducts.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku} - ${product.price}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedProduct && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  Selected: {selectedProduct.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setAmount('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 flex items-center"
            >
              <FiDollarSign className="w-4 h-4 mr-1" />
              Refund Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full h-10 pl-7 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 flex items-center"
            >
              <FiFileText className="w-4 h-4 mr-1" />
              Reason for Refund
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Please provide a detailed reason for the refund request"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FiUpload className="w-4 h-4 mr-1" />
              Receipt Upload (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="mx-auto h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReceipt(null);
                        setPreviewUrl('');
                      }}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:text-red-500 focus:outline-none"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt"
                        className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FiSend className="w-4 h-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit Refund Request'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 