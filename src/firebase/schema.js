// Self-checkout station schema
export const selfCheckoutStationSchema = {
  id: 'string', // Station ID
  status: 'string', // 'active', 'inactive', 'maintenance'
  needsAssistance: 'boolean',
  isRemoteControlled: 'boolean',
  controlledBy: 'string', // Cashier ID
  currentTransaction: {
    id: 'string',
    items: [{
      id: 'string',
      name: 'string',
      price: 'number',
      quantity: 'number'
    }],
    total: 'number',
    startTime: 'timestamp',
    discounts: [{
      id: 'string',
      amount: 'number',
      type: 'string'
    }]
  },
  assistanceRequestTime: 'timestamp',
  lastMaintenanceCheck: 'timestamp',
  transactionCount: 'number',
  metrics: {
    averageTransactionTime: 'number',
    successRate: 'number',
    alertRate: 'number'
  }
};

// Self-checkout logs schema
export const selfCheckoutLogSchema = {
  id: 'string',
  type: 'string', // 'action', 'alert', 'transaction'
  action: 'string', // 'add_item', 'remove_item', 'complete_transaction', etc.
  stationId: 'string',
  itemId: 'string',
  timestamp: 'timestamp',
  value: 'number',
  severity: 'string', // 'low', 'medium', 'high' (for alerts)
  message: 'string',
  userId: 'string', // Customer or cashier ID
  transactionId: 'string'
}; 