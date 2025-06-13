import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert, BackHandler } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';
import { auth, firestore } from '../../firebaseConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import DetailsPage from '../components/details_2'; // Import the DetailsPage component
import { Droplet, Package, ArrowRight, PlusCircle, TrendingUp, TrendingDown } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  value: string;
  onPress?: () => void;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  color?: string;
  type?: 'received' | 'distributed' | 'remaining';
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  onPress, 
  fullWidth = false, 
  icon, 
  color = '#D01C1F',
  type
}) => {
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

  // Determine background gradient based on type
  const getCardStyle = () => {
    switch(type) {
      case 'received':
        return styles.receivedCard;
      case 'distributed':
        return styles.distributedCard;
      case 'remaining':
        return styles.remainingCard;
      default:
        return {};
    }
  };

  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      style={[styles.statCardContainer, fullWidth && styles.fullWidthCard]}
    >
      <Animated.View
        style={[
          styles.statCard,
          getCardStyle(),
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.statLabel}>{label}</Text>
          {icon}
        </View>
        <Text style={[
          styles.statValue, 
          fullWidth && styles.largeStatValue,
          { color }
        ]}>
          {value}
        </Text>
        {onPress && (
          <View style={styles.cardFooter}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ArrowRight size={14} color="#6B7280" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Helper function to format the current date
const getCurrentDate = () => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  return today.toLocaleDateString('en-US', options);
};

const Home: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const segments = useSegments();
  const [pushToken, setPushToken] = useState<string | null>(null); // State to store the push token
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to store error messages
  const [isOnAddPage, setIsOnAddPage] = useState(false); // State to track if user is on Add Water/Urea page

  const [waterStats, setWaterStats] = useState({
    received: 0,
    distributed: 0,
    remaining: 0,
  });

  const [ureaStats, setUreaStats] = useState({
    received: 0,
    distributed: 0,
    remaining: 0,
  });

  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const currentDate = getCurrentDate(); // Get the formatted current date

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const totalReceivedRef = doc(firestore, 'waterandurea', 'totalReceived');
    const unsubscribe = onSnapshot(totalReceivedRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const totalReceivedData = docSnapshot.data();

        const waterReceived = totalReceivedData.totalWater || 0;
        const waterDistributed = totalReceivedData.totalDistributedWater || 0;
        const waterRemaining = waterReceived - waterDistributed;

        const ureaReceived = totalReceivedData.totalUrea || 0;
        const ureaDistributed = totalReceivedData.totalDistributedUrea || 0;
        const ureaRemaining = ureaReceived - ureaDistributed;

        setWaterStats({
          received: waterReceived,
          distributed: waterDistributed,
          remaining: waterRemaining,
        });

        setUreaStats({
          received: ureaReceived,
          distributed: ureaDistributed,
          remaining: ureaRemaining,
        });

        // Check for low inventory and show alerts only if not on Add Water/Urea page
        if (!isOnAddPage) {
          if (waterRemaining < 100) {
            Alert.alert(
              'Low Inventory',
              'Water packets are less than 100. Need to order more.',
              [{ text: 'OK' }]
            );
          }

          if (ureaRemaining < 10) {
            Alert.alert(
              'Low Inventory',
              'Urea buckets are less than 10. Need to order more.',
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        console.error('Total received data not found.');
      }
    });

    // Register for push notifications
    const requestNotifications = async () => {
      await registerForPushNotificationsAsync();
    };

    requestNotifications();

    return () => unsubscribe();
  }, [isOnAddPage]); // Add isOnAddPage as a dependency

  useEffect(() => {
    const backAction = () => {
      const currentRoute = segments.join('/');
      if (currentRoute === '(module_2)/home') {
        router.replace('/dashboard');
        return true;
      } else {
        router.replace('/(module_2)/home');
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [segments]);

  // Function to register for push notifications
  const registerForPushNotificationsAsync = async () => {
    try {
      if (!Device.isDevice) {
        setErrorMessage('Push notifications are only supported on physical devices.');
        return;
      }

      // Check existing notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If permissions are still not granted, show an error
      if (finalStatus !== 'granted') {
        setErrorMessage('Failed to get push token for push notifications. Please grant notification permissions.');
        return;
      }

      // Get the Expo push token
      const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      setPushToken(expoPushToken); // Save the push token to state

      // Save the token to Firestore
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage('No logged-in user found.');
        return;
      }

      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(
        userRef,
        { pushToken: arrayUnion(expoPushToken) },
        { merge: true }
      );

      setErrorMessage(null); // Clear any previous error messages
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      setErrorMessage('An error occurred while generating the push token.');
    }
  };

  const handleAddPageNavigation = () => {
    setIsOnAddPage(true);
    router.push('/(module_2)/addwater&urea');
  };

  const handleBack = () => {
    setSelectedResourceId(null);
    setIsOnAddPage(false); // Reset when navigating back
  };

  if (selectedResourceId) {
    return <DetailsPage id={selectedResourceId} onBack={handleBack} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Resource Dashboard</Text>
        </View>

        {/* Water Packets Section */}
        <View style={styles.sectionHeader}>
          <Droplet size={18} color="#0EA5E9" />
          <Text style={styles.sectionTitle}>Water Packets (as on {currentDate})</Text>
        </View>
        <View style={styles.gridContainer}>
          <StatCard
            label="Total Received"
            value={waterStats.received.toString()}
            fullWidth={true}
            onPress={() => setSelectedResourceId('totalReceived')}
            icon={<TrendingUp size={18} color="#10B981" />}
            color="#10B981"
            type="received"
          />
          <View style={styles.smallCardsRow}>
            <StatCard
              label="Total Distributed"
              value={waterStats.distributed.toString()}
              onPress={() => router.push('/(module_2)/search?selectedFilter=water')} // Pass 'water' as the filter
              icon={<TrendingDown size={18} color="#0EA5E9" />}
              color="#0EA5E9"
              type="distributed"
            />
            <StatCard
              label="Total Remaining"
              value={waterStats.remaining.toString()}
              icon={<Droplet size={18} color="#6366F1" />}
              color="#6366F1"
              type="remaining"
            />
          </View>
        </View>

        {/* Urea Buckets Section */}
        <View style={styles.sectionHeader}>
          <Package size={18} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Urea Buckets (as on {currentDate})</Text>
        </View>
        <View style={styles.gridContainer}>
          <StatCard
            label="Total Received"
            value={ureaStats.received.toString()}
            fullWidth={true}
            onPress={() => setSelectedResourceId('totalReceived')}
            icon={<TrendingUp size={18} color="#10B981" />}
            color="#10B981"
            type="received"
          />
          <View style={styles.smallCardsRow}>
            <StatCard
              label="Total Distributed"
              value={ureaStats.distributed.toString()}
              onPress={() => router.push('/(module_2)/search?selectedFilter=urea')} // Pass 'urea' as the filter
              icon={<TrendingDown size={18} color="#8B5CF6" />}
              color="#8B5CF6"
              type="distributed"
            />
            <StatCard
              label="Total Remaining"
              value={ureaStats.remaining.toString()}
              icon={<Package size={18} color="#EC4899" />}
              color="#EC4899"
              type="remaining"
            />
          </View>
        </View>

        {/* Add Water/Urea Status Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPageNavigation}
        >
          <PlusCircle size={20} color="#FFFFFF" style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Update Water/Urea Status</Text>
        </TouchableOpacity>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 12, // Reduced padding
    paddingTop: 16, // Reduced top padding
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // Reduced margin
    paddingBottom: 10, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 22, // Reduced font size
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    letterSpacing: 0.4, // Slightly reduced letter spacing
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Reduced margin
    marginTop: 6, // Reduced margin
  },
  sectionTitle: {
    fontSize: 14, // Reduced font size
    fontWeight: '700',
    color: '#334155',
    marginLeft: 6, // Reduced margin
  },
  gridContainer: {
    marginBottom: 16, // Reduced margin
  },
  smallCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statCardContainer: {
    width: '48%',
    marginBottom: 8, // Reduced margin
  },
  fullWidthCard: {
    width: '100%',
    marginBottom: 8, // Reduced margin
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Reduced border radius
    padding: 12, // Reduced padding
    minHeight: 90, // Reduced height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6, // Reduced shadow radius
    elevation: 3, // Reduced elevation
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  receivedCard: {
    borderLeftWidth: 3, // Reduced border width
    borderLeftColor: '#10B981',
  },
  distributedCard: {
    borderLeftWidth: 3, // Reduced border width
    borderLeftColor: '#0EA5E9',
  },
  remainingCard: {
    borderLeftWidth: 3, // Reduced border width
    borderLeftColor: '#6366F1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6, // Reduced margin
  },
  viewDetailsText: {
    fontSize: 10, // Reduced font size
    color: '#6B7280',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 12, // Reduced font size
    fontWeight: '600',
    color: '#64748B',
  },
  statValue: {
    fontSize: 20, // Reduced font size
    fontWeight: 'bold',
    textAlign: 'center',
  },
  largeStatValue: {
    fontSize: 30, // Reduced font size
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10, // Reduced padding
    borderRadius: 10, // Reduced border radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8, // Reduced margin
    marginHorizontal: 12, // Reduced margin
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 }, // Reduced shadow offset
    shadowOpacity: 0.2,
    shadowRadius: 6, // Reduced shadow radius
    elevation: 4, // Reduced elevation
  },
  addButtonIcon: {
    marginRight: 6, // Reduced margin
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14, // Reduced font size
    fontWeight: 'bold',
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFE4E6',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#D01C1F',
    fontWeight: 'bold',
  },
});

export default Home;