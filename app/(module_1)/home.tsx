import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, BackHandler, Alert } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllVehicles } from '../../backend/vehicleService';
import { addDays, isBefore, isAfter } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, Firestore } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      style={styles.statCardContainer}
    >
      <Animated.View
        style={[
          styles.statCard,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.statHeader}>
          <Ionicons name={icon} size={24} color="#0A3D91" />
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const Home: React.FC = () => {
  interface Vehicle {
    id: string;
    [key: string]: any;
  }

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null); // State to store the push token
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to store error messages
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    console.log('useEffect is being called...');
    const requestNotifications = async () => {
      console.log('Calling registerForPushNotificationsAsync...');
      await registerForPushNotificationsAsync();
    };

    requestNotifications();
  }, []);

  useEffect(() => {
    const backAction = () => {
      const currentRoute = segments.join('/');
      if (currentRoute === '(module_1)/home') {
        router.replace('/dashboard');
        return true;
      } else {
        router.replace('/(module_1)/home');
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [segments]);

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

  const fetchVehicles = async () => {
    try {
      const data = await getAllVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchVehicles();
    }, [])
  );

  const filterVehiclesByExpiry = (expiryField: string) => {
    const today = new Date();
    const next30Days = addDays(today, 30);
    return vehicles.filter((vehicle) => {
      const expiryDate = new Date(vehicle[expiryField]);
      return (
        (isBefore(expiryDate, next30Days) && isAfter(expiryDate, today)) ||
        isBefore(expiryDate, today)
      );
    }).length.toString();
  };

  const handleStatCardPress = (type: string) => {
    router.push({
      pathname: '/(module_1)/search',
      params: { filter: type },
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('hasRequestedNotifications'); // Reset the flag on logout
      router.replace('/');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Fleet Dashboard</Text>
        </View>

        <TouchableOpacity
          style={styles.totalVehiclesCard}
          onPress={() => router.push('/(module_1)/search')}
        >
          <Ionicons name="bus" size={32} color="#FFFFFF" />
          <View style={styles.totalVehiclesContent}>
            <Text style={styles.totalVehiclesLabel}>Total Fleet Size</Text>
            <Text style={styles.totalVehiclesValue}>{vehicles.length}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Upcoming Renewals</Text>

        <View style={styles.gridContainer}>
          <View style={styles.row}>
            <StatCard
              label="Pollution Expiry"
              value={filterVehiclesByExpiry('pollutionExpiry')}
              icon="calendar"
              onPress={() => handleStatCardPress('POLLUTION')}
            />
            <StatCard
              label="Insurance Expiry"
              value={filterVehiclesByExpiry('insuranceExpiry')}
              icon="shield-checkmark"
              onPress={() => handleStatCardPress('INSURANCE')}
            />
          </View>

          <View style={styles.row}>
            <StatCard
              label="AITP Expiry"
              value={filterVehiclesByExpiry('aitpExpiry')}
              icon="document-text"
              onPress={() => handleStatCardPress('AITP')}
            />
            <StatCard
              label="Fitness Expiry"
              value={filterVehiclesByExpiry('fitnessExpiry')}
              icon="medal"
              onPress={() => handleStatCardPress('FITNESS')}
            />
          </View>

          <View style={styles.row}>
            <StatCard
              label="1-Year Permit Expiry"
              value={filterVehiclesByExpiry('permitPaidTill1')}
              icon="ticket"
              onPress={() => handleStatCardPress('PERMIT_1_YEAR')}
            />
            <StatCard
              label="5-Year Permit Expiry"
              value={filterVehiclesByExpiry('permitPaidTill2')}
              icon="ticket"
              onPress={() => handleStatCardPress('PERMIT_5_YEAR')}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(module_1)/addvehicle')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Add New Vehicle</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  content: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  totalVehiclesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A3D91',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  totalVehiclesContent: {
    marginLeft: 16,
  },
  totalVehiclesLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  totalVehiclesValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  statCardContainer: {
    width: '48%',
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#5A7184',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D01C1F',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#D01C1F',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A3D91',
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 14,
    color: '#5A7184',
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFE4E6',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorText: {
    fontSize: 14,
    color: '#D01C1F',
    fontWeight: 'bold',
  },
});

export default Home;

function customDoc(firestore: Firestore, arg1: string, uid: string) {
  throw new Error('Function not implemented.');
}
