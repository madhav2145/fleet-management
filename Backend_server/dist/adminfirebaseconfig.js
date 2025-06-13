import admin from 'firebase-admin';
import serviceAccount from './fleet-management-8a230-firebase-adminsdk-fbsvc-519dbddd6a.json' assert { type: 'json' }; // Adjust the path to your service account JSON file
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://fleet-management-8a230.firebaseio.com',
});
export const adminFirestore = admin.firestore();
