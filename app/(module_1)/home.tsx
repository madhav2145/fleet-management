import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, BackHandler, Alert } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Bus, Calendar, Shield, FileCheck, Award, Ticket, PlusCircle } from 'lucide-react-native';
import { getAllVehicles } from '../../backend/vehicleService';
import { addDays, isBefore, isAfter } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  onPress: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, onPress }) => {
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
          <Icon size={24} color="#0A3D91" />
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const segments = useSegments(); // Get the current route segments

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const backAction = () => {
      const currentRoute = segments.join('/'); // Get the current route as a string

      if (currentRoute === '(module_1)/home') {
        // If on the home page, show the minimize app dialog
        Alert.alert('Minimize App', 'Do you want to minimize the app?', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => BackHandler.exitApp(), // Minimize the app
          },
        ]);
        return true; // Prevent default back button behavior
      } else {
        // Navigate back to the home page
        router.replace('/(module_1)/home');
        return true; // Prevent default back button behavior
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup the event listener
  }, [segments]);

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
      pathname: '/(module_1)/search', // Ensure the correct path to the search page
      params: { filter: type }, // Pass the filter parameter
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
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
          <Bus size={32} color="#FFFFFF" />
          <View style={styles.totalVehiclesContent}>
            <Text style={styles.totalVehiclesLabel}>Total Fleet Size</Text>
            <Text style={styles.totalVehiclesValue}>{vehicles.length}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Upcoming Renewals</Text>

        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.row}>
            <StatCard
              label="Pollution Expiry"
              value={filterVehiclesByExpiry('pollutionExpiry')}
              icon={Calendar}
              onPress={() => handleStatCardPress('POLLUTION')} // Correct filter type
            />
            <StatCard
              label="Insurance Expiry"
              value={filterVehiclesByExpiry('insuranceExpiry')}
              icon={Shield}
              onPress={() => handleStatCardPress('INSURANCE')} // Correct filter type
            />
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <StatCard
              label="AITP Expiry"
              value={filterVehiclesByExpiry('aitpExpiry')}
              icon={FileCheck}
              onPress={() => handleStatCardPress('AITP')} // Correct filter type
            />
            <StatCard
              label="Fitness Expiry"
              value={filterVehiclesByExpiry('fitnessExpiry')}
              icon={Award}
              onPress={() => handleStatCardPress('FITNESS')} // Correct filter type
            />
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <StatCard
              label="1-Year Permit Expiry"
              value={filterVehiclesByExpiry('permitPaidTill1')}
              icon={Ticket}
              onPress={() => handleStatCardPress('PERMIT_1_YEAR')} // Correct filter type
            />
            <StatCard
              label="5-Year Permit Expiry"
              value={filterVehiclesByExpiry('permitPaidTill2')}
              icon={Ticket}
              onPress={() => handleStatCardPress('PERMIT_5_YEAR')} // Correct filter type
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(module_1)/addvehicle')}
          activeOpacity={0.8}
        >
          <PlusCircle size={24} color="#FFFFFF" style={styles.addButtonIcon} />
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
});

export default Home;