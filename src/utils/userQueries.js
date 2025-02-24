import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateEmail,
  deleteUser,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Get all users
export async function getUsers() {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('email')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

// Add a new user
export async function addUser(userData) {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    // Add user to Firestore
    const docRef = await addDoc(collection(db, 'users'), {
      uid: userCredential.user.uid,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: userData.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log activity
    await logUserActivity({
      action: 'user_created',
      targetUserId: docRef.id,
      details: `Created user ${userData.email} with role ${userData.role}`
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
}

// Update a user
export async function updateUser(userId, userData) {
  try {
    const userRef = doc(db, 'users', userId);
    
    // If email is being updated, update in Auth
    if (userData.email) {
      await updateEmail(auth.currentUser, userData.email);
    }

    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });

    // Log activity
    await logUserActivity({
      action: 'user_updated',
      targetUserId: userId,
      details: `Updated user ${userData.email}`
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Delete a user
export async function deleteUserAccount(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Delete from Auth
    if (userData.uid) {
      await deleteUser(auth.currentUser);
    }

    // Delete from Firestore
    await deleteDoc(userRef);

    // Log activity
    await logUserActivity({
      action: 'user_deleted',
      targetUserId: userId,
      details: `Deleted user ${userData.email}`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Get user activity logs
export async function getUserActivityLogs(userId = null) {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, 'userActivity'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else {
      q = query(
        collection(db, 'userActivity'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user activity logs:', error);
    throw error;
  }
}

// Log user activity
export async function logUserActivity(activityData) {
  try {
    await addDoc(collection(db, 'userActivity'), {
      ...activityData,
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
    throw error;
  }
}