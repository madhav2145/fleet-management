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
import { useLocalSearchParams } from 'expo-router';
import {
  Search,
  SortAsc,
  SortDesc
} from 'lucide-react-native';
import { getAllVehicles } from '../../backend/vehicleService';
import { useFocusEffect } from '@react-navigation/native';

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
  PERMIT: 'permitPaidTill1',
};

const SearchVehicles: React.FC = () => {
  const params = useLocalSearchParams();
  const filterParam = params.filter as string | undefined;
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<keyof Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (filterParam && filterParamToKey[filterParam]) {
      setSelectedFilter(filterParamToKey[filterParam]);
    } else {
      setSelectedFilter(null);
    }
  }, [filterParam]);

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

  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles.filter(vehicle =>
      searchQuery ? vehicle.vehicleNo.includes(searchQuery.toUpperCase()) : true
    );

    if (selectedFilter) {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a[selectedFilter!]).getTime();
        const dateB = new Date(b[selectedFilter!]).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    return filtered;
  }, [searchQuery, selectedFilter, sortOrder, vehicles]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Vehicles</Text>

      <View style={styles.searchContainer}>
        <Search size={20} color="#0A3D91" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Vehicle Number"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Picker
        selectedValue={selectedFilter}
        onValueChange={(value) => setSelectedFilter(value || null)}
      >
        <Picker.Item label="No Filter" value={null} />
        {Object.entries(filterParamToKey).map(([key, value]) => (
          <Picker.Item key={key} label={key} value={value} />
        ))}
      </Picker>

      {selectedFilter && (
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? <SortAsc size={20} color="#0A3D91" /> : <SortDesc size={20} color="#0A3D91" />}
          <Text style={styles.sortButtonText}>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#0A3D91" />
      ) : (
        <FlatList
          data={filteredAndSortedVehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.vehicleCard}>
              <Text style={styles.vehicleNo}>{item.vehicleNo}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A3D91',
    marginBottom: 20,
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
  vehicleCard: {
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
  },
});

export default SearchVehicles;