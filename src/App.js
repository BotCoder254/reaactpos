import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
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
import { FraudDetectionProvider } from './contexts/FraudDetectionContext';
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
import FraudMonitoring from './components/fraud/FraudMonitoring';
import Shifts from './pages/Shifts';
import { InvoiceCustomizationProvider } from './contexts/InvoiceCustomizationContext';
import InvoiceCustomizer from './components/invoices/InvoiceCustomizer';
import CashierInvoiceOptions from './components/invoices/CashierInvoiceOptions';
import InvoicePreview from './components/invoices/InvoicePreview';
import SelfCheckoutMode from './components/checkout/SelfCheckoutMode';
import SelfCheckoutMonitor from './components/checkout/SelfCheckoutMonitor';
import RemoteAssistance from './components/checkout/RemoteAssistance';

// Import Shift Management Components
import ShiftCalendar from './components/shifts/ShiftCalendar';
import ShiftSchedule from './components/shifts/ShiftSchedule';
import AttendanceLog from './components/shifts/AttendanceLog';
import ShiftAnalytics from './components/shifts/ShiftAnalytics';
import ShiftBreaks from './components/shifts/ShiftBreaks';
import ShiftClock from './components/shifts/ShiftClock';
import ShiftNotifications from './components/shifts/ShiftNotifications';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { effectiveRole } = useRole();
  const { currentUser } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isSelfCheckout = location.pathname.startsWith('/self-checkout');

  // Remove the redirect for self-checkout routes
  if (!currentUser && !isAuthPage && !isSelfCheckout) {
    return <Navigate to="/login" replace />;
  }

  // Handle role-based redirects
  const handleRoleAccess = (Component, allowedRole) => {
    if (!allowedRole || effectiveRole === allowedRole) {
      return <Component />;
    }
    return <Navigate to="/" replace />;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthPage && !isSelfCheckout && <Sidebar />}
      <div className={!isAuthPage && !isSelfCheckout ? "md:pl-64 flex flex-col min-h-screen" : "flex flex-col min-h-screen"}>
        {!isAuthPage && !isSelfCheckout && <DiscountBanner />}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Self-checkout routes - No authentication required */}
              <Route path="/self-checkout" element={<SelfCheckoutMode />} />
              <Route path="/self-checkout/:stationId" element={<SelfCheckoutMode />} />
              
              {/* Protected routes */}
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/receipt/:id" element={<PrivateRoute><InvoicePreview /></PrivateRoute>} />
              
              {/* Manager-only routes */}
              <Route path="/analytics" element={
                <PrivateRoute>
                  {handleRoleAccess(Analytics, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/reports" element={
                <PrivateRoute>
                  {handleRoleAccess(Reports, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/staff-stats" element={
                <PrivateRoute>
                  {handleRoleAccess(StaffStats, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/sales-goals" element={
                <PrivateRoute>
                  {handleRoleAccess(SalesGoals, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/expenses" element={
                <PrivateRoute>
                  {handleRoleAccess(ExpenseManager, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/profit-loss" element={
                <PrivateRoute>
                  {handleRoleAccess(ProfitLossStatement, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/stock" element={
                <PrivateRoute>
                  {handleRoleAccess(StockManagement, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/low-stock" element={
                <PrivateRoute>
                  {handleRoleAccess(LowStockAlerts, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/inventory-dashboard" element={
                <PrivateRoute>
                  {handleRoleAccess(InventoryDashboard, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/staff" element={
                <PrivateRoute>
                  {handleRoleAccess(Staff, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/discounts" element={
                <PrivateRoute>
                  {handleRoleAccess(Discounts, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/role-requests" element={
                <PrivateRoute>
                  {handleRoleAccess(RoleRequests, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/fraud-monitoring" element={
                <PrivateRoute>
                  {handleRoleAccess(FraudMonitoring, 'manager')}
                </PrivateRoute>
              } />

              {/* Shared routes */}
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/employee-stats" element={<PrivateRoute><EmployeeStats /></PrivateRoute>} />
              <Route path="/marketing" element={<PrivateRoute><Marketing /></PrivateRoute>} />
              <Route path="/refunds" element={
                <PrivateRoute>
                  {effectiveRole === 'manager' ? <RefundManager /> : <RefundRequest />}
                </PrivateRoute>
              } />
              <Route path="/loyalty" element={<PrivateRoute><LoyaltyDashboard /></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
              <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />

              {/* Shift Management Routes */}
              <Route path="/shifts" element={<PrivateRoute><Shifts /></PrivateRoute>} />
              <Route path="/shifts/schedule" element={
                <PrivateRoute>
                  {handleRoleAccess(ShiftSchedule, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/shifts/calendar" element={<PrivateRoute><ShiftCalendar /></PrivateRoute>} />
              <Route path="/shifts/attendance" element={<PrivateRoute><AttendanceLog /></PrivateRoute>} />
              <Route path="/shifts/analytics" element={
                <PrivateRoute>
                  {handleRoleAccess(ShiftAnalytics, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/shifts/breaks" element={<PrivateRoute><ShiftBreaks /></PrivateRoute>} />
              <Route path="/shifts/clock" element={
                <PrivateRoute>
                  {handleRoleAccess(ShiftClock, 'cashier')}
                </PrivateRoute>
              } />
              <Route path="/shifts/notifications" element={<PrivateRoute><ShiftNotifications /></PrivateRoute>} />

              {/* Invoice Customization Routes */}
              <Route path="/invoice-settings" element={
                <PrivateRoute>
                  {handleRoleAccess(InvoiceCustomizer, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/invoice-options" element={
                <PrivateRoute>
                  <CashierInvoiceOptions 
                    onClose={() => navigate('/')} 
                    onApply={(options) => {
                      // Handle applying options
                      navigate('/');
                    }} 
                  />
                </PrivateRoute>
              } />

              {/* Self-checkout routes - No authentication required */}
              <Route path="/self-checkout" element={<SelfCheckoutMode />} />
              <Route path="/self-checkout/:stationId" element={<SelfCheckoutMode />} />
              <Route path="/monitor" element={
                <PrivateRoute>
                  {handleRoleAccess(SelfCheckoutMonitor, 'manager')}
                </PrivateRoute>
              } />
              <Route path="/remote-assistance" element={
                <PrivateRoute>
                  {handleRoleAccess(RemoteAssistance, 'cashier')}
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
      {!isAuthPage && !isSelfCheckout && <RoleSwitcher />}
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RoleProvider>
          <FraudDetectionProvider>
            <SalesGoalsProvider>
              <HeldTransactionsProvider>
                <RefundProvider>
                  <LoyaltyProvider>
                    <InventoryProvider>
                      <ShiftProvider>
                        <InvoiceCustomizationProvider>
                          <AppContent />
                        </InvoiceCustomizationProvider>
                      </ShiftProvider>
                    </InventoryProvider>
                  </LoyaltyProvider>
                </RefundProvider>
              </HeldTransactionsProvider>
            </SalesGoalsProvider>
          </FraudDetectionProvider>
        </RoleProvider>
      </AuthProvider>
    </Router>
  );
}
