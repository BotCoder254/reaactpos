import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const InvoiceCustomizationContext = createContext();

export function useInvoiceCustomization() {
  return useContext(InvoiceCustomizationContext);
}

const defaultSettings = {
  logo: '',
  primaryColor: '#2563eb',
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
  customerNoteEnabled: true
};

export const InvoiceCustomizationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser]);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'invoiceSettings', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Initialize with default settings if none exist
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

  const value = {
    settings,
    loading,
    updateSettings,
    addTemplate,
    removeTemplate
  };

  return (
    <InvoiceCustomizationContext.Provider value={value}>
      {children}
    </InvoiceCustomizationContext.Provider>
  );
};