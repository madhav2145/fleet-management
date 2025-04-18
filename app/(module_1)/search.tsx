import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons'; // Replaced lucide-react-native with @expo/vector-icons
import { getAllVehicles } from '../../backend/vehicleService';
import { addDays, isBefore, isAfter } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import Details from '../components/details_1';
import { useLocalSearchParams } from 'expo-router';

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

const filterParamToKey: Record<string, keyof Vehicle | null> = {
  POLLUTION: 'pollutionExpiry',
  INSURANCE: 'insuranceExpiry',
  AITP: 'aitpExpiry',
  FITNESS: 'fitnessExpiry',
  PERMIT_1_YEAR: 'permitPaidTill1',
  PERMIT_5_YEAR: 'permitPaidTill2',
};

const SearchVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { filter } = useLocalSearchParams(); // Retrieve the filter parameter from the route

  // Manage selectedFilter as a state
  const [selectedFilter, setSelectedFilter] = useState<keyof Vehicle | 'default' | null>(
    filter ? filterParamToKey[filter as string] || 'default' : 'default'
  );

  useEffect(() => {
    // Update selectedFilter when the filter parameter changes
    if (filter) {
      const newFilter = filterParamToKey[filter as string] || 'default';
      setSelectedFilter(newFilter);
    }
  }, [filter]); // Listen for changes in the filter parameter

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

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [])
  );

  const handleFilterChange = (value: keyof Vehicle | 'default' | null) => {
    setSelectedFilter(value); // Update the selectedFilter state
    setSortOrder('asc'); // Reset the sort order
  };

  const filteredAndSortedVehicles = useMemo(() => {
    const today = new Date();
    const next30Days = addDays(today, 30);

    let filtered = vehicles.filter(vehicle =>
      searchQuery ? vehicle.vehicleNo.includes(searchQuery.toUpperCase()) : true
    );

    if (selectedFilter !== 'default' && selectedFilter !== null) {
      filtered = filtered.filter(vehicle => {
        const expiryDate = new Date(vehicle[selectedFilter]);
        return (isBefore(expiryDate, next30Days) && isAfter(expiryDate, today)) || isBefore(expiryDate, today);
      });

      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a[selectedFilter!]).getTime();
        const dateB = new Date(b[selectedFilter!]).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else {
      // Default sorting by the first two letters of the vehicle number
      filtered = filtered.sort((a, b) => {
        const prefixA = a.vehicleNo.slice(0, 2).toUpperCase();
        const prefixB = b.vehicleNo.slice(0, 2).toUpperCase();
        return prefixA.localeCompare(prefixB);
      });
    }

    return filtered;
  }, [searchQuery, selectedFilter, sortOrder, vehicles]);

  if (selectedVehicleId) {
    return <Details id={selectedVehicleId} onBack={() => setSelectedVehicleId(null)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Vehicles</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#0A3D91" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Vehicle Number"
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <Picker
          selectedValue={selectedFilter}
          onValueChange={handleFilterChange} // Update selectedFilter when dropdown changes
          style={styles.picker}
        >
          <Picker.Item label="Alphabetical" value="default" />
          {Object.entries(filterParamToKey).map(([key, value]) => (
            <Picker.Item 
              key={key} 
              label={key.replace(/_/g, ' ')} 
              value={value} 
            />
          ))}
        </Picker>

        {selectedFilter && selectedFilter !== 'default' && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <Ionicons name="arrow-up" size={20} color="#0A3D91" />
            ) : (
              <Ionicons name="arrow-down" size={20} color="#0A3D91" />
            )}
            <Text style={styles.sortButtonText}>
              {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
                {selectedFilter && selectedFilter !== 'default' ? 'No expiring vehicles found' : 'No vehicles found'}
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
              {selectedFilter && selectedFilter !== 'default' && (
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#2D3748',
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  picker: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0A3D91',
  },
  sortButtonText: {
    marginLeft: 8,
    color: '#0A3D91',
    fontWeight: '500',
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

export default SearchVehicles;