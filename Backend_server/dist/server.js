var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// server.ts
import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import bodyParser from 'body-parser';
import cron from 'node-cron';
import { adminFirestore } from './adminfirebaseconfig.js'; // Use adminFirestore for server-side operations
import { getAllVehicles } from './admingetvehicles.js'; // Ensure this returns Vehicle[]
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import fs from 'fs';
import fetch from 'node-fetch';
const app = express();
app.use(bodyParser.json());
// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });
// Function to fetch users and push tokens from Firestore
const fetchUsersAndPushTokens = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usersCollectionRef = adminFirestore.collection('users');
        const snapshot = yield usersCollectionRef.get();
        const users = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        console.log(`Fetched ${users.length} users from Firestore.`);
        return users;
    }
    catch (error) {
        console.error('Error fetching users and push tokens:', error);
        throw error;
    }
});
// Function to send push notifications using Expo's push service
const sendPushNotification = (token, title, body) => __awaiter(void 0, void 0, void 0, function* () {
    const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data: { someData: 'goes here' },
    };
    try {
        const response = yield fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        if (response.ok) {
            console.log(`Notification sent successfully to token: ${token}`);
        }
        else {
            console.error(`Failed to send notification to token: ${token}`);
        }
    }
    catch (error) {
        console.error('Error sending notification:', error);
    }
});
// Function to send notifications based on the user role and module
const sendNotificationsBasedOnRoleAndModule = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield fetchUsersAndPushTokens();
        for (const user of users) {
            const { role, module, pushToken } = user;
            if (!pushToken || pushToken.length === 0) {
                console.log(`No push tokens found for user: ${user.email}`);
                continue;
            }
            if (role === 'admin') {
                console.log(`Sending notifications for all modules to admin: ${user.email}`);
                yield sendNotificationsForModule1(pushToken);
                // await sendNotificationsForModule2(pushToken);
                yield sendNotificationsForModule3(pushToken);
            }
            else if (role === 'user') {
                console.log(`Sending notifications for module ${module} to user: ${user.email}`);
                if (module === 'module_1') {
                    yield sendNotificationsForModule1(pushToken);
                }
                else if (module === 'module_2') {
                    // await sendNotificationsForModule2(pushToken);
                }
                else if (module === 'module_3') {
                    yield sendNotificationsForModule3(pushToken);
                }
            }
        }
    }
    catch (error) {
        console.error('Error sending notifications based on role and module:', error);
    }
});
// Functions to send notifications for each module
// Module 1: Checks if any vehicle's specific expiry field is within the next 30 days
const sendNotificationsForModule1 = (pushTokens) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Sending notifications for Module 1...');
    const today = new Date();
    const next15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from today
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from today
    const filters = [
        { key: 'pollutionExpiry', name: 'Pollution Expiry', expiryRange: next30Days },
        { key: 'insuranceExpiry', name: 'Insurance Expiry', expiryRange: next30Days },
        { key: 'fitnessExpiry', name: 'Fitness Expiry', expiryRange: next30Days },
        { key: 'permitPaidTill1', name: '1-Year Permit Expiry', expiryRange: next30Days },
        { key: 'permitPaidTill2', name: '5-Year Permit Expiry', expiryRange: next30Days },
        { key: 'aitpExpiry', name: 'AITP Expiry', expiryRange: next15Days }, // New filter with 15-day expiry range
    ];
    try {
        const vehicles = yield getAllVehicles();
        console.log(`Fetched ${vehicles.length} vehicles from Firestore.`);
        for (const filter of filters) {
            console.log(`Processing filter: ${filter.name}`);
            const filteredVehicles = vehicles.filter((vehicle) => {
                const expiryValue = vehicle[filter.key];
                if (!expiryValue)
                    return false;
                const expiryDate = new Date(expiryValue);
                return ((expiryDate > today && expiryDate <= filter.expiryRange) || expiryDate <= today);
            });
            const sortedVehicles = filteredVehicles.sort((a, b) => {
                const dateA = new Date(a[filter.key]).getTime();
                const dateB = new Date(b[filter.key]).getTime();
                return dateA - dateB; // Always sort in ascending order
            });
            if (sortedVehicles.length === 0) {
                console.log(`No expiring vehicles found for ${filter.name}.`);
                continue;
            }
            // Send notification for the first vehicle in the sorted list
            const vehicle = sortedVehicles[0];
            console.log(`Sending notification for vehicle ${vehicle.id} (${filter.name})`);
            for (const token of pushTokens) {
                yield sendPushNotification(token, `${filter.name} Alert`, `One of your vehicles' ${filter.name.toLowerCase()} dates is about to expire soon. Please check the app for details.`);
            }
            console.log(`Notification sent for ${filter.name} for vehicle ${vehicle.id}.`);
        }
    }
    catch (error) {
        console.error('Error fetching vehicles for Module 1:', error);
    }
});
// Module 2: Placeholder notification logic
// const sendNotificationsForModule2 = async (pushTokens: string[]): Promise<void> => {
//   // console.log('Sending notifications for Module 2...');
//   // for (const token of pushTokens) {
//   //   await sendPushNotification(
//   //     token,
//   //     'Module 2 Alert',
//   //     'This is a placeholder notification for Module 2.'
//   //   );
//   // }
// };
// Module 3: Placeholder notification logic
const sendNotificationsForModule3 = (pushTokens) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Sending notifications for Module 3...');
    // for (const token of pushTokens) {
    //   await sendPushNotification(
    //     token,
    //     'Module 3 Alert',
    //     'This is a placeholder notification for Module 3.'
    //   );
    // }
});
// Define Express routes
// Route to fetch users
app.get('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield fetchUsersAndPushTokens();
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// Route to send notifications to a specified module
app.post('/api/notifications/:module', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { module } = req.params;
    const { pushTokens } = req.body;
    try {
        if (!pushTokens || pushTokens.length === 0) {
            res.status(400).json({ error: 'Push tokens are required' });
            return;
        }
        if (module === 'module_1') {
            yield sendNotificationsForModule1(pushTokens);
            // } else if (module === 'module_2') {
            //   await sendNotificationsForModule2(pushTokens);
        }
        else if (module === 'module_3') {
            yield sendNotificationsForModule3(pushTokens);
        }
        else {
            res.status(400).json({ error: 'Invalid module specified' });
            return;
        }
        res.status(200).json({ message: `Notifications sent for ${module}` });
    }
    catch (error) {
        console.error(`Error sending notifications for ${module}:`, error);
        res.status(500).json({ error: `Failed to send notifications for ${module}` });
    }
}));
let isJobRunning = false; // Lock to prevent overlapping jobs
// Define an endpoint to trigger notifications manually
app.get('/api/trigger-notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Triggering notifications via /api/trigger-notifications...');
        yield sendNotificationsBasedOnRoleAndModule();
        res.status(200).json({ message: 'Notifications triggered successfully' });
    }
    catch (error) {
        console.error('Error triggering notifications:', error);
        res.status(500).json({ error: 'Failed to trigger notifications' });
    }
}));
// Add a simple ping endpoint
app.get('/ping', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({
            message: 'Server is running!',
        });
    }
    catch (error) {
        console.error('Error in /ping endpoint:', error);
        res.status(500).json({ error: 'Failed to check water and urea levels.' });
    }
}));
// OCR endpoint: accepts an image file upload
app.post('/api/ocr', upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        res.status(400).json({ error: 'No image file uploaded.' });
        return;
    }
    const worker = yield createWorker('eng');   
    try {
        const { data: { text } } = yield worker.recognize(req.file.path);
        yield worker.terminate();
        fs.unlinkSync(req.file.path); // Clean up uploaded file
        res.json({ text });
    }
    catch (error) {
        yield worker.terminate();
        fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'OCR processing failed.' });
    }
}));
// (Optional) Schedule a cron job to automatically send notifications based on a schedule
cron.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    // This will run daily at midnight
    console.log('Running scheduled notification task...');
    yield sendNotificationsBasedOnRoleAndModule();
}));
// Schedule a cron job to check water and urea levels and send notifications at 5:30 PM IST
cron.schedule('0 12 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    // 5:30 PM IST corresponds to 12:00 PM UTC
    console.log('Running scheduled task to check water and urea levels at 5:30 PM IST...');
    try {
        const totalReceivedDoc = yield adminFirestore.collection('waterandurea').doc('totalReceived').get();
        if (!totalReceivedDoc.exists) {
            console.log('Document "totalReceived" not found in waterandurea collection.');
            return;
        }
        const data = totalReceivedDoc.data();
        const totalDistributedUrea = (data === null || data === void 0 ? void 0 : data.totalDistributedUrea) || 0;
        const totalDistributedWater = (data === null || data === void 0 ? void 0 : data.totalDistributedWater) || 0;
        const totalUrea = (data === null || data === void 0 ? void 0 : data.totalUrea) || 0;
        const totalWater = (data === null || data === void 0 ? void 0 : data.totalWater) || 0;
        const remainingUrea = totalUrea - totalDistributedUrea;
        const remainingWater = totalWater - totalDistributedWater;
        console.log(`Remaining Urea: ${remainingUrea}, Remaining Water: ${remainingWater}`);
        if (remainingUrea < 10 || remainingWater < 100) {
            console.log('Low stock detected. Sending notifications for Module 2...');
            const users = yield fetchUsersAndPushTokens();
            const module2Users = users.filter((user) => (user.module === 'module_2' || user.role === 'admin') && user.pushToken.length > 0);
            for (const user of module2Users) {
                for (const token of user.pushToken) {
                    if (remainingUrea < 10) {
                        yield sendPushNotification(token, 'Low Stock Alert', 'Urea stock is running low. Please restock soon.');
                    }
                    if (remainingWater < 100) {
                        yield sendPushNotification(token, 'Low Stock Alert', 'Water stock is running low. Please restock soon.');
                    }
                }
            }
        }
        else {
            console.log('Sufficient stock levels. No notifications sent.');
        }
    }
    catch (error) {
        console.error('Error checking water and urea levels or sending notifications:', error);
    }
}));
cron.schedule('30 10 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Scheduled job: Calling /api/trigger-notifications at 10:30 AM');
        const response = yield fetch('https://fleet-management-backend-kgxo.onrender.com/api/trigger-notifications');
        const data = yield response.json();
        console.log('Trigger notifications response:', data);
    }
    catch (error) {
        console.error('Error calling /api/trigger-notifications:', error);
    }
}));
// Start the Express server
const PORT = 3000;
app.listen(PORT,'0.0.0.0', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is running on port ${PORT}`);
}));
