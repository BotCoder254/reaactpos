/**
 * Formats a number as currency using the browser's locale settings
 * @param {number|string} amount - The amount to format
 * @param {string} [currencyCode='USD'] - The ISO 4217 currency code
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  // Handle invalid, null, or undefined values
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }

  // Convert to number and handle NaN
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numericAmount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
};