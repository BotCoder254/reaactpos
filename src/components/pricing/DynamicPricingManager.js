import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiPercent, FiLoader } from 'react-icons/fi';
import { addDynamicPricingRule, updateDynamicPricingRule, deleteDynamicPricingRule, getActiveDynamicPricingRules } from '../../utils/dynamicPricingQueries';
import { useAuth } from '../../contexts/AuthContext';

const DynamicPricingManager = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userRole } = useAuth();
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'timeOfDay',
    timeStart: '00:00',
    timeEnd: '23:59',
    discount: 0,
    active: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const fetchedRules = await getActiveDynamicPricingRules();
      setRules(fetchedRules);
      setError(null);
    } catch (err) {
      console.error('Error fetching rules:', err);
      setError('Failed to load dynamic pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (editingRule) {
        await updateDynamicPricingRule(editingRule.id, newRule);
      } else {
        await addDynamicPricingRule(newRule);
      }
      setNewRule({
        name: '',
        type: 'timeOfDay',
        timeStart: '00:00',
        timeEnd: '23:59',
        discount: 0,
        active: true
      });
      setEditingRule(null);
      await fetchRules();
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Failed to save dynamic pricing rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setNewRule(rule);
  };

  const handleDelete = async (ruleId, ruleName) => {
    try {
      await deleteDynamicPricingRule(ruleId, ruleName);
      await fetchRules();
      setError(null);
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete dynamic pricing rule');
    }
  };

  if (userRole !== 'manager') {
    return (
      <div className="p-4">
        <p className="text-gray-600">Only managers can access dynamic pricing settings.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dynamic Pricing Rules</h2>
        <p className="mt-2 text-gray-600">Create and manage dynamic pricing rules for your products.</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingRule ? 'Edit Rule' : 'Create New Rule'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Rule Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter rule name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rule Type</label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="timeOfDay">Time of Day</option>
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
              </select>
            </div>

            {newRule.type === 'timeOfDay' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newRule.timeStart}
                    onChange={(e) => setNewRule({ ...newRule, timeStart: e.target.value })}
                    className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newRule.timeEnd}
                    onChange={(e) => setNewRule({ ...newRule, timeEnd: e.target.value })}
                    className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {newRule.type === 'fixed' ? 'Amount Off ($)' : 'Discount (%)'}
              </label>
              <input
                type="number"
                value={newRule.discount}
                onChange={(e) => setNewRule({ ...newRule, discount: parseFloat(e.target.value) })}
                min="0"
                max={newRule.type === 'percentage' ? "100" : undefined}
                step="0.01"
                className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newRule.active}
                onChange={(e) => setNewRule({ ...newRule, active: e.target.checked })}
                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Rule Active</label>
            </div>

            <div className="flex justify-end space-x-3">
              {editingRule && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRule(null);
                    setNewRule({
                      name: '',
                      type: 'timeOfDay',
                      timeStart: '00:00',
                      timeEnd: '23:59',
                      discount: 0,
                      active: true
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                {editingRule ? 'Update Rule' : 'Create Rule'}
                {isLoading && <FiLoader className="ml-2 animate-spin" />}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Rules</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{rule.name}</h4>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      {rule.type === 'timeOfDay' ? (
                        <>
                          <FiClock className="mr-1" />
                          {rule.timeStart} - {rule.timeEnd}
                        </>
                      ) : (
                        <>
                          <FiPercent className="mr-1" />
                          {rule.discount}
                          {rule.type === 'percentage' ? '%' : '$'} off
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 text-gray-400 hover:text-gray-500"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id, rule.name)}
                      className="p-2 text-red-400 hover:text-red-500"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {rules.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No dynamic pricing rules found. Create one to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPricingManager; 