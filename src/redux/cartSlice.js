import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  discountAmount: 0,
  discountCode: '',
  showDiscountModal: false,
  processing: false,
  stationId: 'default-station',
  products: {},
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ ...product, quantity });
      }
      
      // Update products mapping
      state.products[product.id] = { ...product, inCart: true };
    },
    updateQuantity: (state, action) => {
      const { productId, change } = action.payload;
      const item = state.items.find(item => item.id === productId);
      if (item) {
        item.quantity = Math.max(0, item.quantity + change);
        if (item.quantity === 0) {
          state.items = state.items.filter(item => item.id !== productId);
          // Update product state when removed
          if (state.products[productId]) {
            state.products[productId].inCart = false;
          }
        }
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      // Update product state when removed
      if (state.products[action.payload]) {
        state.products[action.payload].inCart = false;
      }
    },
    setDiscountAmount: (state, action) => {
      state.discountAmount = action.payload;
    },
    setDiscountCode: (state, action) => {
      state.discountCode = action.payload;
    },
    setShowDiscountModal: (state, action) => {
      state.showDiscountModal = action.payload;
    },
    setProcessing: (state, action) => {
      state.processing = action.payload;
    },
    resetCart: (state) => {
      // Reset all product inCart states when cart is reset
      Object.keys(state.products).forEach(productId => {
        if (state.products[productId]) {
          state.products[productId].inCart = false;
        }
      });
      return {
        ...initialState,
        products: state.products
      };
    },
    setProducts: (state, action) => {
      state.products = action.payload;
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  setDiscountAmount,
  setDiscountCode,
  setShowDiscountModal,
  setProcessing,
  resetCart,
  setProducts,
} = cartSlice.actions;

export default cartSlice.reducer; 