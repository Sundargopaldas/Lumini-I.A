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
import Settings from './pages/Settings';

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

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white">
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
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
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
