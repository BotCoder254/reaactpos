import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  loading: false,
  error: null,
  selectedOrder: null
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    }
  }
});

export const {
  setOrders,
  setLoading,
  setError,
  addOrder,
  updateOrder,
  setSelectedOrder
} = orderSlice.actions;

export default orderSlice.reducer; 