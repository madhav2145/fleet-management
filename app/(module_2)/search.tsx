import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Pressable,
} from 'react-native';
import { Search, SortAsc, SortDesc, Droplet, Package, ArrowLeft, Filter, Truck, Calendar } from 'lucide-react-native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import DetailsPage from '../components/details_2'; // Import the DetailsPage component
import { Picker } from '@react-native-picker/picker'; // Import Picker
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker
import { useLocalSearchParams, useRouter } from 'expo-router'; // Import useLocalSearchParams and useRouter

const SearchResources: React.FC = () => {
  const router = useRouter();
  const { selectedFilter: routeFilter } = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState<'alphabetical' | 'water' | 'urea'>(
    (routeFilter as 'alphabetical' | 'water' | 'urea') || 'alphabetical'
  );

  useEffect(() => {
    if (routeFilter) {
      setSelectedFilter(routeFilter as 'alphabetical' | 'water' | 'urea'); // Update the filter state
    }
  }, [routeFilter]);

  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today's date
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false); // State for date picker visibility
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null); // Track selected resource ID

  // Fetch resources in real-time using Firestore's onSnapshot
  useEffect(() => {
    const q = query(collection(firestore, 'waterandurea')); // Ensure the collection name is correct
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .filter((doc) => doc.id !== 'totalReceived') // Exclude the "totalReceived" document
        .map((doc) => {
          const docData = doc.data();
          let totalWaterPackets = 0;
          let totalUreaBuckets = 0;

          // Sum all water packets and urea buckets for the selected date
          if (docData[selectedDate]) {
            totalWaterPackets = parseInt(docData[selectedDate].water || '0');
            totalUreaBuckets = parseInt(docData[selectedDate].urea || '0');
          }

          return {
            id: doc.id, // Use document ID as vehicleNo
            vehicleNo: doc.id,
            totalWaterPackets,
            totalUreaBuckets,
          };
        });

      setResources(data);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [selectedDate]); // Re-fetch data when the selected date changes

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
      filtered = filtered.filter(
        (resource) => resource.totalWaterPackets > 0 && resource.totalWaterPackets < 100 // Exclude vehicles with 0 water packets
      );
    } else if (selectedFilter === 'urea') {
      filtered = filtered.filter(
        (resource) => resource.totalUreaBuckets > 0 && resource.totalUreaBuckets < 10 // Exclude vehicles with 0 urea buckets
      );
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let valueA, valueB;

      if (selectedFilter === 'alphabetical') {
        valueA = a.vehicleNo?.toUpperCase() || '';
        valueB = b.vehicleNo?.toUpperCase() || '';
        return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else if (selectedFilter === 'water') {
        valueA = a.totalWaterPackets;
        valueB = b.totalWaterPackets;
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      } else if (selectedFilter === 'urea') {
        valueA = a.totalUreaBuckets;
        valueB = b.totalUreaBuckets;
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

  // Handle date change
  const handleDateChange = (event: any, date?: Date) => {
    setIsDatePickerVisible(false);
    if (date) {
      setSelectedDate(date.toISOString().split('T')[0]); // Update the selected date
    }
  };

  // If a resource is selected, render the DetailsPage
  if (selectedResourceId) {
    return <DetailsPage id={selectedResourceId} onBack={handleBack} />;
  }

  // Get filter icon based on selected filter
  const getFilterIcon = () => {
    switch (selectedFilter) {
      case 'water':
        return <Droplet size={16} color="#0EA5E9" />;
      case 'urea':
        return <Package size={16} color="#8B5CF6" />;
      default:
        return <Filter size={16} color="#64748B" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Resources</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Vehicle Number"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Filter */}
        <Pressable
          style={styles.dateButton}
          onPress={() => setIsDatePickerVisible(true)}
        >
          <View style={styles.dateButtonContent}>
            <Calendar size={18} color="#1E3A8A" style={styles.dateIcon} />
            <View>
              <Text style={styles.dateLabel}>Selected Date</Text>
              <Text style={styles.dateValue}>{formatDate(selectedDate)}</Text>
            </View>
          </View>
        </Pressable>
        {isDatePickerVisible && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Filter and Sort Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by</Text>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerIconContainer}>
                {getFilterIcon()}
              </View>
              <Picker
                selectedValue={selectedFilter}
                onValueChange={(itemValue) => setSelectedFilter(itemValue as 'alphabetical' | 'water' | 'urea')}
                style={styles.picker}
                dropdownIconColor="#64748B"
              >
                <Picker.Item label="Alphabetical" value="alphabetical" />
                <Picker.Item label="Water Packets" value="water" />
                <Picker.Item label="Urea Buckets" value="urea" />
              </Picker>
            </View>
          </View>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <SortAsc size={20} color="#1E3A8A" />
              ) : (
                <SortDesc size={20} color="#1E3A8A" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Count */}
        <View style={styles.resultsCountContainer}>
          <Text style={styles.resultsCount}>
            {filteredAndSortedResources.length} {filteredAndSortedResources.length === 1 ? 'result' : 'results'} found
          </Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={styles.vehicleNoColumn}>
              <Text style={styles.tableHeaderText}>Vehicle No.</Text>
            </View>
            <View style={styles.dataColumn}>
              <View style={styles.columnIconContainer}>
                <Droplet size={14} color="#0EA5E9" />
              </View>
              <Text style={styles.tableHeaderText}>Water</Text>
            </View>
            <View style={styles.dataColumn}>
              <View style={styles.columnIconContainer}>
                <Package size={14} color="#8B5CF6" />
              </View>
              <Text style={styles.tableHeaderText}>Urea</Text>
            </View>
          </View>

          {/* Table Body */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={styles.loadingText}>Loading resources...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredAndSortedResources}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.tableContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Search size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No resources found</Text>
                  <Text style={styles.emptyText}>
                    Try adjusting your search or filter to find what you're looking for
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow
                  ]}
                  onPress={() => setSelectedResourceId(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vehicleNoColumn}>
                    <View style={styles.vehicleCell}>
                      <View style={styles.vehicleIconContainer}>
                        <Truck size={14} color="#FFFFFF" />
                      </View>
                      <Text style={styles.vehicleNoText}>{item.vehicleNo || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.dataColumn}>
                    <Text style={[styles.dataText, styles.waterText]}>
                      {item.totalWaterPackets}
                    </Text>
                  </View>
                  <View style={styles.dataColumn}>
                    <Text style={[styles.dataText, styles.ureaText]}>
                      {item.totalUreaBuckets}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40, // Same width as back button for balance
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#334155',
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterContainer: {
    flex: 1,
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    height: 48,
    paddingLeft: 12,
  },
  pickerIconContainer: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 55,
    color: '#334155',
  },
  sortContainer: {
    width: 60,
  },
  sortLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    marginLeft: 4,
    textAlign: 'center',
  },
  sortButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  resultsCountContainer: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  columnIconContainer: {
    marginRight: 6,
  },
  vehicleNoColumn: {
    flex: 2,
    justifyContent: 'center',
  },
  dataColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableContent: {
    flexGrow: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F8FAFC',
  },
  vehicleCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  vehicleNoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
  },
  dataText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  waterText: {
    color: '#0EA5E9',
  },
  ureaText: {
    color: '#8B5CF6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SearchResources;