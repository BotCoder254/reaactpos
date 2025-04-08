const STRIPE_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://reaactpos-55uo.onrender.com'
  : 'http://localhost:4242';


export const getStripeConfig = async () => {
  const response = await fetch(`${STRIPE_API_URL}/config`);
  if (!response.ok) {
    throw new Error('Failed to get Stripe configuration');
  }
  const { publishableKey } = await response.json();
  if (!publishableKey) {
    throw new Error('Invalid Stripe configuration');
  }
  return publishableKey;
};

export const createPaymentIntent = async ({ amount, currency = 'usd', description }) => {
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount');
  }

  try {
    const response = await fetch(`${STRIPE_API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        amount: Math.round(amount), // Ensure amount is an integer
        currency, 
        description 
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Payment failed';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error('Invalid response from payment server');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from payment server');
    }

    if (!data.clientSecret || !data.paymentIntentId) {
      throw new Error('Invalid payment intent response');
    }

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId
    };
  } catch (error) {
    console.error('Payment Intent Error:', error);
    throw error;
  }
};

export const processRefund = async ({ paymentIntentId, amount, reason }) => {
  if (!paymentIntentId) {
    throw new Error('Payment intent ID is required');
  }

  const response = await fetch(`${STRIPE_API_URL}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      paymentIntentId, 
      amount: amount ? Math.round(amount) : undefined,
      reason 
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Refund failed');
  }

  const data = await response.json();
  return data;
};

export const getRefundStatus = async (refundId) => {
  if (!refundId) {
    throw new Error('Refund ID is required');
  }

  const response = await fetch(`${STRIPE_API_URL}/refund/${refundId}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to get refund status');
  }

  const data = await response.json();
  return data;
};
