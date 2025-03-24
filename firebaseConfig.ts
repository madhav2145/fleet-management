// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDiTYTJZHxi8Y3EvdhlYzV9ycvsZn1lguA",
    authDomain: "fleet-management-8a230.firebaseapp.com",
    projectId: "fleet-management-8a230",
    storageBucket: "fleet-management-8a230.firebasestorage.app",
    messagingSenderId: "321152688654",
    appId: "1:321152688654:web:47f2df93b36d87af11125f",
    measurementId: "G-4XS75H4R4J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);