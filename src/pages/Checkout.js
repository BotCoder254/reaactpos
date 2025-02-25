import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiCreditCard } from 'react-icons/fi';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import DiscountBanner from '../components/discounts/DiscountBanner';
import { processPayment } from '../utils/paymentUtils';
import { createOrder } from '../utils/orderQueries';
import { clearCart } from '../utils/cartUtils';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    // Load cart items from localStorage or state management
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleDiscountApplied = (amount) => {
    setDiscountAmount(amount);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError('');

      // Process payment
      const paymentResult = await processPayment({
        amount: subtotal - discountAmount,
        items: cart,
        discountApplied: discountAmount > 0
      });

      if (paymentResult.success) {
        // Create order in database
        await createOrder({
          items: cart,
          subtotal,
          discount: discountAmount,
          total: subtotal - discountAmount,
          paymentId: paymentResult.paymentId
        });

        // Clear cart
        await clearCart();
        localStorage.removeItem('cart');

        // Navigate to success page
        navigate('/checkout/success', {
          state: {
            orderId: paymentResult.orderId
          }
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DiscountBanner />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="mt-2 text-sm text-gray-500">
                Please review your items and complete the payment.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Cart Items
              </h2>
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex justify-between">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {item.name}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        x{item.quantity}
                      </span>
                    </div>
                    <span className="text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <CheckoutSummary
              subtotal={subtotal}
              onDiscountApplied={handleDiscountApplied}
            />

            <div className="mt-8">
              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <>
                    <FiCreditCard className="mr-2 h-5 w-5" />
                    Complete Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 