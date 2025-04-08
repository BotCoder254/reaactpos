let stripe;
let elements;
let currentPaymentIntentId = null; // Store the payment intent ID

async function initialize() {
    try {
        // Get Stripe publishable key
        const response = await fetch('/config');
        const { publishableKey } = await response.json();
        
        stripe = Stripe(publishableKey);
        elements = stripe.elements();

        // Create and mount the card element
        const card = elements.create('card');
        card.mount('#card-element');

        // Handle validation errors
        card.addEventListener('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });

        return card;
    } catch (error) {
        console.error('Error initializing payment:', error);
        showError('Failed to initialize payment system. Please try again.');
    }
}

async function handleSubmit(e, card) {
    e.preventDefault();
    setLoading(true);

    try {
        const amount = Math.round(parseFloat(document.getElementById('amount').value) * 100);
        
        // Create payment intent
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                currency: 'usd',
                description: 'Payment for order'
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        // Store the payment intent ID
        currentPaymentIntentId = data.paymentIntentId;

        showMessage('Processing payment...', 'processing');

        // Confirm card payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
            payment_method: {
                card,
                billing_details: {
                    // Add billing details if needed
                }
            }
        });

        if (error) {
            throw new Error(error.message);
        }

        // Check payment status
        if (paymentIntent.status === 'succeeded') {
            showMessage(`Payment successful! Payment ID: ${currentPaymentIntentId}`, 'success');
            
            // Add refund button after successful payment
            addRefundButton(currentPaymentIntentId);
            
            document.getElementById('payment-form').reset();
            card.clear();
        } else {
            showMessage(`Payment status: ${paymentIntent.status}`, 'processing');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

async function handleRefund(paymentIntentId) {
    try {
        showMessage('Processing refund...', 'processing');

        const response = await fetch('/refund', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paymentIntentId: paymentIntentId
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        showMessage(`Refund processed successfully! Refund ID: ${data.refundId}`, 'success');
    } catch (error) {
        showError(`Refund failed: ${error.message}`);
    }
}

function addRefundButton(paymentIntentId) {
    const paymentStatus = document.getElementById('payment-status');
    const refundButton = document.createElement('button');
    refundButton.textContent = 'Refund Payment';
    refundButton.className = 'refund-button';
    refundButton.onclick = () => handleRefund(paymentIntentId);
    paymentStatus.appendChild(refundButton);
}

// UI helper functions
function setLoading(isLoading) {
    const submitButton = document.getElementById('submit-payment');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('button-text');

    if (isLoading) {
        submitButton.disabled = true;
        spinner.classList.remove('hidden');
        buttonText.textContent = 'Processing...';
    } else {
        submitButton.disabled = false;
        spinner.classList.add('hidden');
        buttonText.textContent = 'Pay Now';
    }
}

function showMessage(message, type = 'processing') {
    const messageDiv = document.getElementById('payment-status');
    const messageText = document.getElementById('payment-message');
    const spinner = document.getElementById('payment-spinner');

    messageDiv.className = type;
    messageDiv.classList.remove('hidden');
    messageText.textContent = message;

    if (type === 'processing') {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

function showError(message) {
    showMessage(message, 'error');
}

// Initialize the payment form
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const card = await initialize();
        const form = document.getElementById('payment-form');
        
        if (form && card) {
            form.addEventListener('submit', (e) => handleSubmit(e, card));
        }
    } catch (error) {
        console.error('Failed to initialize payment form:', error);
        showError('Failed to initialize payment form. Please refresh the page.');
    }
});
