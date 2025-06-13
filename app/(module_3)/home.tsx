import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, BackHandler, Alert } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { collection, query, where, getDocs, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { firestore, auth } from '../../firebaseConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const Home: React.FC = () => {
  const router = useRouter();
  const segments = useSegments(); // Get the current route segments
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [stats, setStats] = useState({
    cleanedYesterday: 0,
    notCleaned3Days: 0,
    notCleaned4Days: 0,
    unusableItems: 0,
  });

  const [pushToken, setPushToken] = useState<string | null>(null); // State to store the push token
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to store error messages

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const fetchStats = async () => {
      try {
        const cleanedYesterdayQuery = query(
          collection(firestore, 'vehicles'),
          where('lastCleanedDate', '==', getYesterdayDate())
        );
        const cleanedYesterdaySnapshot = await getDocs(cleanedYesterdayQuery);
        const cleanedYesterday = cleanedYesterdaySnapshot.size;

        const notCleaned3DaysQuery = query(
          collection(firestore, 'vehicles'),
          where('lastCleanedDate', '<=', getPastDate(3))
        );
        const notCleaned3DaysSnapshot = await getDocs(notCleaned3DaysQuery);
        const notCleaned3Days = notCleaned3DaysSnapshot.size;

        const notCleaned4DaysQuery = query(
          collection(firestore, 'vehicles'),
          where('lastCleanedDate', '<=', getPastDate(4))
        );
        const notCleaned4DaysSnapshot = await getDocs(notCleaned4DaysQuery);
        const notCleaned4Days = notCleaned4DaysSnapshot.size;

        const unusableItemsQuery = query(
          collection(firestore, 'vehicles'),
          where('unusableItemsReported', '==', true)
        );
        const unusableItemsSnapshot = await getDocs(unusableItemsQuery);
        const unusableItems = unusableItemsSnapshot.size;

        setStats({
          cleanedYesterday,
          notCleaned3Days,
          notCleaned4Days,
          unusableItems,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const backAction = () => {
      const currentRoute = segments.join('/');
      if (currentRoute === '(module_3)/home') {
        router.replace('/dashboard');
        return true;
      } else {
        router.replace('/(module_3)/home');
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [segments]);

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      try {
        console.log('registerForPushNotificationsAsync is being called...');

        if (!Device.isDevice) {
          setErrorMessage('Push notifications are only supported on physical devices.');
          console.log('Push notifications are not supported on this device.');
          return;
        }

        // Check existing notification permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('Existing notification permission status:', existingStatus);

        let finalStatus = existingStatus;

        // Request permissions if not already granted
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log('New notification permission status:', finalStatus);
        }

        // If permissions are still not granted, show an error
        if (finalStatus !== 'granted') {
          setErrorMessage('Failed to get push token for push notifications. Please grant notification permissions.');
          console.log('Notification permissions not granted.');
          return;
        }

        // Get the Expo push token
        const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Generated Expo Push Token:', expoPushToken);

        setPushToken(expoPushToken); // Save the push token to state
        console.log('Push token saved to state:', expoPushToken);

        setErrorMessage(null); // Clear any previous error messages

        // Save the token to Firestore
        const user = auth.currentUser;
        if (!user) {
          setErrorMessage('No logged-in user found.');
          console.log('No logged-in user found.');
          return;
        }

        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(
          userRef,
          { pushToken: arrayUnion(expoPushToken) },
          { merge: true }
        );
        console.log('Expo push token added successfully in Firestore.');
      } catch (error) {
        console.error('Error registering for push notifications:', error);
        setErrorMessage('An error occurred while generating the push token.');
      }
    };

    registerForPushNotificationsAsync();
  }, []);

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const getPastDate = (days: number) => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    return pastDate.toISOString().split('T')[0];
  };

  const handleNavigation = (type: string) => {
    router.push(`/components/details_3?type=${type}`);
  };

  const handleAddVehicle = () => {
    router.push('/(module_3)/addvehicle');
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Laundry Dashboard</Text>
        </View>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => handleNavigation('cleanedYesterday')}
          >
            <Text style={styles.statLabel}>Cleaned Yesterday</Text>
            <Text style={styles.statValue}>{stats.cleanedYesterday}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => handleNavigation('notCleaned3Days')}
          >
            <Text style={styles.statLabel}>Not Cleaned {'>'} 3 Days</Text>
            <Text style={styles.statValue}>{stats.notCleaned3Days}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => handleNavigation('notCleaned4Days')}
          >
            <Text style={styles.statLabel}>Not Cleaned {'>'} 4 Days</Text>
            <Text style={styles.statValue}>{stats.notCleaned4Days}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => handleNavigation('unusableItems')}
          >
            <Text style={styles.statLabel}>Unusable Items</Text>
            <Text style={styles.statValue}>{stats.unusableItems}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle}>
          <Text style={styles.addButtonText}>Add Vehicle</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7', // Slightly lighter background for better contrast
  },
  content: {
    padding: 20, // Increased padding for better spacing
    paddingTop: 30, // Extra padding at the top
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the title
    alignItems: 'center',
    marginBottom: 30, // Increased margin for better spacing
    paddingBottom: 15, // Add padding at the bottom
    borderBottomWidth: 1, // Add a subtle border
    borderBottomColor: '#D8E1E8', // Light border color
  },
  title: {
    fontSize: 28, // Larger font size
    fontWeight: 'bold',
    color: '#0A3D91',
    textAlign: 'center',
    letterSpacing: 0.5, // Slight letter spacing for better readability
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 2, // Small margin to ensure cards align properly
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // More rounded corners
    padding: 20, // More padding inside cards
    width: '48%',
    marginBottom: 20, // More space between rows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, // Slightly larger shadow offset
    shadowOpacity: 0.12, // More subtle shadow
    shadowRadius: 10, // Larger shadow radius for softer shadow
    elevation: 5, // Increased elevation for Android
    alignItems: 'center',
    borderWidth: 1, // Add a subtle border
    borderColor: '#F0F0F0', // Very light border color
  },
  statLabel: {
    fontSize: 15, // Slightly larger font
    fontWeight: '500', // Medium weight for better readability
    color: '#445A74', // Slightly darker for better contrast
    textAlign: 'center',
    marginBottom: 12, // More space between label and value
  },
  statValue: {
    fontSize: 28, // Larger value for emphasis
    fontWeight: 'bold',
    color: '#D01C1F',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#D01C1F',
    borderRadius: 12, // More rounded corners
    paddingVertical: 15, // Taller button
    paddingHorizontal: 30, // Wider button
    alignItems: 'center',
    marginTop: 30, // More space above button
    alignSelf: 'center',
    shadowColor: '#D01C1F', // Shadow matching button color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6, // Increased elevation for Android
    width: '80%', // Set width to make button more prominent
    maxWidth: 300, // Maximum width to maintain good proportions
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18, // Larger text
    fontWeight: 'bold',
    letterSpacing: 0.5, // Slight letter spacing
  },
});

export default Home;