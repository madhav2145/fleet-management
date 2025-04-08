import { firestore } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const collectionName = 'vehicles';

// Add a new vehicle
export const addVehicle = async (vehicleData: any) => {
  try {
    const docRef = await addDoc(collection(firestore, collectionName), vehicleData);
    console.log('Vehicle added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle: ', error);
    throw error;
  }
};

// Get all vehicles
export const getAllVehicles = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    const vehicles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('All vehicles:', vehicles);
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles: ', error);
    throw error;
  }
};

// Other CRUD operations (update, delete, get by ID) can be added here

export const updateVehicle = async (vehicleId: string, updatedData: any) => {
  try {
    const vehicleRef = doc(firestore, collectionName, vehicleId);
    await updateDoc(vehicleRef, updatedData);
    console.log('Vehicle updated with ID: ', vehicleId);
  } catch (error) {
    console.error('Error updating vehicle: ', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId: string) => {
  try {
    const vehicleRef = doc(firestore, collectionName, vehicleId);
    await deleteDoc(vehicleRef);
    console.log('Vehicle deleted with ID: ', vehicleId);
  } catch (error) {
    console.error('Error deleting vehicle: ', error);
    throw error;
  }
};

export const getVehicle = async (vehicleId: string) => {
  try {
    const vehicleRef = doc(firestore, collectionName, vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    if (vehicleDoc.exists()) {
      const vehicle = vehicleDoc.data();
      console.log('Vehicle data:', vehicle);
      return vehicle;
    } else {
      console.log('No such vehicle!');
      return null;
    }
  } catch (error) {
    console.error('Error getting vehicle: ', error);
    throw error;
  }
};