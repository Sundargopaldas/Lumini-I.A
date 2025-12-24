import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/register'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <div className={showNavbar ? "container mx-auto px-4 py-8" : ""}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
