import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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
import VerifyEmail from './pages/VerifyEmail';
import CheckEmail from './pages/CheckEmail';
import Integrations from './pages/Integrations';
import Marketplace from './pages/Marketplace';
import MobileApp from './pages/MobileApp';
import Diferenciais from './pages/Diferenciais';
import Admin from './pages/Admin';
import AdminAccountants from './pages/AdminAccountants';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Footer from './components/Footer';
import WhatsAppWidget from './components/WhatsAppWidget';
import CookieConsent from './components/CookieConsent';

import AccountantDashboard from './pages/AccountantDashboard';
import InvoiceTemplate from './components/InvoiceTemplate';
import Help from './pages/Help';

const PrivateRoute = ({ children }) => {
  try {
    const user = getUser();
    const token = getToken();
    
    if (!user || !token || !user.id) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    console.error('Auth Error:', error);
    return <Navigate to="/login" replace />;
  }
};

const AdminRoute = ({ children }) => {
  try {
    const user = getUser();
    const token = getToken();
    
    if (!user || !token) {
      return <Navigate to="/login" replace />;
    }

    return user.isAdmin ? children : <Navigate to="/dashboard" replace />;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

const AccountantRoute = ({ children }) => {
  try {
    const user = getUser();
    const token = getToken();
    
    if (!user || !token) {
      return <Navigate to="/login" replace />;
    }

    // Check isAccountant flag OR isAdmin (admins can access accountant area)
    return (user.isAccountant || user.isAdmin) ? children : <Navigate to="/dashboard" replace />;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

import ErrorBoundary from './components/ErrorBoundary';
import { getToken, getUser, isAuthenticated } from './utils/storage';

// Component para rastrear mudanças de rota - DESABILITADO (GA4 via HTML)
function RouteTracker() {
  return null;
}

function App() {
  // GA4 está carregado diretamente no HTML, não precisa inicializar via JS

  return (
    <Router>
      <RouteTracker />
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white transition-colors">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          
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
                      <Route path="/invoices/:id" element={<InvoiceTemplate />} />
                      <Route path="/plans" element={<Plans />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/integrations" element={<Integrations />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/accountant-dashboard" element={
                        <AccountantRoute>
                          <AccountantDashboard />
                        </AccountantRoute>
                      } />
                      <Route path="/mobile-app" element={<MobileApp />} />
                      <Route path="/diferenciais" element={<Diferenciais />} />
                      <Route path="/admin" element={
                        <AdminRoute>
                          <Admin />
                        </AdminRoute>
                      } />
                      <Route path="/admin/accountants" element={
                        <AdminRoute>
                          <AdminAccountants />
                        </AdminRoute>
                      } />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/help" element={<Help />} />
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
        
        {/* Cookie Consent Banner */}
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;
