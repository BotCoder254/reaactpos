require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());

// Configure CORS with specific origin
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://reaactpos-55uo.onrender.com', 'http://localhost:3000']
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

app.use(express.static('public'));

// Serve the payment page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get Stripe publishable key
app.get('/config', (req, res) => {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({
      error: {
        message: 'Missing Stripe publishable key'
      }
    });
  }
  res.json({ 
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY 
  });
});

// Create Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid amount provided'
        }
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Send the required data to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(400).json({
      error: {
        message: error.message || 'Payment intent creation failed',
        type: error.type,
        code: error.code
      }
    });
  }
});

// Process refund
app.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId) {
      throw new Error('Payment intent ID is required');
    }

    // First retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.latest_charge) {
      throw new Error('No charge found for this payment intent');
    }

    // Create the refund
    const refund = await stripe.refunds.create({
      charge: paymentIntent.latest_charge,
      amount: amount ? Math.round(amount) : undefined,
      reason: req.body.reason || 'requested_by_customer'
    });

    res.json({
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });
  } catch (error) {
    console.error('Refund Error:', error);
    res.status(400).json({
      error: {
        message: error.message || 'Refund failed',
        type: error.type,
        code: error.code
      }
    });
  }
});

// Get refund status
app.get('/refund/:refundId', async (req, res) => {
  try {
    if (!req.params.refundId) {
      throw new Error('Refund ID is required');
    }

    const refund = await stripe.refunds.retrieve(req.params.refundId);
    res.json(refund);
  } catch (error) {
    console.error('Refund Status Error:', error);
    res.status(400).json({
      error: {
        message: error.message || 'Failed to get refund status',
        type: error.type,
        code: error.code
      }
    });
  }
});

// Webhook endpoint to handle Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Add your business logic here (e.g., fulfill order, send email, etc.)
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Add your failure handling logic here
      break;
    case 'charge.refunded':
      const refund = event.data.object;
      console.log('Refund processed:', refund.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment status
app.get('/payment-status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (error) {
    res.status(400).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Stripe API server running on port ${port}`));