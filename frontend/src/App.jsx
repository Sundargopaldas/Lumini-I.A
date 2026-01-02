import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Plans from './pages/Plans';
import Checkout from './pages/Checkout';
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Integrations from './pages/Integrations';
import Marketplace from './pages/Marketplace';
import MobileApp from './pages/MobileApp';
import Diferenciais from './pages/Diferenciais';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Footer from './components/Footer';
import WhatsAppWidget from './components/WhatsAppWidget';

import AccountantDashboard from './pages/AccountantDashboard';

const PrivateRoute = ({ children }) => {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token || userStr === 'undefined') {
      return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);
    return user && user.id && token ? children : <Navigate to="/login" replace />;
  } catch (error) {
    console.error('Auth Error:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

const AdminRoute = ({ children }) => {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token || userStr === 'undefined') {
      return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);
    return user && user.isAdmin ? children : <Navigate to="/dashboard" replace />;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white transition-colors">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route path="/*" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/plans" element={<Plans />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/integrations" element={<Integrations />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/accountant-dashboard" element={<AccountantDashboard />} />
                      <Route path="/mobile-app" element={<MobileApp />} />
                      <Route path="/diferenciais" element={<Diferenciais />} />
                      <Route path="/admin" element={
                        <AdminRoute>
                          <Admin />
                        </AdminRoute>
                      } />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/terms" element={<Terms />} />
                    </Routes>
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                    <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
