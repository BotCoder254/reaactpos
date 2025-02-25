import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Default chart options
export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      font: {
        size: 16,
        weight: 'bold'
      }
    }
  }
};

// Theme colors
export const chartColors = {
  primary: 'rgb(59, 130, 246)',
  success: 'rgb(16, 185, 129)',
  warning: 'rgb(245, 158, 11)',
  danger: 'rgb(239, 68, 68)',
  info: 'rgb(99, 102, 241)',
  primaryLight: 'rgba(59, 130, 246, 0.5)',
  successLight: 'rgba(16, 185, 129, 0.5)',
  warningLight: 'rgba(245, 158, 11, 0.5)',
  dangerLight: 'rgba(239, 68, 68, 0.5)',
  infoLight: 'rgba(99, 102, 241, 0.5)'
}; 