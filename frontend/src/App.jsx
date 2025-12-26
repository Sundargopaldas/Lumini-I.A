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
import Integrations from './pages/Integrations';

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  // Check for both user object and token
  return (user && token) ? children : <Navigate to="/login" replace />;
};

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/*" element={
            <PrivateRoute>
              <Navbar />
              <div className="container mx-auto px-4 py-8">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/integrations" element={<Integrations />} />
                  </Routes>
                </ErrorBoundary>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
