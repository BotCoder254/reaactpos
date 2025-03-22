import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { logActivity } from './activityLog';

export const getReceiptBranding = async () => {
  try {
    const brandingRef = doc(db, 'settings', 'receiptBranding');
    const docSnap = await getDoc(brandingRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default branding if not set
      const defaultBranding = {
        logo: '',
        businessName: 'Your Business Name',
        slogan: 'Thank you for shopping with us!',
        address: '',
        phone: '',
        email: '',
        website: '',
        footerText: 'Please come again!',
        showLogo: true,
        showSlogan: true,
        showContact: true,
        fontSize: 'normal',
        theme: 'classic'
      };

      await setDoc(brandingRef, defaultBranding);
      return defaultBranding;
    }
  } catch (error) {
    console.error('Error getting receipt branding:', error);
    throw error;
  }
};

export const updateReceiptBranding = async (brandingData) => {
  try {
    const brandingRef = doc(db, 'settings', 'receiptBranding');
    await updateDoc(brandingRef, brandingData);

    await logActivity({
      type: 'receipt_branding_updated',
      details: 'Updated receipt branding settings',
      metadata: {
        updatedFields: Object.keys(brandingData)
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating receipt branding:', error);
    throw error;
  }
};

export const generateReceiptHTML = (branding, saleData) => {
  const {
    logo,
    businessName,
    slogan,
    address,
    phone,
    email,
    website,
    footerText,
    showLogo,
    showSlogan,
    showContact,
    fontSize,
    theme
  } = branding;

  const fontSizeClass = {
    small: 'text-sm',
    normal: 'text-base',
    large: 'text-lg'
  }[fontSize] || 'text-base';

  const themeClass = {
    classic: 'bg-white',
    modern: 'bg-gray-50',
    minimal: 'bg-white'
  }[theme] || 'bg-white';

  return `
    <div class="receipt ${themeClass} p-4 max-w-sm mx-auto">
      ${showLogo && logo ? `
        <div class="text-center mb-4">
          <img src="${logo}" alt="${businessName}" class="h-16 mx-auto"/>
        </div>
      ` : ''}
      
      <div class="text-center mb-4">
        <h1 class="text-xl font-bold">${businessName}</h1>
        ${showSlogan && slogan ? `<p class="text-gray-600">${slogan}</p>` : ''}
      </div>

      ${showContact ? `
        <div class="text-center mb-4 ${fontSizeClass}">
          ${address ? `<p>${address}</p>` : ''}
          ${phone ? `<p>Tel: ${phone}</p>` : ''}
          ${email ? `<p>${email}</p>` : ''}
          ${website ? `<p>${website}</p>` : ''}
        </div>
      ` : ''}

      <div class="border-t border-b border-gray-200 py-4 my-4 ${fontSizeClass}">
        <div class="flex justify-between mb-2">
          <span>Date:</span>
          <span>${new Date(saleData.timestamp).toLocaleString()}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span>Receipt #:</span>
          <span>${saleData.id}</span>
        </div>
        <div class="flex justify-between">
          <span>Cashier:</span>
          <span>${saleData.cashierName}</span>
        </div>
      </div>

      <div class="mb-4 ${fontSizeClass}">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">Item</th>
              <th class="text-right py-2">Qty</th>
              <th class="text-right py-2">Price</th>
              <th class="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            ${saleData.items.map(item => `
              <tr>
                <td class="py-1">${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="border-t border-gray-200 pt-4 ${fontSizeClass}">
        <div class="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>$${saleData.subtotal.toFixed(2)}</span>
        </div>
        ${saleData.discount ? `
          <div class="flex justify-between mb-2">
            <span>Discount:</span>
            <span>-$${saleData.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="flex justify-between mb-2">
          <span>Tax:</span>
          <span>$${saleData.tax.toFixed(2)}</span>
        </div>
        <div class="flex justify-between font-bold">
          <span>Total:</span>
          <span>$${saleData.total.toFixed(2)}</span>
        </div>
      </div>

      <div class="text-center mt-6 ${fontSizeClass}">
        <p class="text-gray-600">${footerText}</p>
      </div>
    </div>
  `;
}; 