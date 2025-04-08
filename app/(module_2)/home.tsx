import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert, BackHandler } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { PlusCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../../firebaseConfig';

interface StatCardProps {
  label: string;
  value: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, onPress }) => {
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
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const Home: React.FC = () => {
  const router = useRouter();
  const segments = useSegments();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [waterPackets, setWaterPackets] = useState({
    received: 0,
    distributed: 0,
    remaining: 0,
  });

  const [ureaBuckets, setUreaBuckets] = useState({
    received: 0,
    distributed: 0,
    remaining: 0,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Fetch data from Firestore
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'water&urea'));
        const resources = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data() as {
            receivedWaterPackets?: string;
            distributedWaterPackets?: string;
            remainingWaterPackets?: string;
            ureaReceived?: string;
            ureaDistributed?: string;
            remainingUreaPackets?: string;
          },
        }));

        // Aggregate data for water packets
        const waterPackets = resources.reduce(
          (acc, resource) => ({
            received: acc.received + parseInt(resource.receivedWaterPackets || '0'),
            distributed: acc.distributed + parseInt(resource.distributedWaterPackets || '0'),
            remaining: acc.remaining + parseInt(resource.remainingWaterPackets || '0'),
          }),
          { received: 0, distributed: 0, remaining: 0 }
        );

        // Aggregate data for urea buckets
        const ureaBuckets = resources.reduce(
          (acc, resource) => ({
            received: acc.received + parseInt(resource.ureaReceived || '0'),
            distributed: acc.distributed + parseInt(resource.ureaDistributed || '0'),
            remaining: acc.remaining + parseInt(resource.remainingUreaPackets || '0'),
          }),
          { received: 0, distributed: 0, remaining: 0 }
        );

        setWaterPackets(waterPackets);
        setUreaBuckets(ureaBuckets);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const backAction = () => {
      const currentRoute = segments.join('/'); // Get the current route as a string

      if (currentRoute === '(module_2)/home') {
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
        router.replace('/(module_2)/home'); // Navigate back to the module_2 home page
        return true; // Prevent default back button behavior
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup the event listener
  }, [segments]);



  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Resource Dashboard</Text>
        </View>

        <Text style={styles.sectionTitle}>Water Packets</Text>
        <View style={styles.gridContainer}>
          <StatCard label="Total Received" value={waterPackets.received.toString()} />
          <StatCard label="Total Distributed" value={waterPackets.distributed.toString()} />
          <StatCard label="Total Remaining" value={waterPackets.remaining.toString()} />
        </View>

        <Text style={styles.sectionTitle}>Urea Buckets</Text>
        <View style={styles.gridContainer}>
          <StatCard label="Total Received" value={ureaBuckets.received.toString()} />
          <StatCard label="Total Distributed" value={ureaBuckets.distributed.toString()} />
          <StatCard label="Total Remaining" value={ureaBuckets.remaining.toString()} />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('./addvehicle')}
          activeOpacity={0.8}
        >
          <PlusCircle size={24} color="#FFFFFF" style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Add New Resource</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCardContainer: {
    width: '48%',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#5A7184',
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D01C1F',
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#D01C1F',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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