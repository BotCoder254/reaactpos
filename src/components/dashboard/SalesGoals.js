import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSalesGoals } from '../../contexts/SalesGoalsContext';
import { useAuth } from '../../contexts/AuthContext';

const SalesGoals = () => {
  const { goals, updateGoal, loading, error } = useSalesGoals() || {};
  const { userRole } = useAuth();
  const [editMode, setEditMode] = useState(null);
  const [tempTarget, setTempTarget] = useState('');

  const handleEdit = (period) => {
    if (userRole !== 'manager') return;
    setEditMode(period);
    setTempTarget(goals?.[period]?.target?.toString() || '0');
  };

  const handleSave = async (period) => {
    if (userRole !== 'manager') return;
    if (!tempTarget || isNaN(parseFloat(tempTarget)) || parseFloat(tempTarget) < 0) {
      return;
    }
    await updateGoal?.(period, parseFloat(tempTarget));
    setEditMode(null);
  };

  const calculateProgress = (achieved, target) => {
    if (!target || target === 0) return 0;
    return Math.min((achieved / target) * 100, 100);
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: (progress) => ({
      width: `${progress}%`,
      transition: { duration: 0.8, ease: "easeOut" }
    })
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!goals) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded">
          No sales goals data available.
        </div>
      </div>
    );
  }


  const renderGoalSection = (period) => {
    const { target = 0, achieved = 0 } = goals[period] || {};
    // const progress = calculateProgress(achieved, target);



    const achievedValue = parseFloat(String(achieved)) || 0;
  
    const progress = calculateProgress(achievedValue, target);
    return (
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold capitalize">{period} Goal</h3>
          {userRole === 'manager' && (
            editMode === period ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-24 px-2 py-1 border rounded"
                />
                <button
                  onClick={() => handleSave(period)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEdit(period)}
                className="text-blue-500 hover:text-blue-600"
              >
                Edit
              </button>
            )
          )}
        </div>
        <div className="mb-2">
          <span className="text-gray-600">Target: ${target.toLocaleString()}</span>
          <span className="mx-2">|</span>
          <span className="text-gray-600">Achieved:{achievedValue.toLocaleString()}</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            variants={progressVariants}
            initial="initial"
            animate="animate"
            custom={progress}
          />
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {progress.toFixed(1)}% Complete
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Sales Goals</h2>
      {renderGoalSection('daily')}
      {renderGoalSection('weekly')}
      {renderGoalSection('monthly')}
    </div>
  );
};

export default SalesGoals; 