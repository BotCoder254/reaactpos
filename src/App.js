import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import DashboardLayout from './components/layout/DashboardLayout';

// Protected Route Component
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? (
    <DashboardLayout>{children}</DashboardLayout>
  ) : (
    <Navigate to="/login" />
  );
}

// Manager Route Component
function ManagerRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  return currentUser && userRole === 'manager' ? (
    <DashboardLayout>{children}</DashboardLayout>
  ) : (
    <Navigate to="/dashboard" />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <PrivateRoute>
                <POS />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <Sales />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <Customers />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ManagerRoute>
                <Inventory />
              </ManagerRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ManagerRoute>
                <Analytics />
              </ManagerRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ManagerRoute>
                <Staff />
              </ManagerRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ManagerRoute>
                <Reports />
              </ManagerRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
