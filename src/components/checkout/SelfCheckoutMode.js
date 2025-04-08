import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiAlertCircle, FiHelpCircle, FiUser, FiUserCheck, FiImage, FiCreditCard, FiUserPlus, FiPhone, FiMail, FiTrash2, FiTag } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import CheckoutSummary from './CheckoutSummary';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, updateDoc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getActiveDiscounts, calculateDiscount } from '../../utils/discountQueries';
import { getActiveDynamicPricingRules, calculateDynamicPrice } from '../../utils/dynamicPricingQueries';
import { getStripeConfig, createPaymentIntent } from '../../utils/stripeUtils';
import StripeCardForm from '../payments/StripeCardForm';

export default function SelfCheckoutMode() {
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [needsHelp, setNeedsHelp] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const [isRequestingAssistance, setIsRequestingAssistance] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const currentStationId = params.stationId || 'default';
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [dynamicPricingRules, setDynamicPricingRules] = useState([]);
  const [originalPrices, setOriginalPrices] = useState({});
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef);
        const snapshot = await getDocs(productsQuery);
        
        const loadedProducts = snapshot.docs.map(doc => {
          const data = doc.data();
          let imageUrl = null;
          
          // Handle different image field formats
          if (data.image && typeof data.image === 'string') {
            imageUrl = data.image;
          } else if (data.images && Array.isArray(data.images)) {
            imageUrl = data.images[0]?.url || data.images[0];
          } else if (data.imageUrl) {
            imageUrl = data.imageUrl;
          }
          
          return {
            id: doc.id,
            ...data,
            price: Number(data.price) || 0,
            stock: Number(data.stock) || 0,
            image: imageUrl || 'https://via.placeholder.com/150?text=No+Image',
            category: data.category || 'Uncategorized'
          };
        });
        
        setProducts(loadedProducts);
        setFilteredProducts(loadedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(newSubtotal);
  }, [cart]);

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
    const fetchDynamicPricingRules = async () => {
      try {
        const rules = await getActiveDynamicPricingRules();
        setDynamicPricingRules(rules);
      } catch (error) {
        console.error('Error fetching dynamic pricing rules:', error);
      }
    };

    fetchDynamicPricingRules();
  }, []);

  useEffect(() => {
    if (selectedDiscount) {
      const amount = calculateDiscount(subtotal, selectedDiscount);
      setDiscountAmount(amount);
    } else {
      setDiscountAmount(0);
    }
  }, [selectedDiscount, subtotal]);

  const handleAddItem = async (item) => {
    if (!customerDetails) {
      setShowCustomerForm(true);
      toast.error('Please enter your details first');
      return;
    }

    try {
      setCart(prev => {
        const existingItem = prev.find(i => i.id === item.id);
        if (existingItem) {
          return prev.map(i => 
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });

      await addDoc(collection(db, 'self-checkout-logs'), {
        action: 'add_item',
        itemId: item.id,
        stationId: currentStationId,
        timestamp: new Date(),
        value: item.price,
        customerDetails
      });
    } catch (error) {
      console.error('Error logging action:', error);
      toast.error('Failed to add item');
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      setCart(prev => {
        const existingItem = prev.find(i => i.id === item.id);
        if (existingItem.quantity > 1) {
          return prev.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
          );
        }
        return prev.filter(i => i.id !== item.id);
      });

      await addDoc(collection(db, 'self-checkout-logs'), {
        action: 'remove_item',
        itemId: item.id,
        stationId: currentStationId,
        timestamp: new Date(),
        value: item.price,
        customerDetails
      });

      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      setCart(prev => prev.filter(i => i.id !== item.id));

      await addDoc(collection(db, 'self-checkout-logs'), {
        action: 'delete_item',
        itemId: item.id,
        stationId: currentStationId,
        timestamp: new Date(),
        value: item.price * item.quantity,
        customerDetails
      });

      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleRequestAssistance = async () => {
    if (!customerDetails) {
      setShowCustomerForm(true);
      toast.error('Please enter your details first');
      return;
    }

    setIsRequestingAssistance(true);
    try {
      // First, ensure the station document exists
      const stationRef = doc(db, 'self-checkout-stations', currentStationId);
      await setDoc(stationRef, {
        status: 'active',
        needsAssistance: true,
        lastAssistanceRequest: new Date(),
        currentCustomer: customerDetails,
        isRemoteControlled: false,
        controlledBy: null
      }, { merge: true });

      // Create assistance request document
      const assistanceRef = await addDoc(collection(db, 'assistance-requests'), {
        stationId: currentStationId,
        timestamp: new Date(),
        status: 'pending',
        currentCustomer: customerDetails,
        cart,
        subtotal
      });

      toast.success('Assistance request sent successfully');
    } catch (error) {
      console.error('Error requesting assistance:', error);
      toast.error('Failed to request assistance. Please try again.');
    } finally {
      setIsRequestingAssistance(false);
    }
  };

  const handleDiscountSelect = (discount) => {
    if (selectedDiscount?.id === discount.id) {
      setSelectedDiscount(null);
    } else {
      setSelectedDiscount(discount);
    }
  };

  const handleRoleLogin = (role) => {
    switch (role) {
      case 'manager':
        navigate('/monitor');
        break;
      case 'cashier':
        navigate('/remote-assistance');
        break;
      default:
        setShowLoginModal(false);
    }
  };

  const handleStripePayment = async () => {
    try {
      setStripeLoading(true);
      setStripeError(null);
      setProcessing(true);

      const totalAmount = Math.round((subtotal - discountAmount) * 100); // Convert to cents

      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Invalid total amount');
      }

      const description = `Self-checkout purchase of ${cart.length} items`;

      console.log('Creating payment intent with amount:', totalAmount);

      // Create payment intent first
      const stripeData = await createPaymentIntent({
        amount: totalAmount,
        description
      });

      console.log('Payment intent response:', stripeData);

      if (!stripeData || !stripeData.paymentIntentId) {
        throw new Error('Invalid payment intent response');
      }

      // Store payment intent data and show card form
      setPaymentClientSecret(stripeData.clientSecret);
      setShowCardForm(true);
      setStripeLoading(false);
      setProcessing(false);

    } catch (error) {
      console.error('Payment failed:', error);
      setStripeError(error.message);
      toast.error(`Payment failed: ${error.message}`);
      setStripeLoading(false);
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const totalAmount = Math.round((subtotal - discountAmount) * 100);

      // Create sale record
      const saleData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal,
        discount: discountAmount,
        total: totalAmount / 100,
        paymentMethod: 'card',
        customerId: customerDetails?.id || null,
        stationId: currentStationId,
        timestamp: serverTimestamp(),
        status: 'completed'
      };

      console.log('Saving sale data:', saleData);

      // Save to Firebase
      const salesRef = collection(db, 'sales');
      const docRef = await addDoc(salesRef, saleData);

      if (!docRef.id) {
        throw new Error('Failed to save sale to database');
      }

      // Log the transaction
      const logData = {
        action: 'payment_completed',
        stationId: currentStationId,
        saleId: docRef.id,
        timestamp: serverTimestamp(),
        paymentMethod: 'card',
        total: totalAmount / 100
      };

      console.log('Creating transaction log:', logData);
      await addDoc(collection(db, 'self-checkout-logs'), logData);

      // Update inventory first
      const updatePromises = cart.map(item => {
        const productRef = doc(db, 'products', item.id);
        return updateDoc(productRef, {
          stock: increment(-(item.quantity))
        });
      });

      await Promise.all(updatePromises);

      // Reset all states
      setCart([]);
      setDiscountAmount(0);
      setCustomerDetails(null);
      setShowCustomerForm(true);
      setShowCardForm(false);
      setPaymentClientSecret(null);

      // Refresh products by refetching from Firebase
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      
      // Reset search and category
      setSearchTerm('');
      setSelectedCategory('all');

      toast.success('Payment successful!');

    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Payment successful but failed to save sale');
    }
  };

  const handlePaymentCancel = () => {
    setShowCardForm(false);
    setPaymentClientSecret(null);
    setStripeLoading(false);
    setProcessing(false);
  };

  const handlePayment = (method) => {
    setSelectedPaymentMethod(method);
    if (method === 'card') {
      handleStripePayment();
    }
  };

  // Login Modal Component
  const LoginModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Login</h2>
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleLogin('manager')}
            className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiUser className="mr-2" />
            Login as Manager
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleLogin('cashier')}
            className="w-full flex items-center justify-center px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700"
          >
            <FiUserCheck className="mr-2" />
            Login as Cashier
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLoginModal(false)}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  // Customer Form Component with improved styling
  const CustomerForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: '',
      phone: '',
      email: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl"
        >
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Enter Your Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                required
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                required
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email address"
              />
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left side - Products */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search products..."
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                <div className="w-full h-32 bg-gray-200 rounded-md mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAddItem(product)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                  {product.stock <= 10 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      Low Stock
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <div className="mt-1">
                  {product.price !== originalPrices[product.id] ? (
                    <div className="space-y-1">
                      <span className="text-gray-500 line-through text-sm">
                        ${(originalPrices[product.id] || 0).toFixed(2)}
                      </span>
                      <span className="text-primary-600 font-semibold block">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Special Price
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-900 font-semibold">
                      ${(product.price || 0).toFixed(2)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
          
          {/* Customer Form Section */}
          {showCustomerForm && !customerDetails && (
            <div className="mt-4">
              <CustomerForm
                onSubmit={(details) => {
                  setCustomerDetails(details);
                  setShowCustomerForm(false);
                  toast.success('Welcome! You can now start shopping.');
                }}
                onCancel={() => {
                  if (customerDetails) {
                    setShowCustomerForm(false);
                  } else {
                    toast.error('Please enter your details to continue');
                  }
                }}
              />
            </div>
          )}

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

        {/* Cart Items */}
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
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">${item.price?.toFixed(2) || '0.00'} each</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveItem(item)}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    -
                  </motion.button>
                  <span className="text-gray-600 w-8 text-center">{item.quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAddItem(item)}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    +
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteItem(item)}
                    className="p-2 text-red-400 hover:text-red-500 rounded-full hover:bg-red-50"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Cart Summary */}
        <div className="p-6 border-t border-gray-200">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary-600">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span>${((subtotal - discountAmount) * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${((subtotal - discountAmount) * 1.1).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => handlePayment('cash')}
                disabled={cart.length === 0 || processing}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Pay with Cash'}
              </button>
              <button
                onClick={() => handlePayment('card')}
                disabled={cart.length === 0 || processing || stripeLoading}
                className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {processing || stripeLoading ? 'Processing...' : 'Pay with Card'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLoginModal && <LoginModal />}
      </AnimatePresence>

      <AnimatePresence>
        {showCardForm && paymentClientSecret && (
          <StripeCardForm
            amount={Math.round((subtotal - discountAmount) * 100)}
            clientSecret={paymentClientSecret}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleRequestAssistance}
        disabled={isRequestingAssistance}
        className="fixed bottom-4 right-4 flex items-center px-6 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 disabled:opacity-50"
      >
        <FiHelpCircle className="mr-2" />
        {isRequestingAssistance ? 'Requesting...' : 'Request Assistance'}
      </motion.button>
    </div>
  );
} 
