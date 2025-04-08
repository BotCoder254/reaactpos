# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY stripeapi/package*.json ./stripeapi/

# Install dependencies
RUN npm install --legacy-peer-deps
RUN cd stripeapi && npm install

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built React app and Stripe API
COPY --from=build /app/build ./build
COPY --from=build /app/stripeapi ./stripeapi

# Install serve for React app
RUN npm install -g serve

# Copy start script
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 3000 4242

CMD ["./start.sh"]