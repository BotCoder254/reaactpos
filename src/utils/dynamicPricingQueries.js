import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { logActivity } from './activityLog';

export const addDynamicPricingRule = async (ruleData) => {
  try {
    const rulesRef = collection(db, 'dynamicPricingRules');
    const docRef = await addDoc(rulesRef, {
      ...ruleData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      active: true
    });

    await logActivity({
      type: 'dynamic_pricing_rule_created',
      details: `Created dynamic pricing rule: ${ruleData.name}`,
      metadata: {
        ruleId: docRef.id,
        ruleName: ruleData.name,
        ruleType: ruleData.type
      }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding dynamic pricing rule:', error);
    throw error;
  }
};

export const updateDynamicPricingRule = async (ruleId, ruleData) => {
  try {
    const ruleRef = doc(db, 'dynamicPricingRules', ruleId);
    await updateDoc(ruleRef, {
      ...ruleData,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'dynamic_pricing_rule_updated',
      details: `Updated dynamic pricing rule: ${ruleData.name}`,
      metadata: {
        ruleId,
        ruleName: ruleData.name,
        ruleType: ruleData.type
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating dynamic pricing rule:', error);
    throw error;
  }
};

export const deleteDynamicPricingRule = async (ruleId, ruleName) => {
  try {
    const ruleRef = doc(db, 'dynamicPricingRules', ruleId);
    await deleteDoc(ruleRef);

    await logActivity({
      type: 'dynamic_pricing_rule_deleted',
      details: `Deleted dynamic pricing rule: ${ruleName}`,
      metadata: {
        ruleId,
        ruleName
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting dynamic pricing rule:', error);
    throw error;
  }
};

export const getActiveDynamicPricingRules = async () => {
  try {
    const rulesRef = collection(db, 'dynamicPricingRules');
    const now = Timestamp.now();
    
    const q = query(
      rulesRef,
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(rule => {
        const startTime = rule.startTime ? new Date(rule.startTime) : null;
        const endTime = rule.endTime ? new Date(rule.endTime) : null;
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        // Check time-based rules
        if (rule.type === 'timeOfDay') {
          const [ruleStartHour, ruleStartMinute] = rule.timeStart.split(':').map(Number);
          const [ruleEndHour, ruleEndMinute] = rule.timeEnd.split(':').map(Number);
          const currentTimeValue = currentHour * 60 + currentMinute;
          const ruleStartValue = ruleStartHour * 60 + ruleStartMinute;
          const ruleEndValue = ruleEndHour * 60 + ruleEndMinute;

          return currentTimeValue >= ruleStartValue && currentTimeValue <= ruleEndValue;
        }

        // Check date-based rules
        if (startTime && endTime) {
          return currentTime >= startTime && currentTime <= endTime;
        }

        return true;
      });
  } catch (error) {
    console.error('Error fetching active dynamic pricing rules:', error);
    throw error;
  }
};

export const calculateDynamicPrice = (basePrice, rules) => {
  if (!rules || rules.length === 0) return basePrice;

  let finalPrice = basePrice;
  let maxDiscount = 0;

  rules.forEach(rule => {
    let discount = 0;

    switch (rule.type) {
      case 'percentage':
        discount = basePrice * (rule.value / 100);
        break;
      case 'fixed':
        discount = rule.value;
        break;
      case 'timeOfDay':
        discount = basePrice * (rule.discount / 100);
        break;
      default:
        break;
    }

    // Apply the highest discount
    maxDiscount = Math.max(maxDiscount, discount);
  });

  finalPrice = basePrice - maxDiscount;
  return Math.max(finalPrice, 0); // Ensure price doesn't go below 0
}; 