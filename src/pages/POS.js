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
  FiTrendingUp,
  FiPause,
  FiStar,
  FiPackage
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useHeldTransactions } from '../contexts/HeldTransactionsContext';
import { useLoyalty } from '../contexts/LoyaltyContext';
import HeldTransactions from '../components/transactions/HeldTransactions';
import LoyaltySection from '../components/loyalty/LoyaltySection';
import { getProducts } from '../utils/inventoryQueries';
import { createSale, emailReceipt } from '../utils/salesQueries';
import { searchCustomers, quickSearchCustomers, updateCustomerAfterPurchase } from '../utils/customerQueries';
import { getActiveDiscounts, calculateDiscount } from '../utils/discountQueries';
import CustomerModal from '../components/customers/CustomerModal';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { getEmployeeStats } from '../utils/employeeQueries';
import { getActiveDynamicPricingRules, calculateDynamicPrice } from '../utils/dynamicPricingQueries';
import { getReceiptBranding, generateReceiptHTML } from '../utils/receiptQueries';
import ChangeCalculator from '../components/transactions/ChangeCalculator';
import { toast } from 'react-hot-toast';
import { useInventory } from '../contexts/InventoryContext';
import TransactionVerification from '../components/fraud/TransactionVerification';
import { formatCurrency, formatDate, formatInvoiceNumber } from '../utils/formatters';
import { sendDigitalReceipt } from '../utils/digitalReceiptQueries';
import { useInvoiceCustomization } from '../contexts/InvoiceCustomizationContext';
import { getStripeConfig, createPaymentIntent } from '../utils/stripeUtils';
import StripeCardForm from '../components/payments/StripeCardForm';

const TAX_RATE = 0.1; // 10% tax rate

const calculateTax = (subtotal) => {
  return subtotal * TAX_RATE;
};

