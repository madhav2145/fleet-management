import { firestore } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const collectionName = 'water&urea';

// Add a new resource
export const addResource = async (resourceData: any) => {
  try {
    const docRef = await addDoc(collection(firestore, 'water&urea'), resourceData);
    console.log('Resource added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding resource: ', error);
    throw error;
  }
};

// Get all resources
export const getAllResources = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    const resources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('All resources:', resources);
    return resources;
  } catch (error) {
    console.error('Error getting resources: ', error);
    throw error;
  }
};

// Update an existing entry in the "water&urea" collection
export const updateResource = async (resourceId: string, updatedData: any) => {
  try {
    const resourceRef = doc(firestore, collectionName, resourceId);
    await updateDoc(resourceRef, updatedData);
    console.log('Resource updated with ID: ', resourceId);
  } catch (error) {
    console.error('Error updating resource: ', error);
    throw error;
  }
};

// Delete an entry from the "water&urea" collection
export const deleteResource = async (resourceId: string) => {
  try {
    const resourceRef = doc(firestore, collectionName, resourceId);
    await deleteDoc(resourceRef);
    console.log('Resource deleted with ID: ', resourceId);
  } catch (error) {
    console.error('Error deleting resource: ', error);
    throw error;
  }
};

// Get a specific entry from the "water&urea" collection by ID
export const getResource = async (resourceId: string) => {
  try {
    const resourceRef = doc(firestore, collectionName, resourceId);
    const resourceDoc = await getDoc(resourceRef);
    if (resourceDoc.exists()) {
      const resource = resourceDoc.data();
      console.log('Resource data:', resource);
      return resource;
    } else {
      console.log('No such resource!');
      return null;
    }
  } catch (error) {
    console.error('Error getting resource: ', error);
    throw error;
  }
};




