import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage,
  FiAlertTriangle,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiFilter,
  FiSearch,
  FiX,
  FiBox,
  FiDollarSign,
  FiTrendingUp
} from 'react-icons/fi';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductModal from './ProductModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function InventoryDashboard() {
  const {
    products,
    lowStockProducts,
    loading,
    error,
    deleteProduct
  } = useInventory();
  const { userRole } = useAuth();

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    stockStatus: ''
  });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    if (!products) return;

    // Extract unique categories and suppliers
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    const uniqueSuppliers = [...new Set(products.map(p => p.supplier))];
    setCategories(uniqueCategories);
    setSuppliers(uniqueSuppliers);

    // Apply filters and search
    let filtered = [...products];

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.supplier) {
      filtered = filtered.filter(p => p.supplier === filters.supplier);
    }

    if (filters.stockStatus) {
      switch (filters.stockStatus) {
        case 'low':
          filtered = filtered.filter(p => p.stock <= p.minStockThreshold);
          break;
        case 'out':
          filtered = filtered.filter(p => p.stock === 0);
          break;
        case 'available':
          filtered = filtered.filter(p => p.stock > 0);
          break;
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, filters, searchTerm]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      await deleteProduct(product.id, product.name);
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const stockStatus = products.reduce((acc, product) => {
    if (product.stock === 0) acc.outOfStock++;
    else if (product.stock <= product.minStockThreshold) acc.lowStock++;
    else acc.inStock++;
    return acc;
  }, { inStock: 0, lowStock: 0, outOfStock: 0 });

  const categoryData = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value
  }));

  const stockValueByCategory = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + (product.price * product.stock);
    return acc;
  }, {});

  const barData = Object.entries(stockValueByCategory).map(([category, value]) => ({
    category,
    value
  }));

  const monthlyTrends = Array.from({ length: 6 }, (_, i) => ({
    month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short' }),
    stock: Math.floor(Math.random() * 1000),
    value: Math.floor(Math.random() * 50000)
  })).reverse();

  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  const averageStock = products.reduce((sum, product) => sum + product.stock, 0) / products.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiBox className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-xl font-semibold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiAlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-xl font-semibold text-gray-900">{stockStatus.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FiTrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Stock</p>
              <p className="text-xl font-semibold text-gray-900">{Math.round(averageStock)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Value by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="stock" stroke="#8884d8" name="Total Stock" />
                <Line yAxisId="right" type="monotone" dataKey="value" stroke="#82ca9d" name="Stock Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredProducts.map(product => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      src={typeof product.images[0] === 'string' 
                        ? product.images[0] 
                        : product.images[0].url || product.images[0].thumb}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-md mb-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    {product.images[0].photographer && (
                      <div className="absolute bottom-2 left-2">
                        <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
                          Photo by {product.images[0].photographer}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-md mb-2">
                    <FiPackage className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {product.stock <= product.minStockThreshold && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    Low Stock
                  </div>
                )}
              </div>
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">
                  Stock: {product.stock}
                </span>
                <div className="flex space-x-2">
                  {userRole === 'manager' && (
                    <>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1 text-gray-600 hover:text-primary-600 rounded"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-1 text-gray-600 hover:text-red-600 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </motion.div>
  );
}