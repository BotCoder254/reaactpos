import { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth,
  db 
} from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, role = 'cashier') {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document with role
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      role,
      createdAt: new Date()
    });
    return result;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const role = await getUserRole(result.user.uid);
    setUserRole(role);
    return result;
  }

  async function loginWithGoogle(role = 'cashier') {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document with selected role
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        role,
        createdAt: new Date()
      });
      setUserRole(role);
    } else {
      setUserRole(userDoc.data().role);
    }
    return result;
  }

  function logout() {
    setUserRole(null);
    return signOut(auth);
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Error sending reset email:', error);
      throw error;
    }
  }

  async function getUserRole(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
          setUserRole(userDoc.data().role);
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 