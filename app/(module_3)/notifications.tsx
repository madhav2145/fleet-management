import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

interface Vehicle {
  id: string;
  vehicleNo: string;
  defectedItem?: string;
  defectedCount?: string;
  otherIssues?: string;
}

const Notifications: React.FC = () => {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false); // Trigger for refreshing data

  const fetchVehicles = useCallback(() => {
    setIsLoading(true);
    const q = query(collection(firestore, 'vehicles'), where('defectedItem', '!=', null));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [refreshTrigger]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => !prev); // Toggle the refresh trigger
  }, []);

  const navigateToDetails = (id: string) => {
    router.push(`/components/details_3?id=${id}`);
  };

  return (
    <FlatList
      style={styles.container}
      data={vehicles}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.notificationCard}
          onPress={() => navigateToDetails(item.id)} // Navigate to details page
        >
          <Text style={styles.vehicleNo}>{item.vehicleNo || 'N/A'}</Text>
          <Text style={styles.notificationDetails}>
            Defected Item: {item.defectedItem || 'N/A'}, Count: {item.defectedCount || '0'}
          </Text>
          {item.otherIssues && (
            <Text style={styles.notificationDetails}>Other Issues: {item.otherIssues}</Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F4F8',
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
  notificationCard: {
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
  notificationDetails: {
    fontSize: 14,
    color: '#5A7184',
  },
});

export default Notifications;