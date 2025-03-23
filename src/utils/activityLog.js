import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

export const logActivity = async (activity) => {
  try {
    const activitiesRef = collection(db, 'activities');
    const currentUser = auth.currentUser;

    await addDoc(activitiesRef, {
      ...activity,
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
      timestamp: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
};

export const createAuditLog = async (type, action, details, metadata = {}) => {
  return logActivity({
    type,
    action,
    details,
    metadata
  });
}; 