import TransactionCard from '../components/TransactionCard';

const Transactions = () => {
  const transactions = [
    { id: 1, description: 'Grocery Store', amount: -120.50, date: '2023-12-24', type: 'expense' },
    { id: 2, description: 'Salary', amount: 3000.00, date: '2023-12-23', type: 'income' },
    { id: 3, description: 'Electric Bill', amount: -150.00, date: '2023-12-22', type: 'expense' },
    { id: 4, description: 'Freelance Work', amount: 500.00, date: '2023-12-21', type: 'income' },
    { id: 5, description: 'Internet', amount: -60.00, date: '2023-12-20', type: 'expense' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Add Transaction
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="p-4 hover:bg-gray-50">
               <TransactionCard transaction={transaction} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Transactions;
