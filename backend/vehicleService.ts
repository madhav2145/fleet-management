import { firestore } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export const addVehicle = async (vehicleData: any) => {
  try {
    const docRef = await addDoc(collection(firestore, 'vehicles'), vehicleData);
    console.log('Vehicle added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle: ', error);
    throw error;
  }
};

export const updateVehicle = async (vehicleId: string, updatedData: any) => {
  try {
    const vehicleRef = doc(firestore, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, updatedData);
    console.log('Vehicle updated with ID: ', vehicleId);
  } catch (error) {
    console.error('Error updating vehicle: ', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId: string) => {
  try {
    const vehicleRef = doc(firestore, 'vehicles', vehicleId);
    await deleteDoc(vehicleRef);
    console.log('Vehicle deleted with ID: ', vehicleId);
  } catch (error) {
    console.error('Error deleting vehicle: ', error);
    throw error;
  }
};

export const getVehicle = async (vehicleNo: string) => {
  try {
    const q = query(collection(firestore, 'vehicles'), where('vehicleNo', '==', vehicleNo));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const vehicle = querySnapshot.docs[0].data();
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

export const getAllVehicles = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'vehicles'));
    const vehicles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('All vehicles:', vehicles);
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles: ', error);
    throw error;
  }
};