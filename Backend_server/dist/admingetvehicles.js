var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { adminFirestore } from './adminfirebaseconfig.js'; // Use adminFirestore for server-side operations
const collectionName = 'vehicles';
// Add a new vehicle
export const addVehicle = (vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docRef = yield adminFirestore.collection(collectionName).add(vehicleData);
        // console.log('Vehicle added with ID: ', docRef.id);
        return docRef.id;
    }
    catch (error) {
        console.error('Error adding vehicle: ', error);
        throw error;
    }
});
// Get all vehicles
export const getAllVehicles = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const querySnapshot = yield adminFirestore.collection(collectionName).get();
        const vehicles = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // console.log('All vehicles:', vehicles);
        return vehicles;
    }
    catch (error) {
        console.error('Error getting vehicles: ', error);
        throw error;
    }
});
// Update a vehicle
export const updateVehicle = (vehicleId, updatedData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehicleRef = adminFirestore.collection(collectionName).doc(vehicleId);
        yield vehicleRef.update(updatedData);
        // console.log('Vehicle updated with ID: ', vehicleId);
    }
    catch (error) {
        console.error('Error updating vehicle: ', error);
        throw error;
    }
});
// Delete a vehicle
export const deleteVehicle = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehicleRef = adminFirestore.collection(collectionName).doc(vehicleId);
        yield vehicleRef.delete();
        // console.log('Vehicle deleted with ID: ', vehicleId);
    }
    catch (error) {
        console.error('Error deleting vehicle: ', error);
        throw error;
    }
});
// Get a vehicle by ID
export const getVehicle = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehicleRef = adminFirestore.collection(collectionName).doc(vehicleId);
        const vehicleDoc = yield vehicleRef.get();
        if (vehicleDoc.exists) {
            const vehicle = vehicleDoc.data();
            // console.log('Vehicle data:', vehicle);
            return vehicle;
        }
        else {
            console.log('No such vehicle!');
            return null;
        }
    }
    catch (error) {
        console.error('Error getting vehicle: ', error);
        throw error;
    }
});
