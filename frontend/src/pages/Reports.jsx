import Chart from '../components/Chart';

const Reports = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Overview</h2>
        <Chart />
      </div>
    </div>
  );
};

export default Reports;
