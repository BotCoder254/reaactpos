import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { logActivity } from './activityLog';

export const addMarketingBanner = async (bannerData) => {
  try {
    const bannersRef = collection(db, 'marketingBanners');
    const docRef = await addDoc(bannersRef, {
      ...bannerData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'marketing_banner_created',
      details: `Created marketing banner: ${bannerData.title}`,
      metadata: {
        bannerId: docRef.id,
        bannerTitle: bannerData.title
      }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding marketing banner:', error);
    throw error;
  }
};

export const updateMarketingBanner = async (bannerId, bannerData) => {
  try {
    const bannerRef = doc(db, 'marketingBanners', bannerId);
    await updateDoc(bannerRef, {
      ...bannerData,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'marketing_banner_updated',
      details: `Updated marketing banner: ${bannerData.title}`,
      metadata: {
        bannerId,
        bannerTitle: bannerData.title
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating marketing banner:', error);
    throw error;
  }
};

export const deleteMarketingBanner = async (bannerId, bannerTitle) => {
  try {
    const bannerRef = doc(db, 'marketingBanners', bannerId);
    await deleteDoc(bannerRef);

    await logActivity({
      type: 'marketing_banner_deleted',
      details: `Deleted marketing banner: ${bannerTitle}`,
      metadata: {
        bannerId,
        bannerTitle
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting marketing banner:', error);
    throw error;
  }
};

export const getActiveMarketingBanners = async () => {
  try {
    const bannersRef = collection(db, 'marketingBanners');
    const now = Timestamp.now();
    
    // Query active banners
    const q = query(
      bannersRef,
      where('startDate', '<=', now),
      where('endDate', '>=', now)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching active marketing banners:', error);
    throw error;
  }
};

export const getAllMarketingBanners = async () => {
  try {
    const bannersRef = collection(db, 'marketingBanners');
    const querySnapshot = await getDocs(bannersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all marketing banners:', error);
    throw error;
  }
}; 