import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Chart = ({ data }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Overview',
      },
    },
  };

  const defaultData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Income',
        data: [1200, 1900, 3000, 500, 2000, 3000, 4500],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Expenses',
        data: [800, 1500, 2000, 400, 1500, 2500, 4000],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return <Bar options={options} data={data || defaultData} />;
};

export default Chart;
