import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import { ShiftProvider } from './contexts/ShiftContext';
import { RoleProvider, useRole } from './contexts/RoleContext';
import RoleSwitcher from './components/roles/RoleSwitcher';
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
import ShiftManagement from './pages/ShiftManagement';
import RoleRequests from './components/roles/RoleRequests';

function AppContent() {
  const location = useLocation();
  const { userRole } = useAuth();
  const { effectiveRole, baseRole } = useRole();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  
  // Use effectiveRole for route protection, but keep track of base role
  const currentRole = effectiveRole || userRole;

  // Function to check if user has access to a route
  const hasAccess = (requiredRole) => {
    if (!requiredRole) return true;
    if (requiredRole === 'manager') {
      return currentRole === 'manager';
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthPage && <Sidebar />}
      <div className={!isAuthPage ? "md:pl-64 flex flex-col min-h-screen" : ""}>
        {!isAuthPage && <DiscountBanner />}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/analytics" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <Analytics /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/reports" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <Reports /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/employee-stats" element={<PrivateRoute><EmployeeStats /></PrivateRoute>} />
              <Route path="/staff-stats" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <StaffStats /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/sales-goals" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <SalesGoals /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/marketing" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <Marketing /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/expenses" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <ExpenseManager /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/profit-loss" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <ProfitLossStatement /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/refunds" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <RefundManager /> : <RefundRequest />}
                </PrivateRoute>
              } />
              <Route path="/loyalty" element={<PrivateRoute><LoyaltyDashboard /></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
              <Route path="/stock" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <StockManagement /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/low-stock" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <LowStockAlerts /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
              <Route path="/staff" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <Staff /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
              <Route path="/discounts" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <Discounts /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/inventory-dashboard" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <InventoryDashboard /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/shift-management" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <ShiftManagement /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
              <Route path="/role-requests" element={
                <PrivateRoute>
                  {hasAccess('manager') ? <RoleRequests /> : <Navigate to="/" replace />}
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
      {!isAuthPage && <RoleSwitcher />}
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RoleProvider>
          <SalesGoalsProvider>
            <HeldTransactionsProvider>
              <RefundProvider>
                <LoyaltyProvider>
                  <InventoryProvider>
                    <ShiftProvider>
                      <AppContent />
                    </ShiftProvider>
                  </InventoryProvider>
                </LoyaltyProvider>
              </RefundProvider>
            </HeldTransactionsProvider>
          </SalesGoalsProvider>
        </RoleProvider>
      </AuthProvider>
    </Router>
  );
}
