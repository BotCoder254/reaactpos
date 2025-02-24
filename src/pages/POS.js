import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiMail,
  FiImage,
  FiUser,
  FiUserPlus,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getProducts } from '../utils/inventoryQueries';
import { createSale, emailReceipt } from '../utils/salesQueries';
import { searchCustomers, quickSearchCustomers, updateCustomerAfterPurchase } from '../utils/customerQueries';
import CustomerModal from '../components/customers/CustomerModal';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setFilteredProducts(
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, products]);

  async function fetchProducts() {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCustomerSearch = async (term) => {
    setCustomerSearchTerm(term);
    if (term.trim()) {
      const results = await quickSearchCustomers(term);
      setCustomerResults(results);
    } else {
      setCustomerResults([]);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerResults([]);
    setCustomerSearchTerm('');
    setShowCustomerSearch(false);
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTax = () => {
    return calculateTotal() * 0.1; // 10% tax
  };

  const handleCheckout = async (paymentMethod) => {
    try {
      setProcessing(true);
      
      const saleData = {
        items: cart,
        subtotal: calculateTotal(),
        tax: calculateTax(),
        total: calculateTotal() + calculateTax(),
        paymentMethod,
        cashierId: currentUser.uid,
        cashierName: currentUser.email,
        timestamp: new Date(),
        ...(selectedCustomer && { 
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name
        })
      };

      const saleId = await createSale(saleData);

      // Update customer data if a customer was selected
      if (selectedCustomer) {
        await updateCustomerAfterPurchase(
          selectedCustomer.id,
          saleData.total
        );
      }

      // Clear cart and customer selection
      setCart([]);
      setSelectedCustomer(null);
      
      // Show success message
      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleEmailReceipt = async (email) => {
    try {
      await emailReceipt({
        items: cart,
        subtotal: calculateTotal(),
        tax: calculateTax(),
        total: calculateTotal() + calculateTax(),
        email,
        customerName: selectedCustomer?.name,
      });
      alert('Receipt sent successfully!');
    } catch (error) {
      console.error('Error sending receipt:', error);
      alert('Failed to send receipt');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Products Section */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow animate-pulse"
              >
                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <FiImage className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
                  <p className="text-gray-600">${product.price.toFixed(2)}</p>
                  {product.stock <= 10 && (
                    <p className="text-sm text-red-600 mt-1">
                      Low stock: {product.stock}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
          
          {/* Customer Selection */}
          <div className="mt-4">
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {selectedCustomer.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <button
                      onClick={() => setShowCustomerSearch(true)}
                      className="w-full flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiUser className="w-4 h-4 mr-2" />
                      Select Customer
                    </button>
                  </div>
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FiUserPlus className="w-4 h-4" />
                  </button>
                </div>

                {showCustomerSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-10">
                    <div className="p-2">
                      <input
                        type="text"
                        value={customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value);
                          handleCustomerSearch(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Search customers..."
                        autoFocus
                      />
                    </div>
                    {customerResults.length > 0 && (
                      <ul className="max-h-48 overflow-auto divide-y divide-gray-200">
                        {customerResults.map((customer) => (
                          <li
                            key={customer.id}
                            className="p-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 font-medium">
                                  {customer.name[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-2">
                                <p className="text-sm font-medium">{customer.name}</p>
                                <p className="text-xs text-gray-500">{customer.phone}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span>${calculateTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${(calculateTotal() + calculateTax()).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleCheckout('cash')}
              disabled={cart.length === 0 || processing}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Pay with Cash'}
            </button>
            <button
              onClick={() => handleCheckout('card')}
              disabled={cart.length === 0 || processing}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Pay with Card'}
            </button>
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => window.print()}
              disabled={cart.length === 0}
              className="p-2 text-gray-600 hover:text-primary-600"
            >
              <FiPrinter className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const email = prompt('Enter email address:');
                if (email) handleEmailReceipt(email);
              }}
              disabled={cart.length === 0}
              className="p-2 text-gray-600 hover:text-primary-600"
            >
              <FiMail className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onRefetch={() => handleCustomerSearch(customerSearchTerm)}
      />
    </div>
  );
}