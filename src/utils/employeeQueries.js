import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';

export const getEmployeePerformance = async (employeeId, startDate, endDate) => {
  try {
    const salesRef = collection(db, 'sales');
    const q = query(
      salesRef,
      where('cashierId', '==', employeeId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate performance metrics
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;
    const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const itemsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    return {
      totalSales,
      totalTransactions,
      averageTransactionValue,
      itemsSold,
      sales
    };
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    throw error;
  }
};

export const getTeamPerformance = async (startDate, endDate) => {
  try {
    const employeesRef = collection(db, 'users');
    const employeesSnapshot = await getDocs(query(employeesRef, where('role', '==', 'cashier')));
    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const performanceData = await Promise.all(
      employees.map(async (employee) => {
        const performance = await getEmployeePerformance(employee.id, startDate, endDate);
        return {
          ...employee,
          performance
        };
      })
    );

    // Sort by total sales
    return performanceData.sort((a, b) => b.performance.totalSales - a.performance.totalSales);
  } catch (error) {
    console.error('Error fetching team performance:', error);
    throw error;
  }
};

export const getEmployeeStats = async (employeeId) => {
  try {
    // Get last 30 days performance
    const endDate = Timestamp.now();
    const startDate = new Timestamp(endDate.seconds - (30 * 24 * 60 * 60), 0);
    
    const performance = await getEmployeePerformance(employeeId, startDate, endDate);
    
    // Calculate additional stats
    const dailyAverage = performance.totalSales / 30;
    const salesPerTransaction = performance.totalTransactions > 0 
      ? performance.totalSales / performance.totalTransactions 
      : 0;
    
    return {
      ...performance,
      dailyAverage,
      salesPerTransaction,
      periodStart: startDate,
      periodEnd: endDate
    };
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    throw error;
  }
}; 