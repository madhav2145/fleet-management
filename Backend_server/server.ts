// server.ts
import express from 'express';
import { Request, Response } from 'express';
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

// Define types for better type safety
interface User {
  id: string;
  email: string;
  role: string;
  module: string;
  pushToken: string[];
}

// The Vehicle interface defines an id plus any additional dynamic properties.
interface Vehicle {
  id: string;
  [key: string]: string | Date | undefined;
}

// Function to fetch users and push tokens from Firestore
const fetchUsersAndPushTokens = async (): Promise<User[]> => {
  try {
    const usersCollectionRef = adminFirestore.collection('users');
    const snapshot = await usersCollectionRef.get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
    console.log(`Fetched ${users.length} users from Firestore.`);
    return users;
  } catch (error) {
    console.error('Error fetching users and push tokens:', error);
    throw error;
  }
};

// Function to send push notifications using Expo's push service
const sendPushNotification = async (token: string, title: string, body: string): Promise<void> => {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log(`Notification sent successfully to token: ${token}`);
    } else {
      console.error(`Failed to send notification to token: ${token}`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Function to send notifications based on the user role and module
const sendNotificationsBasedOnRoleAndModule = async (): Promise<void> => {
  try {
    const users = await fetchUsersAndPushTokens();

    for (const user of users) {
      const { role, module, pushToken } = user;
      if (!pushToken || pushToken.length === 0) {
        console.log(`No push tokens found for user: ${user.email}`);
        continue;
      }

      if (role === 'admin') {
        console.log(`Sending notifications for all modules to admin: ${user.email}`);
        await sendNotificationsForModule1(pushToken);
        // await sendNotificationsForModule2(pushToken);
        await sendNotificationsForModule3(pushToken);
      } else if (role === 'user') {
        console.log(`Sending notifications for module ${module} to user: ${user.email}`);
        if (module === 'module_1') {
          await sendNotificationsForModule1(pushToken);
        } else if (module === 'module_2') {
          // await sendNotificationsForModule2(pushToken);
        } else if (module === 'module_3') {
          await sendNotificationsForModule3(pushToken);
        }
      }
    }
  } catch (error) {
    console.error('Error sending notifications based on role and module:', error);
  }
};

// Functions to send notifications for each module

// Module 1: Checks if any vehicle's specific expiry field is within the next 30 days
const sendNotificationsForModule1 = async (pushTokens: string[]): Promise<void> => {
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
    const vehicles: Vehicle[] = await getAllVehicles();
    console.log(`Fetched ${vehicles.length} vehicles from Firestore.`);

    for (const filter of filters) {
      console.log(`Processing filter: ${filter.name}`);
      const filteredVehicles = vehicles.filter((vehicle) => {
        const expiryValue = vehicle[filter.key];
        if (!expiryValue) return false;

        const expiryDate = new Date(expiryValue as string);
        return (
          (expiryDate > today && expiryDate <= filter.expiryRange) || expiryDate <= today
        );
      });

      const sortedVehicles = filteredVehicles.sort((a, b) => {
        const dateA = new Date(a[filter.key] as string).getTime();
        const dateB = new Date(b[filter.key] as string).getTime();
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
        await sendPushNotification(
          token,
          `${filter.name} Alert`,
          `One of your vehicles' ${filter.name.toLowerCase()} dates is about to expire soon. Please check the app for details.`
        );
      }

      console.log(`Notification sent for ${filter.name} for vehicle ${vehicle.id}.`);
    }
  } catch (error) {
    console.error('Error fetching vehicles for Module 1:', error);
  }
};

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
const sendNotificationsForModule3 = async (pushTokens: string[]): Promise<void> => {
  console.log('Sending notifications for Module 3...');
  // for (const token of pushTokens) {
  //   await sendPushNotification(
  //     token,
  //     'Module 3 Alert',
  //     'This is a placeholder notification for Module 3.'
  //   );
  // }
};

// Define Express routes

// Route to fetch users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await fetchUsersAndPushTokens();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Route to send notifications to a specified module
app.post('/api/notifications/:module', async (req: Request, res: Response): Promise<void> => {
  const { module } = req.params;
  const { pushTokens } = req.body;

  try {
    if (!pushTokens || pushTokens.length === 0) {
      res.status(400).json({ error: 'Push tokens are required' });
      return;
    }

    if (module === 'module_1') {
      await sendNotificationsForModule1(pushTokens);
    // } else if (module === 'module_2') {
    //   await sendNotificationsForModule2(pushTokens);
    } else if (module === 'module_3') {
      await sendNotificationsForModule3(pushTokens);
    } else {
      res.status(400).json({ error: 'Invalid module specified' });
      return;
    }

    res.status(200).json({ message: `Notifications sent for ${module}` });
  } catch (error) {
    console.error(`Error sending notifications for ${module}:`, error);
    res.status(500).json({ error: `Failed to send notifications for ${module}` });
  }
});
let isJobRunning = false; // Lock to prevent overlapping jobs

// Define an endpoint to trigger notifications manually
app.get('/api/trigger-notifications', async (req: Request, res: Response) => {
  
  try {
    console.log('Triggering notifications via /api/trigger-notifications...');
    await sendNotificationsBasedOnRoleAndModule();
    res.status(200).json({ message: 'Notifications triggered successfully' });
  } catch (error) {
    console.error('Error triggering notifications:', error);
    res.status(500).json({ error: 'Failed to trigger notifications' });
  }
});

// Add a simple ping endpoint
app.get('/ping', async (req: Request, res: Response) => {
  try {
    
    res.status(200).json({
      message: 'Server is running!',
     
    });
  } catch (error) {
    console.error('Error in /ping endpoint:', error);
    res.status(500).json({ error: 'Failed to check water and urea levels.' });
  }
});

// OCR endpoint: accepts an image file upload
app.post('/api/ocr', upload.single('image'), async (req: express.Request & { file?: Express.Multer.File }, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file uploaded.' });
    return;
  }

  const worker = await createWorker('eng');
  try {
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();
    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.json({ text });
  } catch (error) {
    await worker.terminate();
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'OCR processing failed.' });
  }
});

