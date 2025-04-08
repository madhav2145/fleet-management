import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, BackHandler, Alert } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

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
      const currentRoute = segments.join('/'); // Get the current route as a string

      if (currentRoute === '(module_3)/home') {
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
        return false; // Allow default back button behavior for other pages
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup the event listener
  }, [segments]);

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
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: '#D01C1F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Home;