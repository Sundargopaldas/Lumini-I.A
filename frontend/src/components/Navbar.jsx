import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center text-xl font-bold text-blue-600">
              Lumini I.A
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/dashboard" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Dashboard
              </Link>
              <Link to="/transactions" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Transactions
              </Link>
              <Link to="/reports" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Reports
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link to="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              Login
            </Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
