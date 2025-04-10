import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SortAsc, SortDesc } from 'lucide-react-native';
import { getAllVehicles } from '../../backend/vehicleService';
import { addDays, isBefore, isAfter } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Details from '../components/details_1';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage to persist the last notification date
import messaging from '@react-native-firebase/messaging';

interface Vehicle {
  id: string;
  vehicleNo: string;
  vehicleType: string;
  owner: string;
  registrationDate: string;
  pollutionExpiry: string;
  aitpExpiry: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitPaidTill1: string;
  permitPaidTill2: string;
  taxPaidTill: string;
}
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const filterParamToKey: Record<string, keyof Vehicle | null> = {
  POLLUTION: 'pollutionExpiry',
  INSURANCE: 'insuranceExpiry',
  AITP: 'aitpExpiry',
  FITNESS: 'fitnessExpiry',
  PERMIT_1_YEAR: 'permitPaidTill1',
  PERMIT_5_YEAR: 'permitPaidTill2',
};

const NotificationsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<keyof Vehicle | null>('pollutionExpiry');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Fetch vehicles from the backend
  const fetchVehicles = async () => {
    try {
      const data = await getAllVehicles();
      setVehicles(data as Vehicle[]);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Request notification permissions
  const requestNotificationPermissions = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permissions granted.');
    } else {
      Alert.alert('Permission Denied', 'You need to enable notifications to receive alerts.');
    }
  };

  // Get FCM token
  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      // Send the token to your backend server for later use
    } catch (error) {
      console.error('Error retrieving FCM token:', error);
    }
  };

  // Schedule notifications for vehicle expiry
  const scheduleVehicleExpiryNotifications = async () => {
    const today = new Date();
    const next30Days = addDays(today, 30);
    const next15Days = addDays(today, 15); // For AITP expiry
    const uniqueKey = 'lastNotificationDate_Module1'; // Unique key for Module 1

    // Retrieve the last notification date from AsyncStorage
    const lastNotificationDate = await AsyncStorage.getItem(uniqueKey);
    const lastNotification = lastNotificationDate ? new Date(lastNotificationDate) : null;

    // Check if a notification was already sent today
    if (lastNotification && lastNotification.toDateString() === today.toDateString()) {
      console.log('Notification already sent today for Module 1.');
      return; // Exit if a notification was already sent today
    }

    // Check if any vehicle is about to expire
    let isVehicleExpiring = false;

    for (const [key, filterKey] of Object.entries(filterParamToKey)) {
      if (!filterKey) continue; // Skip null filters

      const expiryThreshold = key === 'AITP' ? next15Days : next30Days; // Use 15 days for AITP, 30 days for others

      isVehicleExpiring = vehicles.some((vehicle) => {
        const expiryDate = vehicle[filterKey] ? new Date(vehicle[filterKey]) : null;
        return expiryDate && isBefore(expiryDate, expiryThreshold) && isAfter(expiryDate, today);
      });

      if (isVehicleExpiring) {
        break; // Stop searching if a vehicle is found
      }
    }

    if (isVehicleExpiring) {
      try {
        await messaging().sendMessage({
          notification: {
            title: 'Expiring Vehicles Alert',
            body: 'Some of your vehicles are about to expire soon. Please check the app for details.',
          },
          fcmOptions: {
            analyticsLabel: 'ExpiringVehiclesAlert',
          },
        });
        console.log('Notification scheduled for expiring vehicles in Module 1.');

        // Save today's date as the last notification date
        await AsyncStorage.setItem(uniqueKey, today.toISOString());
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    } else {
      console.log('No vehicles are expiring soon in Module 1.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isNotificationChecked = false;

      const checkNotifications = async () => {
        if (!isNotificationChecked) {
          isNotificationChecked = true;
          await scheduleVehicleExpiryNotifications();
        }
      };

      fetchVehicles();
      requestNotificationPermissions();
      getFCMToken();
      checkNotifications();
    }, [scheduleVehicleExpiryNotifications])
  );

  useEffect(() => {
    if (vehicles.length > 0) {
      scheduleVehicleExpiryNotifications();
    }
  }, [vehicles]); // Removed `scheduleVehicleExpiryNotifications` from dependencies

  // Handle foreground notifications
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('New Notification', remoteMessage.notification?.body || 'You have a new message.');
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Request notification permissions and get FCM token
    requestNotificationPermissions();
    getFCMToken();

    // Schedule notifications for vehicle expiry
    scheduleVehicleExpiryNotifications();
  }, []);

  const handleFilterChange = (value: keyof Vehicle | null) => {
    setSelectedFilter(value);
    setSortOrder('asc');
  };

  const filteredAndSortedVehicles = useMemo(() => {
    const today = new Date();
    const next30Days = addDays(today, 30);

    let filtered = vehicles.filter((vehicle) =>
      searchQuery ? vehicle.vehicleNo.includes(searchQuery.toUpperCase()) : true
    );

    filtered = filtered.filter((vehicle) => {
      const expiryDate = selectedFilter ? new Date(vehicle[selectedFilter]) : new Date();
      return (isBefore(expiryDate, next30Days) && isAfter(expiryDate, today)) || isBefore(expiryDate, today);
    });

    if (selectedFilter) {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a[selectedFilter!]).getTime();
        const dateB = new Date(b[selectedFilter!]).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  }, [searchQuery, selectedFilter, sortOrder, vehicles]);

  if (selectedVehicleId) {
    return <Details id={selectedVehicleId} onBack={() => setSelectedVehicleId(null)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expiring Vehicles</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Vehicle Number"
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Picker
        selectedValue={selectedFilter}
        onValueChange={handleFilterChange}
        style={styles.picker}
      >
        {Object.entries(filterParamToKey).map(([key, value]) => (
          <Picker.Item key={key} label={key.replace(/_/g, ' ')} value={value} />
        ))}
      </Picker>

      {selectedFilter && (
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? (
            <SortAsc size={20} color="#0A3D91" />
          ) : (
            <SortDesc size={20} color="#0A3D91" />
          )}
          <Text style={styles.sortButtonText}>
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A3D91" />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedVehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedFilter ? 'No expiring vehicles found' : 'No vehicles found'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vehicleCard}
              onPress={() => setSelectedVehicleId(item.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.vehicleNo}>{item.vehicleNo}</Text>
                <Text style={styles.vehicleType}>{item.vehicleType}</Text>
              </View>
              <Text style={styles.owner}>Owner: {item.owner}</Text>
              {selectedFilter && (
                <Text style={styles.expiryDate}>
                  Expiry: {new Date(item[selectedFilter]).toLocaleDateString()}
                </Text>
              )}
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <Text style={styles.totalVehiclesText}>
              Showing {filteredAndSortedVehicles.length} of {vehicles.length} vehicles
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A3D91',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#2D3748',
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
  },
  sortButtonText: {
    marginLeft: 8,
    color: '#2D3748',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vehicleNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  vehicleType: {
    fontSize: 14,
    color: '#5A7184',
    textTransform: 'capitalize',
  },
  owner: {
    fontSize: 14,
    color: '#5A7184',
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 14,
    color: '#D01C1F',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#5A7184',
    textAlign: 'center',
  },
  totalVehiclesText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});

export default NotificationsPage;