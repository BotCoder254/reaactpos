import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiDownload,
  FiFilter,
  FiPrinter,
  FiMail,
  FiFileText,
  FiEye,
  FiHash,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useInvoiceCustomization } from '../contexts/InvoiceCustomizationContext';
import { exportSales, emailReceipt } from '../utils/salesQueries';
import { getReceiptBranding, generateReceiptHTML } from '../utils/receiptQueries';
import InvoicePreview from '../components/invoices/InvoicePreview';
import { format } from 'date-fns';
import { formatCurrency, formatDate } from '../utils/formatters';
import { sendDigitalReceipt } from '../utils/digitalReceiptQueries';
import toast from 'react-hot-toast';
import { generateQRCode } from '../utils/qrCodeUtils';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [filterCashier, setFilterCashier] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [receiptBranding, setReceiptBranding] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { userRole } = useAuth();
  const { settings, companyInfo } = useInvoiceCustomization();
  const [currentSettings, setCurrentSettings] = useState(null);
  const [currentCompanyInfo, setCurrentCompanyInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch sales with a simple orderBy query
        const salesCollection = collection(db, 'sales');
        const salesQuery = query(
          salesCollection,
          orderBy('timestamp', 'desc'),
          limit(100)
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const salesList = salesSnapshot.docs
          .map(doc => {
            const data = doc.data();
            // Ensure proper number handling for all numerical values
            const total = typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0;
            const subtotal = typeof data.subtotal === 'number' ? data.subtotal : parseFloat(data.subtotal) || 0;
            const tax = typeof data.tax === 'number' ? data.tax : parseFloat(data.tax) || 0;
            
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate() || new Date(),
              total,
              subtotal,
              tax,
              amount: total,
              formattedTotal: formatCurrency(total),
              items: Array.isArray(data.items) ? data.items.map(item => ({
                ...item,
                price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
                quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0,
                total: typeof item.price === 'number' ? 
                  item.price * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0) :
                  parseFloat(item.price) * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0) || 0
              })) : []
            };
          })
          .filter(sale => sale.status === 'completed');

        setSales(salesList);

        // Load invoice settings from localStorage
        const savedSettings = localStorage.getItem('invoiceSettings');
        const savedCompanyInfo = localStorage.getItem('companyData');
        
        if (savedSettings) {
          setCurrentSettings(JSON.parse(savedSettings));
        } else {
          setCurrentSettings(settings);
        }
        
        if (savedCompanyInfo) {
          setCurrentCompanyInfo(JSON.parse(savedCompanyInfo));
        } else {
          setCurrentCompanyInfo(companyInfo);
        }

        // Fetch receipt branding
        const branding = await getReceiptBranding();
        setReceiptBranding(branding);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [settings, companyInfo]);

  // Update settings when they change
  useEffect(() => {
    if (settings) {
      setCurrentSettings(settings);
    }
  }, [settings]);

  // Update company info when it changes
  useEffect(() => {
    if (companyInfo) {
      setCurrentCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  const handleExport = async () => {
    try {
      await exportSales(sales);
      alert('Sales data exported successfully!');
    } catch (error) {
      console.error('Error exporting sales:', error);
      alert('Failed to export sales data');
    }
  };

  const handlePrintReceipt = (sale) => {
    if (!receiptBranding) return;

    const receiptHTML = generateReceiptHTML(receiptBranding, {
      ...sale,
      items: sale.items || [],
      customerName: sale.customerName || 'Walk-in Customer',
      timestamp: new Date(sale.timestamp)
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmailReceipt = async (sale, email) => {
    try {
      await sendDigitalReceipt(sale.id, email);
      toast.success('Digital receipt sent successfully');
    } catch (error) {
      console.error('Error sending digital receipt:', error);
      toast.error('Failed to send digital receipt');
    }
  };

  const handleViewInvoice = (sale) => {
    setSelectedSale({
      ...sale,
      customer: {
        name: sale.customerName || 'Walk-in Customer',
        email: sale.customerEmail || '',
        phone: sale.customerPhone || ''
      }
    });
    setShowPreview(true);
  };

  const handlePrintInvoice = () => {
    const printContent = document.getElementById('invoice-preview');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadInvoice = () => {
    try {
      const printContent = document.getElementById('invoice-preview');
      if (!printContent) return;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Download Invoice</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                body { margin: 0; padding: 20px; }
                @page { size: auto; margin: 20px; }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success('Invoice prepared for download');
    } catch (error) {
      console.error('Error preparing invoice:', error);
      toast.error('Failed to prepare invoice');
    }
  };

  const handleEmailInvoice = () => {
    const email = prompt('Enter email address:');
    if (email) {
      // Implementation for emailing invoice
      console.log('Email invoice to:', email);
    }
  };

  const handleGenerateQR = async (sale) => {
    try {
      const qrData = `${window.location.origin}/receipt/${sale.id}`;
      const qrCode = await generateQRCode(qrData);
      setQrCodeUrl(qrCode);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Sales History</h1>
          <div className="flex space-x-2">
            {userRole === 'manager' && (
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiDownload className="mr-2 -ml-1 h-5 w-5" />
                Export Data
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.receiptNumber || sale.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(sale.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.customerName || 'Walk-in Customer'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewInvoice(sale)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(sale)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <FiPrinter className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEmailReceipt(sale, sale.customerEmail || '')}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <FiMail className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleGenerateQR(sale)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Generate QR Code"
                      >
                        <FiHash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && selectedSale && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-[70]"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div id="invoice-preview">
                  <InvoicePreview
                    settings={currentSettings}
                    companyInfo={currentCompanyInfo}
                    sale={selectedSale}
                    onClose={() => setShowPreview(false)}
                    onPrint={handlePrintInvoice}
                    onDownload={handleDownloadInvoice}
                    onEmail={handleEmailInvoice}
                  />
                </div>
                
                <div className="mt-5 sm:mt-4 flex justify-end space-x-3">
                  <button
                    onClick={handlePrintInvoice}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiPrinter className="mr-2 h-4 w-4" />
                    Print
                  </button>
                  <button
                    onClick={handleDownloadInvoice}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <FiDownload className="mr-2 h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleEmailInvoice}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiMail className="mr-2 h-4 w-4" />
                    Email
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-[70]"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowQRCode(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Receipt QR Code
                  </h3>
                  <div className="mt-4 flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <img src={qrCodeUrl} alt="Receipt QR Code" className="w-64 h-64" />
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 flex justify-center">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qrCodeUrl;
                        link.download = 'receipt-qr.png';
                        link.click();
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <FiDownload className="mr-2 h-4 w-4" />
                      Download QR Code
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
} 