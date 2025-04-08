import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Search, SortAsc, SortDesc } from 'lucide-react-native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import DetailsPage from '../components/details_2'; // Import the DetailsPage component
import { Picker } from '@react-native-picker/picker'; // Import Picker

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
    } else if (selectedFilter === 'alphabetical') {
      // Alphabetical filter shows all vehicles
      filtered = resources;
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
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 8,
    elevation: 2,
  },
  picker: {
    height: '100%',
    width: '100%',
    color: '#2D3748',
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