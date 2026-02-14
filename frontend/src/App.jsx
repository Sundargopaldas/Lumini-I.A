import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Plans from './pages/Plans';
import Checkout from './pages/Checkout';
import Invoices from './pages/Invoices';
import MeusDocumentos from './pages/MeusDocumentos';
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
import ModernCalendar from './pages/ModernCalendar';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Footer from './components/Footer';
import WhatsAppWidget from './components/WhatsAppWidget';
import CookieConsent from './components/CookieConsent';

import AccountantDashboard from './pages/AccountantDashboard';
import InvoiceTemplate from './components/InvoiceTemplate';
import Help from './pages/Help';
import Guide from './pages/Guide';

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
// import { OnboardingProvider } from './contexts/OnboardingContext';
// import WelcomeModal from './components/WelcomeModal';
// import OnboardingTour from './components/OnboardingTour';
// import HelpButton from './components/HelpButton';

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
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          
          {/* Rotas protegidas - TODAS explícitas */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Dashboard />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/meus-documentos" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <MeusDocumentos />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/transactions" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Transactions />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/reports" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Reports />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/calendar" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <ModernCalendar />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/invoices" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Invoices />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/invoices/:id" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <InvoiceTemplate />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/plans" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Plans />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/checkout" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Checkout />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/integrations" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Integrations />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/marketplace" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Marketplace />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/accountant-dashboard" element={
            <AccountantRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <AccountantDashboard />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </AccountantRoute>
          } />
          
          <Route path="/mobile-app" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <MobileApp />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/diferenciais" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Diferenciais />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/admin" element={
            <AdminRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Admin />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </AdminRoute>
          } />
          
          <Route path="/admin/accountants" element={
            <AdminRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <AdminAccountants />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </AdminRoute>
          } />
          
          <Route path="/settings" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Settings />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/terms" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Terms />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/privacy" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Privacy />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/help" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Help />
                </div>
                <Footer />
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                  <div className="pointer-events-auto"><WhatsAppWidget /></div>
                </div>
              </ErrorBoundary>
            </PrivateRoute>
          } />
          
          <Route path="/guide" element={
            <PrivateRoute>
              <ErrorBoundary>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                  <Guide />
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
