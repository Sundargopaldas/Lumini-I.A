const TransactionCard = ({ transaction }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{transaction.date}</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{transaction.description}</p>
        </div>
        <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount)}
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