const saveSale = async (saleData) => {
  try {
    const saleRef = await addDoc(collection(db, 'sales'), {
      ...saleData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      id: saleRef.id,
      ...saleData
    };
  } catch (error) {
    console.error('Error saving sale:', error);
    throw new Error('Failed to save sale');
  }
};

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
  const [taxAmount, setTaxAmount] = useState(0);
  const { currentUser } = useAuth();
  const [cashierStats, setCashierStats] = useState(null);
  const [dynamicPricingRules, setDynamicPricingRules] = useState([]);
  const [originalPrices, setOriginalPrices] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 12;
  const [receiptBranding, setReceiptBranding] = useState(null);
  const { holdTransaction, resumeTransaction, heldTransactions } = useHeldTransactions();
  const [isChangeCalculatorOpen, setIsChangeCalculatorOpen] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState(null);
  const { loyaltyProgram, addPoints } = useLoyalty();
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const { checkLowStock, findAlternatives, updateInventory } = useInventory();
  const [alternativeProducts, setAlternativeProducts] = useState([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const { settings: invoiceSettings } = useInvoiceCustomization();
  const [currentSale, setCurrentSale] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const productsData = await getProducts();
        
        const fetchedProducts = {};
        const prices = {};
        
        productsData.forEach(product => {
          // Ensure image array exists and is valid
          const validImages = Array.isArray(product.images) 
            ? product.images.map(img => {
                if (!img) return null;
                if (typeof img === 'string') return { url: img };
                return img;
              }).filter(img => img && (typeof img.url === 'string'))
            : [];
          
          fetchedProducts[product.id] = {
            ...product,
            price: Number(product.price) || 0,
            stock: Number(product.stock) || 0,
            inCart: false,
            images: validImages
          };
          prices[product.id] = Number(product.price) || 0;
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
      const amount = calculateDiscount(calculateTotal().subtotal, selectedDiscount);
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

  useEffect(() => {
    const fetchReceiptBranding = async () => {
      try {
        const branding = await getReceiptBranding();
        setReceiptBranding(branding);
      } catch (error) {
        console.error('Error fetching receipt branding:', error);
      }
    };

    fetchReceiptBranding();
  }, []);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerResults([]);
    setCustomerSearchTerm('');
    setShowCustomerSearch(false);
  };

  const handleCustomerSearch = async (term) => {
    setCustomerSearchTerm(term);
    if (term.trim()) {
      try {
        const results = await quickSearchCustomers(term);
        // Enhance customer results with loyalty information
        const enhancedResults = results.map(customer => ({
          ...customer,
          loyaltyStatus: customer.loyaltyAccount ? 'Member' : 'Non-member'
        }));
        setCustomerResults(enhancedResults);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomerResults([]);
      }
    } else {
      setCustomerResults([]);
    }
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

  const addToCart = async (product) => {
    if (products[product.id].inCart) return;
    
    // Check for low stock before adding to cart
    const isLowStock = await checkLowStock(product.id);
    
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock`);
      const alternatives = await findAlternatives(product.id);
      if (alternatives.length > 0) {
        // Ensure proper image structure for alternative products
        const formattedAlternatives = alternatives.map(alt => ({
          ...alt,
          images: Array.isArray(alt.images) 
            ? alt.images.map(img => {
                if (!img) return null;
                if (typeof img === 'string') return { url: img };
                return img;
              }).filter(img => img && (typeof img.url === 'string'))
            : []
        }));
        setAlternativeProducts(formattedAlternatives);
        setShowAlternatives(true);
      }
      return;
    }

    // Show low stock notification if needed
    if (isLowStock) {
      toast(`${product.name} is running low on stock`, {
        icon: '⚠️',
        duration: 3000,
        style: {
          backgroundColor: '#FEF3C7',
          color: '#92400E'
        }
      });
    }

    const dynamicPrice = calculateDynamicPrice(
      product.originalPrice || product.price,
      dynamicPricingRules
    );
    
    // Ensure proper image structure when adding to cart
    const formattedProduct = {
      ...product,
      images: Array.isArray(product.images) 
        ? product.images.map(img => {
            if (!img) return null;
            if (typeof img === 'string') return { url: img };
            return img;
          }).filter(img => img && (typeof img.url === 'string'))
        : []
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...formattedProduct, quantity: 1, price: dynamicPrice }];
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
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = selectedDiscount 
      ? calculateDiscount(subtotal, selectedDiscount)
      : 0;
    const totalAfterDiscount = subtotal - discountAmount - loyaltyDiscount;
    const tax = calculateTax(totalAfterDiscount);
    return {
      subtotal,
      discount: discountAmount + loyaltyDiscount,
      tax,
      total: totalAfterDiscount + tax
    };
  };

  const handleDiscountSelect = (discount) => {
    if (selectedDiscount?.id === discount.id) {
      setSelectedDiscount(null);
    } else {
      setSelectedDiscount(discount);
    }
  };

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const resetCart = () => {
    setCart([]);
    setCurrentSale(null);
    setSelectedPaymentMethod('cash');
  };

  const updateInventoryAfterSale = async (items) => {
    try {
      for (const item of items) {
        await updateInventory(item.id, -item.quantity);
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
    }
  };

  const handleEmailReceipt = async (email) => {
    if (!currentSale?.id) {
      toast.error('No sale to send receipt for');
      return;
    }

    try {
      await sendDigitalReceipt(currentSale.id, email);
      toast.success('Digital receipt sent successfully');
    } catch (error) {
      console.error('Error sending digital receipt:', error);
      toast.error('Failed to send digital receipt');
    }
  };

  const handlePaymentComplete = async (cashReceived, change) => {
    try {
      setLoading(true);
      setError(null);

      const saleData = {
        items: cart,
        total: calculateTotal(),
        paymentMethod: selectedPaymentMethod,
        cashReceived: parseFloat(cashReceived),
        change: parseFloat(change),
        timestamp: new Date(),
        status: 'completed'
      };

      // Save sale to database
      const savedSale = await saveSale(saleData);
      setCurrentSale(savedSale);

      // Update inventory
      await updateInventoryAfterSale(cart);

      // Reset cart
      resetCart();

      toast.success('Sale completed successfully');
      return savedSale;
    } catch (error) {
      console.error('Error completing sale:', error);
      setError('Failed to complete sale');
      toast.error('Failed to complete sale');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = (paymentMethod) => {
    setCurrentPaymentMethod(paymentMethod);
    if (paymentMethod === 'cash') {
      setIsChangeCalculatorOpen(true);
    } else if (paymentMethod === 'card') {
      handleStripePayment();
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptBranding || cart.length === 0) return;

    const saleData = {
      items: cart,
      subtotal: calculateTotal().subtotal,
      discount: calculateTotal().discount,
      discountName: selectedDiscount?.name,
      tax: calculateTax(calculateTotal().subtotal),
      total: calculateTotal().total,
      customerName: selectedCustomer?.name,
      cashierName: currentUser.email,
      timestamp: new Date(),
      id: Date.now().toString()
    };

    const receiptHTML = generateReceiptHTML(receiptBranding, saleData);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const handleHoldTransaction = () => {
    if (!cart.length) return;
    
    const transaction = {
      items: cart,
      total: calculateTotal().total,
      customer: selectedCustomer,
      timestamp: new Date().toISOString()
    };
    
    holdTransaction(transaction);

    // Reset inCart state for all products in cart
    setProducts(prev => {
      const updated = { ...prev };
      cart.forEach(item => {
        if (updated[item.id]) {
          updated[item.id] = { ...updated[item.id], inCart: false };
        }
      });
      return updated;
    });
    
    setCart([]);
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setTaxAmount(0);
    setLoyaltyDiscount(0);
  };

  const handleResumeTransaction = (transactionId) => {
    const transaction = resumeTransaction(transactionId);
    if (!transaction) return;
    
    // Update inCart state for resumed products
    setProducts(prev => {
      const updated = { ...prev };
      transaction.items.forEach(item => {
        if (updated[item.id]) {
          updated[item.id] = { ...updated[item.id], inCart: true };
        }
      });
      return updated;
    });
    
    setCart(transaction.items);
    if (transaction.customer) {
      setSelectedCustomer(transaction.customer);
    }
    calculateTotal();
  };

  const handleLoyaltyDiscount = (amount) => {
    setLoyaltyDiscount(amount);
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
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-32 object-cover rounded-md mb-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              e.target.className = "w-full h-32 object-contain rounded-md mb-2 bg-gray-100";
            }}
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
        {product.images?.[0]?.photographer && (
          <div className="absolute bottom-2 left-2">
            <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
              Photo by {product.images[0].photographer}
            </span>
        </div>
        )}
      </div>
      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
      <p className="text-sm text-gray-500 truncate">{product.description}</p>
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
      <div className="mt-1 text-sm text-gray-500">
        Stock: {product.stock || 0}
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

  const AlternativesModal = () => {
    if (!showAlternatives) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
          >
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-medium text-gray-900">
                  Alternative Products Available
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {alternativeProducts.map(product => (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-4 rounded-lg shadow-sm cursor-pointer"
                      onClick={() => {
                        addToCart(product);
                        setShowAlternatives(false);
                      }}
                    >
                      <div className="relative">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-md mb-2"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                              e.target.className = "w-full h-32 object-contain rounded-md mb-2 bg-gray-100";
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-md mb-2">
                            <FiPackage className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        {product.images?.[0]?.photographer && (
                          <div className="absolute bottom-2 left-2">
                            <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
                              Photo by {product.images[0].photographer}
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">${(product.price || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Stock: {product.stock || 0}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setShowAlternatives(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  const handleProcessTransaction = async () => {
    try {
      const totals = calculateTotal();
      const transaction = {
        items: cart,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        customerId: selectedCustomer?.id,
        cashierId: currentUser.uid,
        timestamp: new Date()
      };
      
      setCurrentTransaction(transaction);
      return transaction;
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to process transaction');
    }
  };

  const handleStripePayment = async () => {
    try {
      setStripeLoading(true);
      setStripeError(null);
      setProcessing(true);

      const total = calculateTotal();
      const totalAmount = Math.round(total.total * 100); // Convert to cents

      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Invalid total amount');
      }

      const description = `Purchase of ${cart.length} items`;

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
      const total = calculateTotal();
      const totalAmount = Math.round(total.total * 100);

      // Create sale record
      const saleData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal: total.subtotal,
        tax: total.tax,
        discount: discountAmount,
        total: totalAmount / 100,
        paymentMethod: 'card',
        customerId: selectedCustomer?.id || null,
        cashierId: currentUser?.uid || null,
        timestamp: new Date(),
        status: 'completed'
      };

      console.log('Saving sale data:', saleData);

      // Save to Firebase
      const salesRef = collection(db, 'sales');
      const docRef = await addDoc(salesRef, saleData);

      if (!docRef.id) {
        throw new Error('Failed to save sale to database');
      }

      // Update inventory first
      const updatePromises = cart.map(item => {
        const productRef = doc(db, 'products', item.id);
        return updateDoc(productRef, {
          stock: increment(-(item.quantity))
        });
      });

      await Promise.all(updatePromises);

      // Update customer loyalty points if applicable
      if (selectedCustomer && loyaltyProgram) {
        await addPoints(selectedCustomer.id, totalAmount / 100);
      }

      // Reset all states
      setCart([]);
      setDiscountAmount(0);
      setTaxAmount(0);
      setSelectedCustomer(null);
      setShowCardForm(false);
      setPaymentClientSecret(null);
      
      // Refresh products by refetching categories and products
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      
      toast.success('Payment successful!', {
        onClose: () => {
          // Reset search and filters
      setSearchTerm('');
      setSelectedCategory('all');
        }
      });

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
        {/* Cashier Stats */}
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

        {/* Held Transactions Section */}
        <HeldTransactions onResume={handleResumeTransaction} />

        {/* Search Bar */}
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
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                    {selectedCustomer.loyaltyAccount && (
                      <p className="text-xs text-primary-600">
                        <FiStar className="inline-block w-3 h-3 mr-1" />
                        {selectedCustomer.loyaltyAccount.points.toLocaleString()} points
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setLoyaltyDiscount(0);
                  }}
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
                        onChange={(e) => handleCustomerSearch(e.target.value)}
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
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary-600 font-medium">
                                    {customer.name[0].toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-2">
                                  <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                                  <p className="text-xs text-gray-500">{customer.phone}</p>
                                </div>
                              </div>
                              {customer.loyaltyAccount && (
                                <div className="flex items-center text-primary-600">
                                  <FiStar className="w-4 h-4 mr-1" />
                                  <span className="text-xs font-medium">
                                    {customer.loyaltyAccount.points.toLocaleString()} pts
                                  </span>
                                </div>
                              )}
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
              <span>${calculateTotal().subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary-600">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span>${calculateTax(calculateTotal().subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${calculateTotal().total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleHoldTransaction}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <FiPause className="mr-2 h-5 w-5" />
              Hold Transaction
            </button>
            <button
              onClick={() => handleCheckout('cash')}
              disabled={cart.length === 0 || processing}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Pay with Cash'}
            </button>
            <button
              onClick={() => handleCheckout('card')}
              disabled={cart.length === 0 || processing || stripeLoading}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {processing || stripeLoading ? 'Processing...' : 'Pay with Card'}
            </button>
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={handlePrintReceipt}
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

        {/* Customer and Loyalty Section */}
        {selectedCustomer && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiUser className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {selectedCustomer.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Loyalty Section */}
        {selectedCustomer && (
          <div className="mt-4">
            <LoyaltySection
              total={calculateTotal().total}
              onApplyDiscount={handleLoyaltyDiscount}
            />
          </div>
        )}
      </div>

      <ChangeCalculator
        isOpen={isChangeCalculatorOpen}
        onClose={() => setIsChangeCalculatorOpen(false)}
        totalAmount={calculateTotal().total}
        onComplete={handlePaymentComplete}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onRefetch={() => handleCustomerSearch(customerSearchTerm)}
      />

      <AlternativesModal />

      {showCardForm && paymentClientSecret && (
        <StripeCardForm
          amount={Math.round(calculateTotal().total * 100)}
          clientSecret={paymentClientSecret}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* Update Transaction Verification */}
      <TransactionVerification 
        transaction={currentTransaction} 
        onVerify={handleProcessTransaction}
      />
    </div>
  );
}