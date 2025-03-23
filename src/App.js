import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Staff from './pages/Staff';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import Discounts from './pages/Discounts';
import DiscountBanner from './components/discounts/DiscountBanner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SalesGoalsProvider } from './contexts/SalesGoalsContext';
import { HeldTransactionsProvider } from './contexts/HeldTransactionsContext';
import { RefundProvider } from './contexts/RefundContext';
import { LoyaltyProvider } from './contexts/LoyaltyContext';
import { InventoryProvider } from './contexts/InventoryContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import EmployeeStats from './pages/EmployeeStats';
import StaffStats from './pages/StaffStats';
import SalesGoals from './pages/SalesGoals';
import Marketing from './pages/Marketing';
import ExpenseManager from './pages/ExpenseManager';
import ProfitLossStatement from './components/analytics/ProfitLossStatement';
import RefundManager from './components/refunds/RefundManager';
import RefundRequest from './components/refunds/RefundRequest';
import LoyaltyDashboard from './components/loyalty/LoyaltyDashboard';
import Inventory from './pages/Inventory';
import StockManagement from './pages/StockManagement';
import LowStockAlerts from './pages/LowStockAlerts';
import InventoryDashboard from './components/inventory/InventoryDashboard';

function AppContent() {
  const location = useLocation();
  const { userRole } = useAuth();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100">
      {!isAuthPage && <Sidebar />}
      <div className={`flex-1 overflow-auto ${isAuthPage ? 'w-full' : ''}`}>
        <Toaster position="top-right" />
        {!isAuthPage && <DiscountBanner />}
        <main className={`${isAuthPage ? '' : 'py-10'}`}>
          <div className={`${isAuthPage ? '' : 'max-w-7xl mx-auto sm:px-6 lg:px-8'}`}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
              <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
              <Route path="/inventory/dashboard" element={<PrivateRoute><InventoryDashboard /></PrivateRoute>} />
              {userRole === 'manager' && (
                <>
                  <Route path="/inventory/stock" element={<PrivateRoute><StockManagement /></PrivateRoute>} />
                  <Route path="/inventory/alerts" element={<PrivateRoute><LowStockAlerts /></PrivateRoute>} />
                </>
              )}
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
              <Route path="/sales-goals" element={<PrivateRoute><SalesGoals /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="/staff" element={<PrivateRoute><Staff /></PrivateRoute>} />
              <Route path="/staff-stats" element={<PrivateRoute><StaffStats /></PrivateRoute>} />
              <Route path="/discounts" element={<PrivateRoute><Discounts /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/employee-stats" element={<PrivateRoute><EmployeeStats /></PrivateRoute>} />
              <Route path="/marketing" element={<PrivateRoute><Marketing /></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute><ExpenseManager /></PrivateRoute>} />
              <Route path="/profit-loss" element={<PrivateRoute><ProfitLossStatement /></PrivateRoute>} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/loyalty" element={<PrivateRoute><LoyaltyDashboard /></PrivateRoute>} />
              <Route 
                path="/refunds" 
                element={
                  <PrivateRoute>
                    <RefundProvider>
                      <RefundRouteComponent />
                    </RefundProvider>
                  </PrivateRoute>
                } 
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function RefundRouteComponent() {
  const { userRole } = useAuth();
  return userRole === 'manager' ? <RefundManager /> : <RefundRequest />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SalesGoalsProvider>
          <HeldTransactionsProvider>
            <RefundProvider>
              <LoyaltyProvider>
                <InventoryProvider>
                  <AppContent />
                </InventoryProvider>
              </LoyaltyProvider>
            </RefundProvider>
          </HeldTransactionsProvider>
        </SalesGoalsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
