import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiAlertCircle, FiHelpCircle, FiUser, FiUserCheck, FiImage, FiCreditCard, FiUserPlus, FiPhone, FiMail, FiTrash2, FiTag, FiStar } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import CheckoutSummary from './CheckoutSummary';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getActiveDiscounts, calculateDiscount } from '../../utils/discountQueries';
import { getActiveDynamicPricingRules, calculateDynamicPrice } from '../../utils/dynamicPricingQueries';

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
          
          const basePrice = Number(data.price) || 0;
          const dynamicPrice = calculateDynamicPrice(basePrice, dynamicPricingRules);
          
          return {
            id: doc.id,
            ...data,
            price: dynamicPrice,
            originalPrice: basePrice,
            stock: Number(data.stock) || 0,
            image: imageUrl || 'https://via.placeholder.com/150?text=No+Image',
            category: data.category || 'Uncategorized'
          };
        });
        
        const prices = {};
        loadedProducts.forEach(product => {
          prices[product.id] = product.originalPrice;
        });
        
        setProducts(loadedProducts);
        setFilteredProducts(loadedProducts);
        setOriginalPrices(prices);
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

  const handleDiscountApplied = (amount) => {
    setDiscountAmount(amount);
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

  const calculateTotal = () => {
    const subtotalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountValue = selectedDiscount ? calculateDiscount(subtotalAmount, selectedDiscount) : 0;
    const totalAfterDiscount = subtotalAmount - discountValue;
    const tax = totalAfterDiscount * 0.1; // 10% tax rate
    
    return {
      subtotal: subtotalAmount,
      discount: discountValue,
      tax,
      total: totalAfterDiscount + tax
    };
  };

  const handlePayment = async (method) => {
    try {
      setProcessing(true);
      setSelectedPaymentMethod(method);

      const totals = calculateTotal();

      // Log the transaction with discount details
      await addDoc(collection(db, 'self-checkout-logs'), {
        action: 'payment_initiated',
        stationId: currentStationId,
        timestamp: serverTimestamp(),
        paymentMethod: method,
        subtotal: totals.subtotal,
        discount: totals.discount,
        discountDetails: selectedDiscount ? {
          id: selectedDiscount.id,
          name: selectedDiscount.name,
          type: selectedDiscount.type,
          value: selectedDiscount.value
        } : null,
        tax: totals.tax,
        total: totals.total,
        items: cart,
        customerDetails
      });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear cart and reset state after successful payment
      setCart([]);
      setSubtotal(0);
      setDiscountAmount(0);
      setSelectedDiscount(null);

      toast.success('Payment successful! Thank you for shopping.');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again or seek assistance.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDiscountSelect = (discount) => {
    if (selectedDiscount?.id === discount.id) {
      setSelectedDiscount(null);
    } else {
      setSelectedDiscount(discount);
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

  const renderProduct = (product) => (
    <motion.div
      key={product.id}
      whileHover={{ scale: 1.02 }}
      className="border rounded-lg p-4 cursor-pointer"
      onClick={() => handleAddItem(product)}
    >
      <div className="relative w-full h-32 mb-2">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover rounded"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
          }}
        />
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
  );

  const renderDiscountSection = () => (
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {showCustomerForm && (
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
        )}
      </AnimatePresence>

      {/* Customer Details Display */}
      {customerDetails && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <FiUser className="mr-2" />
                {customerDetails.name}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiPhone className="mr-2" />
                {customerDetails.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="mr-2" />
                {customerDetails.email}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Self-Checkout</h1>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <FiUser className="mr-2" />
                    Staff Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRequestAssistance}
                    disabled={isRequestingAssistance}
                    className="flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
                  >
                    <FiHelpCircle className="mr-2" />
                    {isRequestingAssistance ? 'Requesting...' : 'Request Assistance'}
                  </motion.button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Available Products */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Products</h2>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => renderProduct(product))}
                  </div>
                )}
              </div>

              {/* Shopping Cart */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Cart</h2>
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg mb-4">
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
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center py-8">
                    <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Your cart is empty. Add items to begin checkout.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <CheckoutSummary
                {...calculateTotal()}
                onDiscountApplied={handleDiscountApplied}
                selectedDiscount={selectedDiscount}
                onDiscountSelect={handleDiscountSelect}
                activeDiscounts={activeDiscounts}
              />
              
              {renderDiscountSection()}

              <div className="mt-6 space-y-4">
                <button
                  onClick={() => handlePayment('cash')}
                  disabled={cart.length === 0 || processing}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {processing && selectedPaymentMethod === 'cash' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <FiShoppingCart className="mr-2 h-5 w-5" />
                      Pay with Cash
                    </>
                  )}
                </button>

                <button
                  onClick={() => handlePayment('card')}
                  disabled={cart.length === 0 || processing}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {processing && selectedPaymentMethod === 'card' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <FiCreditCard className="mr-2 h-5 w-5" />
                      Pay with Card
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showLoginModal && <LoginModal />}
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
    </div>
  );
} 
