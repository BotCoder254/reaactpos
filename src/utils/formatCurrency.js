/**
 * Formats a number as currency using the browser's locale settings
 * @param {number} amount - The amount to format
 * @param {string} [currencyCode='USD'] - The ISO 4217 currency code
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}; 