# Stripe Payment API

A complete Node.js API for Stripe payments integration with support for payments, refunds, and webhooks.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env` file and add your Stripe keys:
  ```
  STRIPE_SECRET_KEY=sk_test_your_secret_key
  STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
  STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret  # Optional, for webhook testing
  ```

3. Start the server:
```bash
npm start
```

## API Endpoints for Postman

### 1. Create Payment Intent
- **POST** `/create-payment-intent`
- **Body**: 
  ```json
  {
    "amount": 1000,        // Amount in cents (e.g., 1000 = $10.00)
    "currency": "usd",     // Optional, defaults to "usd"
    "description": "Payment for order #123"  // Optional
  }
  ```
- **Response**:
  ```json
  {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
  ```

### 2. Get Payment Status
- **GET** `/payment-status/:paymentIntentId`
- **Response**:
  ```json
  {
    "status": "succeeded",
    "amount": 1000,
    "currency": "usd"
  }
  ```

### 3. Process Refund
- **POST** `/refund`
- **Body**:
  ```json
  {
    "paymentIntentId": "pi_xxx",
    "amount": 500,           // Optional, in cents. If omitted, full refund
    "reason": "requested_by_customer"  // Optional
  }
  ```
- **Response**:
  ```json
  {
    "refundId": "re_xxx",
    "amount": 500,
    "status": "succeeded"
  }
  ```

### 4. Get Refund Status
- **GET** `/refund/:refundId`
- **Response**: Full refund object from Stripe

### 5. Get Stripe Public Key
- **GET** `/config`
- **Response**:
  ```json
  {
    "publishableKey": "pk_test_xxx"
  }
  ```

## Testing with Postman

1. Import the collection:
   - Create a new collection in Postman
   - Add the above endpoints
   - Set base URL to `http://localhost:3000`

2. Set up environment variables:
   - Create a new environment
   - Add variable: `baseUrl` = `http://localhost:3000`

3. Test Card Numbers:
   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   Require Authentication: 4000 0025 0000 3155
   ```

4. Testing Flow:
   1. Create a payment intent
   2. Use the payment form in browser with test card
   3. Check payment status
   4. Process refund if needed
   5. Check refund status

## Web Interface

The API includes a web interface for testing payments:
- Visit `http://localhost:3000` in your browser
- Enter amount and card details
- Test payments with Stripe test cards

## Webhook Testing

1. Install Stripe CLI
2. Run webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/webhook
   ```
3. Copy the webhook signing secret to your `.env` file

## Error Handling

All endpoints return error responses in this format:
```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "code": "error_code"
  }
}
```

## Important Notes

- All amounts are in cents (e.g., 1000 = $10.00)
- Use Stripe test mode for development
- Keep your API keys secure
- Handle errors appropriately in your client application
- Monitor webhook events for payment status updates
