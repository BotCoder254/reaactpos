import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RefundManager from '../components/refunds/RefundManager';
import RefundRequest from '../components/refunds/RefundRequest';
import { useAuth } from '../contexts/AuthContext';

export default function RefundRoutes() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  return (
    <Routes>
      {isManager ? (
        <Route path="/refunds" element={<RefundManager />} />
      ) : (
        <Route path="/refunds" element={<RefundRequest />} />
      )}
    </Routes>
  );
} 