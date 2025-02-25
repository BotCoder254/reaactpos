import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import OrderCard from '../components/orders/OrderCard';

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(q);
      const ordersList = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Orders</h1>
      <div className="grid gap-6">
        {orders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <p className="text-gray-500 text-center">No orders found</p>
        )}
      </div>
    </div>
  );
}

export default Orders; 