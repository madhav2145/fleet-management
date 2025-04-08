import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import DetailsPage from '../components/details_3'; // Import the DetailsPage component

const SearchVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null); // Track selected vehicle ID

  // Fetch vehicles in real-time using Firestore's onSnapshot
  useEffect(() => {
    const q = query(collection(firestore, 'laundry'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVehicles(data);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Filter and sort vehicles based on search query and sort order
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles.filter((vehicle) =>
      searchQuery
        ? vehicle.vehicleNo?.toUpperCase().includes(searchQuery.toUpperCase())
        : true
    );

    filtered = filtered.sort((a, b) => {
      const valueA = a.vehicleNo?.toUpperCase() || '';
      const valueB = b.vehicleNo?.toUpperCase() || '';
      return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    });

    return filtered;
  }, [searchQuery, sortOrder, vehicles]);

  // Handle back action from the details page
  const handleBack = () => {
    setSelectedVehicleId(null); // Reset selected vehicle ID to go back to the search page
  };

  // If a vehicle is selected, render the DetailsPage
  if (selectedVehicleId) {
    return <DetailsPage id={selectedVehicleId} onBack={handleBack} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Vehicles</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Vehicle Number"
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <Text style={styles.sortButtonText}>
          {sortOrder === 'asc' ? 'Sort: Ascending' : 'Sort: Descending'}
        </Text>
      </TouchableOpacity>

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
              <Text style={styles.emptyText}>No vehicles found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vehicleCard}
              onPress={() => setSelectedVehicleId(item.id)} // Set the selected vehicle ID
            >
              <View style={styles.cardHeader}>
                <Text style={styles.vehicleNo}>{item.vehicleNo || 'N/A'}</Text>
              </View>
              <Text style={styles.vehicleDetails}>
                Piece: {item.piece || 'N/A'}, Count: {item.pieceCount || 0}
              </Text>
              <Text style={styles.vehicleDetails}>
                Defected: {item.defectedItem || 'N/A'}, Count: {item.defectedCount || 0}
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
  searchInput: {
    flex: 1,
    height: 40,
    color: '#2D3748',
    fontSize: 16,
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
    color: '#2D3748',
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
  vehicleDetails: {
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

export default SearchVehicles;