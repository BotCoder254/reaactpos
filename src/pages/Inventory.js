import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUpload,
  FiDownload,
  FiFilter,
  FiSearch,
} from 'react-icons/fi';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import ProductModal from '../components/inventory/ProductModal';
import ProductCard from '../components/inventory/ProductCard';
import ImportModal from '../components/inventory/ImportModal';

export default function Inventory() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useInventory();
  const { userRole } = useAuth();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    stockStatus: '' // 'all', 'inStock', 'lowStock', 'outOfStock'
  });

  const categories = [...new Set(products.map(p => p.category))];
  const suppliers = [...new Set(products.map(p => p.supplier))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesSupplier = !filters.supplier || product.supplier === filters.supplier;
    const matchesStockStatus = !filters.stockStatus || (() => {
      switch (filters.stockStatus) {
        case 'inStock': return product.stock > product.minStockThreshold;
        case 'lowStock': return product.stock <= product.minStockThreshold && product.stock > 0;
        case 'outOfStock': return product.stock === 0;
        default: return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesSupplier && matchesStockStatus;
  });

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        {userRole === 'manager' && (
          <div className="flex space-x-4">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiUpload className="mr-2 -ml-1 h-5 w-5" />
              Import/Export
            </button>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              Add Product
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {userRole === 'manager' && (
            <>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option key="all-categories" value="">All Categories</option>
                {categories.filter(Boolean).map(category => (
                  <option key={`category-${category}`} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                className="border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option key="all-suppliers" value="">All Suppliers</option>
                {suppliers.filter(Boolean).map(supplier => (
                  <option key={`supplier-${supplier}`} value={supplier}>{supplier}</option>
                ))}
              </select>
              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                className="border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option key="all-stock" value="">All Stock Status</option>
                <option key="in-stock" value="inStock">In Stock</option>
                <option key="low-stock" value="lowStock">Low Stock</option>
                <option key="out-of-stock" value="outOfStock">Out of Stock</option>
              </select>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
            >
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={userRole === 'manager' ? () => handleEdit(product) : undefined}
              isManager={userRole === 'manager'}
            />
          ))}
        </motion.div>
      )}

      {userRole === 'manager' && (
        <>
          <ProductModal
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            product={selectedProduct}
          />
          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}