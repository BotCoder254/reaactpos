import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { chartColors } from '../../utils/chartConfig';
import { getDiscountPerformanceMetrics } from '../../utils/discountQueries';
import '../../utils/chartConfig';

export default function DiscountPerformanceChart({ discountId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDiscountPerformanceMetrics(discountId);
        setMetrics(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
        setError('Failed to load performance metrics');
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [discountId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics || !metrics.dailyMetrics || metrics.dailyMetrics.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              No performance data available for this period
            </p>
          </div>
        </div>
      </div>
    );
  }

  const data = {
    labels: metrics.dailyMetrics.map(metric => metric.date),
    datasets: [
      {
        label: 'Revenue',
        data: metrics.dailyMetrics.map(metric => metric.revenue),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryLight,
        yAxisID: 'y'
      },
      {
        label: 'Savings',
        data: metrics.dailyMetrics.map(metric => metric.savings),
        borderColor: chartColors.success,
        backgroundColor: chartColors.successLight,
        yAxisID: 'y'
      },
      {
        label: 'Orders',
        data: metrics.dailyMetrics.map(metric => metric.orders),
        borderColor: chartColors.warning,
        backgroundColor: chartColors.warningLight,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: '30-Day Performance Metrics'
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Amount ($)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Number of Orders'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Line options={options} data={data} height={300} />
    </div>
  );
}