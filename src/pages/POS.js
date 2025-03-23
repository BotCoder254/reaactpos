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
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getEmployeeStats } from '../utils/employeeQueries';
import { getActiveDynamicPricingRules, calculateDynamicPrice } from '../utils/dynamicPricingQueries';

export default function POS() {
  const [products, setProducts] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [dynamicPricingRules, setDynamicPricingRules] = useState([]);
  const [originalPrices, setOriginalPrices] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const productsData = await getProducts();
        
        const fetchedProducts = {};
        const prices = {};
        
        productsData.forEach(product => {
          fetchedProducts[product.id] = {
            ...product,
            price: Number(product.price),
            stock: Number(product.stock),
            inCart: false
          };
          prices[product.id] = product.price;
        });

        // Apply dynamic pricing rules
        Object.keys(fetchedProducts).forEach(productId => {
          const product = fetchedProducts[productId];
          const dynamicPrice = calculateDynamicPrice(product.price, dynamicPricingRules);
          product.price = dynamicPrice;
          product.originalPrice = prices[productId];
        });

        setProducts(fetchedProducts);
        setOriginalPrices(prices);
        setFilteredProducts(Object.values(fetchedProducts).slice(0, ITEMS_PER_PAGE));
        setHasMore(Object.values(fetchedProducts).length > ITEMS_PER_PAGE);
        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [dynamicPricingRules]);

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
    if (!products || Object.keys(products).length === 0) return;
    
    const filtered = Object.values(products).filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
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

  const loadMoreProducts = () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const currentProducts = Object.values(products);
    const nextProducts = currentProducts.slice(
      filteredProducts.length,
      filteredProducts.length + ITEMS_PER_PAGE
    );
    
    setFilteredProducts(prev => [...prev, ...nextProducts]);
    setHasMore(filteredProducts.length + nextProducts.length < currentProducts.length);
    setLoadingMore(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        === document.documentElement.offsetHeight
      ) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredProducts, products]);

  const addToCart = (product) => {
    if (products[product.id].inCart) return;
    
    const dynamicPrice = calculateDynamicPrice(
      product.originalPrice || product.price,
      dynamicPricingRules
    );
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1, price: dynamicPrice }];
    });

    setProducts(prev => ({
      ...prev,
      [product.id]: { ...prev[product.id], inCart: true }
    }));
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
    setProducts(prev => ({
      ...prev,
      [productId]: { ...prev[productId], inCart: false }
    }));
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
        discountType: selectedDiscount?.type,
        discountValue: selectedDiscount?.value,
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

      // Create the sale record
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

  const renderProduct = (product) => (
    <motion.div
      key={product.id}
      className={`bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow relative ${
        products[product.id]?.inCart ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !products[product.id]?.inCart && addToCart(product)}
      whileHover={{ scale: !products[product.id]?.inCart ? 1.02 : 1 }}
      whileTap={{ scale: !products[product.id]?.inCart ? 0.98 : 1 }}
    >
      <div className="relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-md mb-2">
            <FiImage className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {product.stock <= 10 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            Low Stock
          </div>
        )}
        {products[product.id]?.inCart && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-medium">In Cart</span>
          </div>
        )}
      </div>
      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
      <p className="text-sm text-gray-500 truncate">{product.description}</p>
      <div className="mt-1">
        {product.price !== originalPrices[product.id] ? (
          <div className="space-y-1">
            <span className="text-gray-500 line-through text-sm">
              ${originalPrices[product.id]?.toFixed(2)}
            </span>
            <span className="text-primary-600 font-semibold block">
              ${product.price.toFixed(2)}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Special Price
            </span>
          </div>
        ) : (
          <span className="text-gray-900 font-semibold">
            ${product.price.toFixed(2)}
          </span>
        )}
      </div>
      <div className="mt-1 text-sm text-gray-500">
        Stock: {product.stock}
      </div>
    </motion.div>
  );

  const handleProductSearch = (term) => {
    setSearchTerm(term);
    if (!products || Object.keys(products).length === 0) return;
    
    if (term.trim() === '') {
      setFilteredProducts(Object.values(products));
    } else {
      const filtered = Object.values(products).filter(
        (product) =>
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.category.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredProducts(filtered);
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
              onChange={(e) => handleProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search products..."
            />
          </div>
        </div>

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
          ) : error ? (
            <div className="col-span-full text-center text-red-600">
              {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              No products found.
            </div>
          ) : (
            filteredProducts.map((product) => renderProduct(product))
          )}
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