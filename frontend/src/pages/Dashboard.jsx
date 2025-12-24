import Chart from '../components/Chart';
import TransactionCard from '../components/TransactionCard';

const Dashboard = () => {
  const recentTransactions = [
    { id: 1, description: 'Grocery Store', amount: -120.50, date: '2023-12-24', type: 'expense' },
    { id: 2, description: 'Salary', amount: 3000.00, date: '2023-12-23', type: 'income' },
    { id: 3, description: 'Electric Bill', amount: -150.00, date: '2023-12-22', type: 'expense' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Balance</h3>
          <p className="text-3xl font-bold text-gray-900">$12,450.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Income (Monthly)</h3>
          <p className="text-3xl font-bold text-green-600">+$4,200.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Expenses (Monthly)</h3>
          <p className="text-3xl font-bold text-red-600">-$2,150.00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <Chart />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
