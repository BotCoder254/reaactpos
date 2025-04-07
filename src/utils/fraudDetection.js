import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';

// Threshold values for fraud detection
const THRESHOLDS = {
  HIGH_VALUE_ITEM: 100, // Items over $100 are considered high value
  SUSPICIOUS_REMOVAL_TIME: 30, // 30 seconds between add and remove is suspicious
  MAX_REMOVAL_COUNT: 3, // More than 3 removals in a transaction is suspicious
  REPEATED_CANCELLATION: 2 // More than 2 cancellations of same high-value item is suspicious
};

export const checkForFraudulentActivity = async (stationId, action, item) => {
  const logs = collection(db, 'self-checkout-logs');
  const alerts = [];

  // Check for high-value item removals
  if (action === 'remove_item' && item.price >= THRESHOLDS.HIGH_VALUE_ITEM) {
    // Get recent add action for this item
    const recentAddQuery = query(
      logs,
      where('stationId', '==', stationId),
      where('itemId', '==', item.id),
      where('action', '==', 'add_item'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const recentAddDocs = await getDocs(recentAddQuery);
    if (!recentAddDocs.empty) {
      const addAction = recentAddDocs.docs[0].data();
      const timeDiff = Date.now() - addAction.timestamp.toDate();
      
      if (timeDiff <= THRESHOLDS.SUSPICIOUS_REMOVAL_TIME * 1000) {
        alerts.push({
          type: 'alert',
          severity: 'high',
          message: `Quick removal of high-value item (${item.name})`,
          stationId,
          timestamp: new Date()
        });
      }
    }
  }

  // Check for repeated removals in current transaction
  const removalQuery = query(
    logs,
    where('stationId', '==', stationId),
    where('action', '==', 'remove_item'),
    orderBy('timestamp', 'desc')
  );

  const removalDocs = await getDocs(removalQuery);
  const removalCount = removalDocs.size;

  if (removalCount >= THRESHOLDS.MAX_REMOVAL_COUNT) {
    alerts.push({
      type: 'alert',
      severity: 'medium',
      message: `Multiple item removals detected (${removalCount} times)`,
      stationId,
      timestamp: new Date()
    });
  }

  // Check for repeated cancellations of high-value items
  if (item.price >= THRESHOLDS.HIGH_VALUE_ITEM) {
    const cancellationQuery = query(
      logs,
      where('itemId', '==', item.id),
      where('action', '==', 'remove_item'),
      orderBy('timestamp', 'desc')
    );

    const cancellationDocs = await getDocs(cancellationQuery);
    const cancellationCount = cancellationDocs.size;

    if (cancellationCount >= THRESHOLDS.REPEATED_CANCELLATION) {
      alerts.push({
        type: 'alert',
        severity: 'high',
        message: `Repeated cancellation of high-value item (${item.name})`,
        stationId,
        timestamp: new Date()
      });
    }
  }

  // Log alerts if any were generated
  for (const alert of alerts) {
    await addDoc(collection(db, 'self-checkout-logs'), alert);
  }

  return alerts;
};

export const getStationEfficiencyMetrics = async (stationId) => {
  const logs = collection(db, 'self-checkout-logs');
  
  // Get completed transactions
  const transactionQuery = query(
    logs,
    where('stationId', '==', stationId),
    where('action', '==', 'complete_transaction'),
    orderBy('timestamp', 'desc')
  );

  const transactionDocs = await getDocs(transactionQuery);
  const transactions = transactionDocs.docs.map(doc => doc.data());

  // Calculate metrics
  const metrics = {
    averageTransactionTime: 0,
    totalTransactions: transactions.length,
    successRate: 0,
    alertRate: 0
  };

  if (transactions.length > 0) {
    // Calculate average transaction time
    const totalTime = transactions.reduce((sum, t) => sum + t.duration, 0);
    metrics.averageTransactionTime = totalTime / transactions.length;

    // Calculate success rate (transactions without alerts)
    const alertQuery = query(
      logs,
      where('stationId', '==', stationId),
      where('type', '==', 'alert')
    );
    const alertDocs = await getDocs(alertQuery);
    const alertCount = alertDocs.size;

    metrics.successRate = (transactions.length - alertCount) / transactions.length;
    metrics.alertRate = alertCount / transactions.length;
  }

  return metrics;
};

export const generateFraudReport = async (startDate, endDate) => {
  const logs = collection(db, 'self-checkout-logs');
  
  const alertQuery = query(
    logs,
    where('type', '==', 'alert'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'desc')
  );

  const alertDocs = await getDocs(alertQuery);
  const alerts = alertDocs.docs.map(doc => doc.data());

  // Group alerts by severity
  const report = {
    totalAlerts: alerts.length,
    highSeverity: alerts.filter(a => a.severity === 'high').length,
    mediumSeverity: alerts.filter(a => a.severity === 'medium').length,
    lowSeverity: alerts.filter(a => a.severity === 'low').length,
    byStation: {},
    mostCommonItems: {}
  };

  // Group by station
  alerts.forEach(alert => {
    if (!report.byStation[alert.stationId]) {
      report.byStation[alert.stationId] = 0;
    }
    report.byStation[alert.stationId]++;

    if (alert.itemId) {
      if (!report.mostCommonItems[alert.itemId]) {
        report.mostCommonItems[alert.itemId] = 0;
      }
      report.mostCommonItems[alert.itemId]++;
    }
  });

  return report;
}; 