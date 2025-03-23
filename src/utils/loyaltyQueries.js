import { db } from '../firebase';
import { collection, addDoc, updateDoc, getDoc, getDocs, query, where, doc, orderBy, Timestamp, setDoc } from 'firebase/firestore';
import { logActivity } from './activityLog';

export const createLoyaltyProgram = async (programData) => {
  try {
    const programRef = collection(db, 'loyaltyPrograms');
    const docRef = await addDoc(programRef, {
      ...programData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true
    });

    await logActivity({
      type: 'loyalty_program_created',
      details: `Created loyalty program: ${programData.name}`,
      metadata: {
        programId: docRef.id,
        programName: programData.name
      }
    });

    return {
      id: docRef.id,
      ...programData
    };
  } catch (error) {
    console.error('Error creating loyalty program:', error);
    throw error;
  }
};

export const updateLoyaltyProgram = async (programId, programData) => {
  try {
    const programRef = doc(db, 'loyaltyPrograms', programId);
    await updateDoc(programRef, {
      ...programData,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'loyalty_program_updated',
      details: `Updated loyalty program: ${programData.name}`,
      metadata: {
        programId,
        programName: programData.name
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating loyalty program:', error);
    throw error;
  }
};

export const createLoyaltyAccount = async (customerData) => {
  try {
    const accountsRef = collection(db, 'loyaltyAccounts');
    const docRef = await addDoc(accountsRef, {
      ...customerData,
      points: 0,
      totalSpent: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'loyalty_account_created',
      details: `Created loyalty account for: ${customerData.name}`,
      metadata: {
        accountId: docRef.id,
        customerPhone: customerData.phone
      }
    });

    return {
      id: docRef.id,
      ...customerData
    };
  } catch (error) {
    console.error('Error creating loyalty account:', error);
    throw error;
  }
};

export const getLoyaltyAccount = async (phone) => {
  try {
    const accountsRef = collection(db, 'loyaltyAccounts');
    const q = query(accountsRef, where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error fetching loyalty account:', error);
    throw error;
  }
};

export const updateLoyaltyPoints = async (accountId, points, amount) => {
  try {
    const accountRef = doc(db, 'loyaltyAccounts', accountId);
    const accountDoc = await getDoc(accountRef);
    const accountData = accountDoc.data();

    const updatedPoints = accountData.points + points;
    const updatedSpent = accountData.totalSpent + amount;

    await updateDoc(accountRef, {
      points: updatedPoints,
      totalSpent: updatedSpent,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'loyalty_points_updated',
      details: `Updated loyalty points for account: ${accountId}`,
      metadata: {
        accountId,
        pointsAdded: points,
        newTotal: updatedPoints
      }
    });

    return {
      id: accountId,
      points: updatedPoints,
      totalSpent: updatedSpent
    };
  } catch (error) {
    console.error('Error updating loyalty points:', error);
    throw error;
  }
};

export const redeemPoints = async (accountId, pointsToRedeem, rewardName) => {
  try {
    const accountRef = doc(db, 'loyaltyAccounts', accountId);
    const accountDoc = await getDoc(accountRef);
    const accountData = accountDoc.data();

    if (accountData.points < pointsToRedeem) {
      throw new Error('Insufficient points');
    }

    const updatedPoints = accountData.points - pointsToRedeem;

    await updateDoc(accountRef, {
      points: updatedPoints,
      updatedAt: Timestamp.now()
    });

    // Log redemption
    const redemptionsRef = collection(db, 'loyaltyRedemptions');
    await addDoc(redemptionsRef, {
      accountId,
      pointsRedeemed: pointsToRedeem,
      rewardName,
      timestamp: Timestamp.now()
    });

    await logActivity({
      type: 'loyalty_points_redeemed',
      details: `Redeemed ${pointsToRedeem} points for ${rewardName}`,
      metadata: {
        accountId,
        pointsRedeemed: pointsToRedeem,
        rewardName
      }
    });

    return {
      id: accountId,
      points: updatedPoints
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    throw error;
  }
};

export const getLoyaltyAnalytics = async () => {
  try {
    const accountsRef = collection(db, 'loyaltyAccounts');
    const redemptionsRef = collection(db, 'loyaltyRedemptions');

    const [accountsSnapshot, redemptionsSnapshot] = await Promise.all([
      getDocs(accountsRef),
      getDocs(redemptionsRef)
    ]);

    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const redemptions = redemptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate analytics
    const totalAccounts = accounts.length;
    const totalPoints = accounts.reduce((sum, account) => sum + account.points, 0);
    const totalSpent = accounts.reduce((sum, account) => sum + account.totalSpent, 0);
    const totalRedemptions = redemptions.length;

    // Get top customers by points
    const topCustomers = [...accounts]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    // Get most redeemed rewards
    const rewardCounts = redemptions.reduce((acc, redemption) => {
      acc[redemption.rewardName] = (acc[redemption.rewardName] || 0) + 1;
      return acc;
    }, {});

    const topRewards = Object.entries(rewardCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAccounts,
      totalPoints,
      totalSpent,
      totalRedemptions,
      topCustomers,
      topRewards,
      averagePointsPerCustomer: totalAccounts > 0 ? totalPoints / totalAccounts : 0,
      averageSpentPerCustomer: totalAccounts > 0 ? totalSpent / totalAccounts : 0
    };
  } catch (error) {
    console.error('Error getting loyalty analytics:', error);
    throw error;
  }
};

export const getLoyaltyProgram = async () => {
  try {
    const programRef = doc(db, 'loyaltyProgram', 'default');
    const docSnap = await getDoc(programRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Create default program if it doesn't exist
      const defaultProgram = {
        name: 'Default Loyalty Program',
        pointsPerDollar: 1,
        minimumPurchase: 0,
        rewards: [
          { points: 100, name: '$5 off purchase', value: 5 },
          { points: 200, name: '$10 off purchase', value: 10 },
          { points: 500, name: '$25 off purchase', value: 25 }
        ]
      };
      await setDoc(programRef, defaultProgram);
      return defaultProgram;
    }
  } catch (error) {
    console.error('Error getting loyalty program:', error);
    throw error;
  }
}; 