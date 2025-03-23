import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { logActivity } from './activityLog';

export const addExpense = async (expenseData) => {
  try {
    const expensesRef = collection(db, 'expenses');
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'expense_created',
      details: `Added expense: ${expenseData.description}`,
      metadata: {
        expenseId: docRef.id,
        amount: expenseData.amount,
        category: expenseData.category
      }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId, expenseData) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, {
      ...expenseData,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'expense_updated',
      details: `Updated expense: ${expenseData.description}`,
      metadata: {
        expenseId,
        amount: expenseData.amount,
        category: expenseData.category
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId, description) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseRef);

    await logActivity({
      type: 'expense_deleted',
      details: `Deleted expense: ${description}`,
      metadata: {
        expenseId
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const getExpenses = async (startDate, endDate) => {
  try {
    const expensesRef = collection(db, 'expenses');
    let q = query(expensesRef, orderBy('createdAt', 'desc'));
    
    if (startDate && endDate) {
      q = query(q, 
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const getExpenseAnalytics = async (period = 'month') => {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const expenses = await getExpenses(Timestamp.fromDate(startDate), Timestamp.fromDate(new Date()));

    // Calculate total expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    // Calculate daily expenses
    const dailyExpenses = expenses.reduce((acc, expense) => {
      const date = expense.createdAt.toDate().toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += expense.amount;
      return acc;
    }, {});

    // Convert to arrays for charts
    const categoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount
    }));

    const dailyData = Object.entries(dailyExpenses).map(([date, amount]) => ({
      date,
      amount
    }));

    return {
      totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      expensesByCategory: categoryData,
      dailyExpenses: dailyData,
      expenseCount: expenses.length
    };
  } catch (error) {
    console.error('Error getting expense analytics:', error);
    throw error;
  }
}; 