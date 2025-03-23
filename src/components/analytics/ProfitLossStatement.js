import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { getExpenseAnalytics } from '../../utils/expenseQueries';
import { getSalesAnalytics } from '../../utils/salesQueries';

export default function ProfitLossStatement() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expenseData, salesData] = await Promise.all([
        getExpenseAnalytics(period),
        getSalesAnalytics(period)
      ]);

      // Process data for charts
      const profitLossData = processProfitLossData(salesData, expenseData);
      setData(profitLossData);
    } catch (error) {
      console.error('Error fetching profit/loss data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processProfitLossData = (sales, expenses) => {
    const totalRevenue = sales.totalSales || 0;
    const totalExpenses = expenses.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Combine daily data for trend analysis
    const dailyData = sales.dailySales?.map(sale => {
      const expense = expenses.dailyExpenses?.find(exp => exp.date === sale.date) || { amount: 0 };
      return {
        date: sale.date,
        revenue: sale.amount,
        expenses: expense.amount,
        profit: sale.amount - expense.amount
      };
    }) || [];

    // Category breakdown
    const expensesByCategory = expenses.expensesByCategory || [];
    const salesByCategory = sales.salesByCategory || [];

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin
      },
      dailyData,
      expensesByCategory,
      salesByCategory
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Profit & Loss Statement</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ${data.summary.totalRevenue.toFixed(2)}
              </h3>
            </div>
            <FiDollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Expenses</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ${data.summary.totalExpenses.toFixed(2)}
              </h3>
            </div>
            <FiTrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Net Profit</p>
              <h3 className={`text-2xl font-bold ${
                data.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${data.summary.netProfit.toFixed(2)}
              </h3>
            </div>
            <FiTrendingUp className={`h-8 w-8 ${
              data.summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
            }`} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Profit Margin</p>
              <h3 className={`text-2xl font-bold ${
                data.summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.summary.profitMargin.toFixed(1)}%
              </h3>
            </div>
            <FiTrendingUp className={`h-8 w-8 ${
              data.summary.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'
            }`} />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Revenue vs Expenses Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#6366F1"
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#10B981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Expenses by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 