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
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function AppContent() {
  const location = useLocation();
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
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="/staff" element={<PrivateRoute><Staff /></PrivateRoute>} />
              <Route path="/discounts" element={<PrivateRoute><Discounts /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
