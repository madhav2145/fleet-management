import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Bus, Calendar, Shield, FileCheck, Award, Ticket, PlusCircle } from 'lucide-react-native';
import { getAllVehicles } from '../../backend/vehicleService';
import { addDays, isBefore } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

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
    >
      <Animated.View 
        style={[
          styles.statCard,
          { transform: [{ scale: scaleAnim }] }
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
    [key: string]: any; // Add other fields as necessary
  }
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

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

  const handleStatCardPress = (type: string) => {
    // Handle navigation or filtering based on the type
    router.push({
      pathname: '/(home)/search',
      params: { filter: type.toUpperCase() }
    });
  };

  const filterVehiclesByExpiry = (expiryField: string) => {
    const today = new Date();
    const next30Days = addDays(today, 30);
    return vehicles.filter(vehicle => {
      const expiryDate = new Date(vehicle[expiryField]);
      return isBefore(expiryDate, next30Days);
    }).length.toString();
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Fleet Dashboard</Text>
          <Text style={styles.subtitle}>Vehicle Management Overview</Text>
        </View>

        <View style={styles.totalVehiclesCard}>
          <Bus size={32} color="#FFFFFF" />
          <View style={styles.totalVehiclesContent}>
            <Text style={styles.totalVehiclesLabel}>Total Fleet Size</Text>
            <Text style={styles.totalVehiclesValue}>{vehicles.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Renewals</Text>
        
        <View style={styles.gridContainer}>
          <View style={styles.row}>
            <StatCard 
              label="Pollution Expiry" 
              value={filterVehiclesByExpiry('pollutionExpiry')} 
              icon={Calendar} 
              onPress={() => handleStatCardPress('POLLUTION')} 
            />
            <StatCard 
              label="Insurance Expiry" 
              value={filterVehiclesByExpiry('insuranceExpiry')} 
              icon={Shield} 
              onPress={() => handleStatCardPress('INSURANCE')} 
            />
          </View>
          <StatCard 
            label="AITP Expiry" 
            value={filterVehiclesByExpiry('aitpExpiry')} 
            icon={FileCheck} 
            onPress={() => handleStatCardPress('AITP')} 
          />
          <StatCard 
            label="Fitness Expiry" 
            value={filterVehiclesByExpiry('fitnessExpiry')} 
            icon={Award} 
            onPress={() => handleStatCardPress('FITNESS')} 
          />
          <StatCard 
            label="Permit Expiry" 
            value={filterVehiclesByExpiry('permitPaidTill1')} 
            icon={Ticket} 
            onPress={() => handleStatCardPress('PERMIT')} 
          />
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/(home)/addvehicle')}
          activeOpacity={0.8}
        >
          <PlusCircle size={24} color="#FFFFFF" style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Add New Vehicle</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

// Keep the same styles from your original home page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  content: {
    padding: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A3D91',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#5A7184',
    marginTop: 4,
  },
  totalVehiclesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A3D91',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#0A3D91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  totalVehiclesContent: {
    marginLeft: 16,
  },
  totalVehiclesLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  totalVehiclesValue: {
    fontSize: 32,
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
    marginHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    paddingLeft: 40,
  },
  statCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
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
    marginBottom: 12,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#D01C1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Home;