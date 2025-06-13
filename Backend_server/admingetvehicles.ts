import { adminFirestore } from './adminfirebaseconfig.js'; // Use adminFirestore for server-side operations

const collectionName = 'vehicles';

// Add a new vehicle
export const addVehicle = async (vehicleData: any) => {
  try {
    const docRef = await adminFirestore.collection(collectionName).add(vehicleData);
    // console.log('Vehicle added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle: ', error);
    throw error;
  }
};

// Get all vehicles
export const getAllVehicles = async () => {
  try {
    const querySnapshot = await adminFirestore.collection(collectionName).get();
    const vehicles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // console.log('All vehicles:', vehicles);
    return vehicles;
  } catch (error) {
    console.error('Error getting vehicles: ', error);
    throw error;
  }
};

// Update a vehicle
export const updateVehicle = async (vehicleId: string, updatedData: any) => {
  try {
    const vehicleRef = adminFirestore.collection(collectionName).doc(vehicleId);
    await vehicleRef.update(updatedData);
    // console.log('Vehicle updated with ID: ', vehicleId);
  } catch (error) {
    console.error('Error updating vehicle: ', error);
    throw error;
  }
};

// Delete a vehicle
export const deleteVehicle = async (vehicleId: string) => {
  try {
    const vehicleRef = adminFirestore.collection(collectionName).doc(vehicleId);
    await vehicleRef.delete();
    // console.log('Vehicle deleted with ID: ', vehicleId);
  } catch (error) {
    console.error('Error deleting vehicle: ', error);
    throw error;
  }
};

// Get a vehicle by ID
export const getVehicle = async (vehicleId: string) => {
  try {
    const vehicleRef = adminFirestore.collection(collectionName).doc(vehicleId);
    const vehicleDoc = await vehicleRef.get();
    if (vehicleDoc.exists) {
      const vehicle = vehicleDoc.data();
      // console.log('Vehicle data:', vehicle);
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