import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, SortAsc, SortDesc } from 'lucide-react-native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import DetailsPage from '../components/details_2'; // Import the DetailsPage component
import { Picker } from '@react-native-picker/picker'; // Import Picker
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchResources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFilter, setSelectedFilter] = useState<'alphabetical' | 'water' | 'urea'>('alphabetical');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null); // Track selected resource ID

  // Fetch resources in real-time using Firestore's onSnapshot
  useEffect(() => {
    const q = query(collection(firestore, 'water&urea'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResources(data);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Request notification permissions
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Notification Permission Status:', status);
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to enable notifications to receive alerts.');
    }
  };

  // Test notification function
  const testNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification Permission Status:', status);
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to enable notifications to receive alerts.');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification to verify functionality.',
        },
        trigger: null, // Send immediately
      });
      console.log('Test notification sent successfully.');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  // Check for vehicles with low resources and send notifications
  const checkAndSendNotifications = useCallback(async () => {
    const today = new Date();
    const uniqueKey = 'lastNotificationDate_Module2'; // Unique key for Module 2

    // Retrieve the last notification date from AsyncStorage
    const lastNotificationDate = await AsyncStorage.getItem(uniqueKey);
    console.log('Last Notification Date for Module 2:', lastNotificationDate);
    const lastNotification = lastNotificationDate ? new Date(lastNotificationDate) : null;

    // Check if a notification was already sent today
    if (lastNotification && lastNotification.toDateString() === today.toDateString()) {
      console.log('Notification already sent today for Module 2.');
      return; // Exit if a notification was already sent today
    }

    // Check if any vehicle has low resources
    const lowResourceVehicles = resources.filter((resource) => {
      const remainingWater = parseInt(resource.remainingWaterPackets || '0');
      const remainingUrea = parseInt(resource.remainingUreaPackets || '0');
      return remainingWater < 100 || remainingUrea < 10; // Vehicles with low water or urea
    });
    console.log('Low Resource Vehicles:', lowResourceVehicles);

    if (lowResourceVehicles.length > 0) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Low Resource Alert',
            body: 'Some vehicles have low resources. Please check the app for details.',
          },
          trigger: null, // Send immediately
        });
        console.log('Notification scheduled successfully for Module 2.');

        // Save today's date as the last notification date
        await AsyncStorage.setItem(uniqueKey, today.toISOString());
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    } else {
      console.log('No vehicles with low resources found in Module 2.');
    }
  }, [resources]);

  useEffect(() => {
    requestNotificationPermissions();
    checkAndSendNotifications();
  }, [resources]);

  // Filter and sort resources based on selected filter, search query, and sort order
  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources;

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter((resource) =>
        resource.vehicleNo?.toUpperCase().includes(searchQuery.toUpperCase())
      );
    }

    // Apply selected filter
    if (selectedFilter === 'water') {
      filtered = filtered.filter((resource) => {
        const remainingWater = parseInt(resource.remainingWaterPackets || '0');
        return remainingWater < 100; // Show vehicles with less than 100 water packets
      });
    } else if (selectedFilter === 'urea') {
      filtered = filtered.filter((resource) => {
        const remainingUrea = parseInt(resource.remainingUreaPackets || '0');
        return remainingUrea < 10; // Show vehicles with less than 10 urea buckets
      });
    } else {
      // Default filter: Show all vehicles with low resources
      filtered = filtered.filter((resource) => {
        const remainingWater = parseInt(resource.remainingWaterPackets || '0');
        const remainingUrea = parseInt(resource.remainingUreaPackets || '0');
        return remainingWater < 100 || remainingUrea < 10;
      });
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let valueA, valueB;

      if (selectedFilter === 'alphabetical') {
        valueA = a.vehicleNo?.toUpperCase() || '';
        valueB = b.vehicleNo?.toUpperCase() || '';
        return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else if (selectedFilter === 'water') {
        valueA = parseInt(a.remainingWaterPackets || '0');
        valueB = parseInt(b.remainingWaterPackets || '0');
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      } else if (selectedFilter === 'urea') {
        valueA = parseInt(a.remainingUreaPackets || '0');
        valueB = parseInt(b.remainingUreaPackets || '0');
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

    return filtered;
  }, [searchQuery, sortOrder, selectedFilter, resources]);

  // Handle back action from the details page
  const handleBack = () => {
    setSelectedResourceId(null); // Reset selected resource ID to go back to the search page
  };

  // If a resource is selected, render the DetailsPage
  if (selectedResourceId) {
    return <DetailsPage id={selectedResourceId} onBack={handleBack} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Resources</Text>

      <View style={styles.searchContainer}>
        <Search size={20} color="#0A3D91" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Vehicle Number"
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedFilter}
            onValueChange={(itemValue) => setSelectedFilter(itemValue as 'alphabetical' | 'water' | 'urea')}
            style={styles.picker}
          >
            <Picker.Item label="Alphabetical" value="alphabetical" />
            <Picker.Item label="Water Packets" value="water" />
            <Picker.Item label="Urea Buckets" value="urea" />
          </Picker>
        </View>
      </View>

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
          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.testButton} onPress={testNotification}>
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity> */}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A3D91" />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedResources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No resources found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => setSelectedResourceId(item.id)} // Set the selected resource ID
            >
              <Text style={styles.vehicleNo}>{item.vehicleNo || 'N/A'}</Text>
              <Text style={styles.resourceDetails}>
                Water Packets: {item.remainingWaterPackets || 0} remaining
              </Text>
              <Text style={styles.resourceDetails}>
                Urea Packets: {item.remainingUreaPackets || 0} remaining
              </Text>
            </TouchableOpacity>
          )}
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#2D3748',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    backgroundColor: '#FFFFFF', // Ensure the background is white
    overflow: 'hidden', // Prevent content overflow
    height: 56, // Set a fixed height for the dropdown
    justifyContent: 'center', // Center the dropdown text vertically
    paddingHorizontal: 8, // Add padding for better spacing
    elevation: 2, // Add shadow for better visibility
  },
  picker: {
    height: '100%', // Ensure the picker fills the container height
    width: '100%', // Ensure the picker fills the container width
    fontSize: 16, // Set a readable font size
    color: '#2D3748', // Set the text color
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
  testButton: {
    backgroundColor: '#0A3D91',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  vehicleNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A3D91',
    marginBottom: 8,
  },
  resourceDetails: {
    fontSize: 14,
    color: '#5A7184',
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
});

export default SearchResources;