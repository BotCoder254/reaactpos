export const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

export const calculateTotalWithTax = (subtotal, taxRate = 0.1) => {
  const tax = subtotal * taxRate;
  return {
    subtotal,
    tax,
    total: subtotal + tax
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const validateCartItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }

  return items.every(item => (
    item &&
    typeof item.id === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  ));
};

export const groupCartItems = (items) => {
  return items.reduce((grouped, item) => {
    const existingItem = grouped.find(g => g.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      grouped.push({ ...item });
    }
    return grouped;
  }, []);
};

export const clearCart = () => {
  localStorage.removeItem('cart');
  return true;
};