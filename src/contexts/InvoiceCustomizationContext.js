import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { generateQRCode } from '../utils/qrCodeUtils';

const InvoiceCustomizationContext = createContext();

export function useInvoiceCustomization() {
  return useContext(InvoiceCustomizationContext);
}

const defaultSettings = {
  logo: '',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  headerMessage: 'Thank you for your business!',
  footerMessage: 'Please visit us again!',
  additionalFields: [],
  templates: [
    {
      id: 'default',
      name: 'Default Template',
      description: 'Standard invoice layout with company branding'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and simple design with essential information'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Detailed layout with comprehensive business information'
    }
  ],
  defaultTemplate: 'default',
  customerNoteEnabled: true,
  paymentTerms: '',
  promotionalContent: '',
  taxSettings: {
    showTaxDetails: true,
    taxBreakdown: true
  },
  showDiscountDetails: true,
  showLoyaltyPoints: true,
  digitalSignatureEnabled: false,
  qrCodeEnabled: true,
  customFields: {
    orderNumber: true,
    customerReference: true,
    salesPerson: true
  },
  digitalReceipts: {
    enabled: true,
    defaultToPaperless: true,
    allowCustomerRating: true,
    sendEmailCopy: true,
    qrCodePosition: 'bottom', // 'top', 'bottom', 'none'
    showSocialShare: true,
    customerFeedbackEnabled: true,
    retentionDays: 365, // How long to keep digital receipts
    automaticRefundLookup: true // Use QR code for refund lookups
  }
};

export const InvoiceCustomizationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadSettings();
      loadCompanyInfo();
      loadRecentSales();
      loadSalesHistory();
    }
  }, [currentUser]);

  const loadCompanyInfo = async () => {
    try {
      const companyRef = doc(db, 'companyInfo', currentUser.uid);
      const docSnap = await getDoc(companyRef);
      
      if (docSnap.exists()) {
        setCompanyInfo(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const loadRecentSales = async () => {
    try {
      const salesRef = collection(db, 'sales');
      const q = query(
        salesRef,
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const sales = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(sale => sale.status === 'completed');
      
      setRecentSales(sales.slice(0, 10));
    } catch (error) {
      console.error('Error loading recent sales:', error);
    }
  };

  const loadSalesHistory = async () => {
    try {
      const salesRef = collection(db, 'sales');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const q = query(
        salesRef,
        orderBy('timestamp', 'desc'),
        limit(500)
      );
      
      const querySnapshot = await getDocs(q);
      const sales = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(sale => 
          sale.status === 'completed' && 
          sale.timestamp?.toDate() >= thirtyDaysAgo
        );
      
      setSalesHistory(sales);
    } catch (error) {
      console.error('Error loading sales history:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'invoiceSettings', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({ ...defaultSettings, ...data });
      } else {
        await setDoc(docRef, {
          ...defaultSettings,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid
        });
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading invoice settings:', error);
      toast.error('Failed to load invoice settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      setLoading(true);
      const docRef = doc(db, 'invoiceSettings', currentUser.uid);
      await setDoc(docRef, {
        ...newSettings,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      }, { merge: true });
      
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }));
      
      toast.success('Invoice settings updated successfully');
    } catch (error) {
      console.error('Error updating invoice settings:', error);
      toast.error('Failed to update invoice settings');
    } finally {
      setLoading(false);
    }
  };

  const addTemplate = async (template) => {
    try {
      const newTemplates = [...settings.templates, { id: Date.now().toString(), ...template }];
      await updateSettings({ templates: newTemplates });
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Failed to add template');
    }
  };

  const removeTemplate = async (templateId) => {
    try {
      const newTemplates = settings.templates.filter(t => t.id !== templateId);
      await updateSettings({ templates: newTemplates });
    } catch (error) {
      console.error('Error removing template:', error);
      toast.error('Failed to remove template');
    }
  };

  const generateInvoice = async (saleId) => {
    try {
      const saleRef = doc(db, 'sales', saleId);
      const saleDoc = await getDoc(saleRef);
      
      if (!saleDoc.exists()) {
        throw new Error('Sale not found');
      }

      const sale = saleDoc.data();
      const customer = sale.customer;
      const items = sale.items;
      
      // Generate QR code if enabled
      let qrCodeUrl = null;
      if (settings.qrCodeEnabled) {
        try {
          const receiptUrl = `${window.location.origin}/receipt/${saleId}`;
          qrCodeUrl = await generateQRCode(receiptUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
          // Continue without QR code if generation fails
        }
      }
      
      return {
        ...sale,
        customer,
        items,
        settings,
        companyInfo,
        qrCodeUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  };

  const value = {
    settings,
    loading,
    companyInfo,
    recentSales,
    salesHistory,
    updateSettings,
    addTemplate,
    removeTemplate,
    generateInvoice,
    refreshSales: loadRecentSales
  };

  return (
    <InvoiceCustomizationContext.Provider value={value}>
      {children}
    </InvoiceCustomizationContext.Provider>
  );
};