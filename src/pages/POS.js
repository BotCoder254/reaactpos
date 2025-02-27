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
  FiX,
  FiTag,
  FiTrendingUp
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getProducts } from '../utils/inventoryQueries';
import { createSale, emailReceipt } from '../utils/salesQueries';
import { searchCustomers, quickSearchCustomers, updateCustomerAfterPurchase } from '../utils/customerQueries';
import { getActiveDiscounts, calculateDiscount } from '../utils/discountQueries';
import CustomerModal from '../components/customers/CustomerModal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getEmployeeStats } from '../utils/employeeQueries';

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
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { currentUser } = useAuth();
  const [cashierStats, setCashierStats] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const discounts = await getActiveDiscounts();
        setActiveDiscounts(discounts);
      } catch (error) {
        console.error('Error fetching discounts:', error);
      }
    };

    fetchDiscounts();
  }, []);

  useEffect(() => {
    if (selectedDiscount) {
      const amount = calculateDiscount(calculateTotal(), selectedDiscount);
      setDiscountAmount(amount);
    } else {
      setDiscountAmount(0);
    }
  }, [selectedDiscount, cart]);

  useEffect(() => {
    setFilteredProducts(
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, products]);

  useEffect(() => {
    const fetchCashierStats = async () => {
      if (currentUser) {
        try {
          const stats = await getEmployeeStats(currentUser.uid);
          setCashierStats(stats);
        } catch (error) {
          console.error('Error fetching cashier stats:', error);
        }
      }
    };

    fetchCashierStats();
  }, [currentUser]);

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
    const subtotal = calculateTotal() - discountAmount;
    return subtotal * 0.1; // 10% tax
  };

  const handleDiscountSelect = (discount) => {
    if (selectedDiscount?.id === discount.id) {
      setSelectedDiscount(null);
    } else {
      setSelectedDiscount(discount);
    }
  };

  const handleCheckout = async (paymentMethod) => {
    try {
      setProcessing(true);
      
      const subtotal = calculateTotal();
      const saleData = {
        items: cart,
        subtotal: subtotal,
        discount: discountAmount,
        discountId: selectedDiscount?.id,
        discountName: selectedDiscount?.name,
        tax: calculateTax(),
        total: subtotal - discountAmount + calculateTax(),
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

      // Clear cart, customer selection, and discount
      setCart([]);
      setSelectedCustomer(null);
      setSelectedDiscount(null);
      setDiscountAmount(0);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Products Section */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Add cashier performance indicator */}
        {cashierStats && (
          <div className="mb-4 p-2 bg-white rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center">
              <FiTrendingUp className={`h-5 w-5 ${
                cashierStats.dailyAverage > 1000 ? 'text-green-500' : 'text-gray-400'
              }`} />
              <span className="ml-2 text-sm font-medium text-gray-600">
                Today's Sales: ${cashierStats.dailyAverage.toFixed(2)}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {cashierStats.totalTransactions} transactions
            </span>
          </div>
        )}
        
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search products..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow p-4">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-600">${product.price}</p>
              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
              <button
                onClick={() => addToCart(product)}
                className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
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

          {/* Available Discounts */}
          {activeDiscounts.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Available Discounts</h3>
              <div className="space-y-2">
                {activeDiscounts.map((discount) => (
                  <button
                    key={discount.id}
                    onClick={() => handleDiscountSelect(discount)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                      selectedDiscount?.id === discount.id
                        ? 'bg-primary-50 border-primary-200'
                        : 'bg-gray-50 border-gray-200'
                    } border hover:bg-gray-100`}
                  >
                    <div className="flex items-center">
                      <FiTag className="h-5 w-5 text-primary-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {discount.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {discount.type === 'percentage'
                            ? `${discount.value}% off`
                            : 'Buy One Get One Free'}
                          {discount.minPurchase > 0 &&
                            ` (Min. $${discount.minPurchase})`}
                        </p>
                      </div>
                    </div>
                    {selectedDiscount?.id === discount.id && (
                      <span className="text-xs font-medium text-primary-600">
                        Applied
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary-600">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span>${calculateTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${(calculateTotal() - discountAmount + calculateTax()).toFixed(2)}</span>
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