// (Optional) Schedule a cron job to automatically send notifications based on a schedule
cron.schedule('0 0 * * *', async () => {
  // This will run daily at midnight
  console.log('Running scheduled notification task...');
  await sendNotificationsBasedOnRoleAndModule();
});
// Schedule a cron job to check water and urea levels and send notifications at 5:30 PM IST
cron.schedule('0 12 * * *', async () => {
  // 5:30 PM IST corresponds to 12:00 PM UTC
  console.log('Running scheduled task to check water and urea levels at 5:30 PM IST...');

  try {
    const totalReceivedDoc = await adminFirestore.collection('waterandurea').doc('totalReceived').get();

    if (!totalReceivedDoc.exists) {
      console.log('Document "totalReceived" not found in waterandurea collection.');
      return;
    }

    const data = totalReceivedDoc.data();
    const totalDistributedUrea = data?.totalDistributedUrea || 0;
    const totalDistributedWater = data?.totalDistributedWater || 0;
    const totalUrea = data?.totalUrea || 0;
    const totalWater = data?.totalWater || 0;

    const remainingUrea = totalUrea - totalDistributedUrea;
    const remainingWater = totalWater - totalDistributedWater;

    console.log(`Remaining Urea: ${remainingUrea}, Remaining Water: ${remainingWater}`);

    if (remainingUrea < 10 || remainingWater < 100) {
      console.log('Low stock detected. Sending notifications for Module 2...');
      const users = await fetchUsersAndPushTokens();
      const module2Users = users.filter(
        (user) => (user.module === 'module_2' || user.role === 'admin') && user.pushToken.length > 0
      );
      
      for (const user of module2Users) {
        for (const token of user.pushToken) {
          if (remainingUrea < 10) {
            await sendPushNotification(
              token,
              'Low Stock Alert',
              'Urea stock is running low. Please restock soon.'
            );
          }
          if (remainingWater < 100) {
            await sendPushNotification(
              token,
              'Low Stock Alert',
              'Water stock is running low. Please restock soon.'
            );
          }
        }
      }
    } else {
      console.log('Sufficient stock levels. No notifications sent.');
    }
  } catch (error) {
    console.error('Error checking water and urea levels or sending notifications:', error);
  }
});
cron.schedule('30 10 * * *', async () => {
  try {
    console.log('Scheduled job: Calling /api/trigger-notifications at 10:30 AM');
    const response = await fetch('https://fleet-management-backend-kgxo.onrender.com/api/trigger-notifications');
    const data = await response.json();
    console.log('Trigger notifications response:', data);
  } catch (error) {
    console.error('Error calling /api/trigger-notifications:', error);
  }
});


// Start the Express server
const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);


});