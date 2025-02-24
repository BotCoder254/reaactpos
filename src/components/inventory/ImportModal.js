import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload, FiDownload } from 'react-icons/fi';
import { importProductsFromCSV, getProducts } from '../../utils/inventoryQueries';
import Papa from 'papaparse';

export default function ImportModal({ isOpen, onClose, onRefetch }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError('');

      const result = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: resolve,
          error: reject,
        });
      });

      await importProductsFromCSV(result.data);
      onRefetch();
      onClose();
    } catch (error) {
      console.error('Error importing products:', error);
      setError('Failed to import products. Please check your CSV format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const products = await getProducts();
      const csv = Papa.unparse(
        products.map((product) => ({
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          description: product.description,
        }))
      );

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting products:', error);
      setError('Failed to export products');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
        >
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Import/Export Products
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import from CSV
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex-1">
                    <div className="relative border border-gray-300 rounded-md px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-primary-600 focus-within:border-primary-600 cursor-pointer hover:bg-gray-50">
                      <span className="inline-block w-full text-sm text-gray-500 truncate">
                        {file ? file.name : 'Choose CSV file'}
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!file || isUploading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <FiUpload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Export to CSV
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p className="font-medium mb-2">CSV Format:</p>
                <p>name, category, price, stock, description</p>
                <p className="mt-2">
                  Note: Images cannot be imported via CSV. Please add them manually.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}