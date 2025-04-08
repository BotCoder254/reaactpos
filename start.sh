#!/bin/sh

# Start the Stripe API server in the background
cd stripeapi && node index.js &

# Start the React app
serve -s build -l 3000
