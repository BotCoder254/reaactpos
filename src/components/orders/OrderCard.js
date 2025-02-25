import React from 'react';
import { formatCurrency } from '../../utils/cartUtils';

function OrderCard({ order }) {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Order #{order.id.slice(-6)}</h3>
          <p className="text-sm text-gray-500">{new Date(order.createdAt?.toDate()).toLocaleString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flow-root">
          <ul className="-my-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-4">
                <div className="flex items-start">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Total</p>
          <p>{formatCurrency(order.total)}</p>
        </div>
      </div>
    </div>
  );
}

export default OrderCard; 