import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Details4_1 from '../components/details_4.1';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const FILTERS = [
  { key: 'today', label: 'Created Today', icon: 'today' },
  { key: 'previous', label: 'Created Previously', icon: 'calendar' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { key: 'ongoing', label: 'All Ongoing', icon: 'time' },
];

function isToday(date: Date) {
  const now = new Date();
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

interface JobCard {
  id: string;
  vehicleNumber: string;
  createdAt: Date;
  dispatchDate: Date | null;
}

export default function JobCardSearch() {
  const { selectedFilter } = useLocalSearchParams<{ selectedFilter?: string }>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(selectedFilter && typeof selectedFilter === 'string' ? selectedFilter : 'today');
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [filtered, setFiltered] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string | null>(null);
  const [mode, setMode] = useState<'jobcards' | 'vehicles'>('jobcards');
  const [vehicleItems, setVehicleItems] = useState<{ label: string; value: string }[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedFilter && typeof selectedFilter === 'string') {
      setFilter(selectedFilter);
    }
  }, [selectedFilter]);

  // Fetch jobcards from Firestore
  useEffect(() => {
    // Use Firestore real-time updates for jobcards
    setLoading(true);
    const unsubscribe = onSnapshot(collection(firestore, 'jobcard'), (querySnapshot) => {
      let allJobCards: JobCard[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const vehicleNumber = docSnap.id;
        Object.keys(data)
          .filter(key => key.startsWith('jobcard_'))
          .forEach(key => {
            const jc = data[key];
            if (jc) {
              allJobCards.push({
                id: `${vehicleNumber}_${key}`,
                vehicleNumber,
                createdAt: jc.date ? new Date(jc.date) : null,
                dispatchDate: jc.dispatchDate ? new Date(jc.dispatchDate) : null,
                ...jc,
              });
            }
          });
      });
      setJobCards(allJobCards);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch vehicles from Firestore
  const fetchVehicles = async () => {
    setVehicleLoading(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'vehicles'));
      let items: { label: string; value: string }[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        items.push({ label: data.vehicleNo || doc.id, value: doc.id });
      });
      items = items.sort((a, b) => a.label.localeCompare(b.label));
      setVehicleItems(items);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setVehicleLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchVehicles();
    }, [])
  );

  // When returning from details, refresh job cards
  useEffect(() => {
    if (!selectedJobCardId) {
      fetchVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobCardId]);

  useEffect(() => {
    let filteredList = jobCards;
    if (filter === 'today') {
      // Only show job cards created today that are NOT completed
      filteredList = jobCards.filter(jc => jc.createdAt && isToday(jc.createdAt) && jc.dispatchDate === null);
    } else if (filter === 'previous') {
      // Only show job cards created previously that are NOT completed
      filteredList = jobCards.filter(jc => jc.createdAt && !isToday(jc.createdAt) && jc.dispatchDate === null);
    } else if (filter === 'completed') {
      filteredList = jobCards.filter(jc => jc.dispatchDate !== null);
    } else if (filter === 'ongoing') {
      filteredList = jobCards.filter(jc => jc.dispatchDate === null);
    }
    if (search.trim()) {
      filteredList = filteredList.filter(jc =>
        jc.vehicleNumber.toLowerCase().includes(search.trim().toLowerCase())
      );
    }
    setFiltered(filteredList);
  }, [search, filter, jobCards]);

  // Filtered vehicle list
  const filteredVehicles = vehicleSearch.trim()
    ? vehicleItems.filter(v => v.label.toLowerCase().includes(vehicleSearch.trim().toLowerCase()))
    : vehicleItems;

  const getStatusColor = (item: JobCard) => {
    if (item.dispatchDate) return '#10B981'; // Green for completed
    if (item.createdAt && isToday(item.createdAt)) return '#3B82F6'; // Blue for today
    return '#F59E0B'; // Orange for ongoing
  };

  const getStatusIcon = (item: JobCard) => {
    if (item.dispatchDate) return 'checkmark-circle';
    if (item.createdAt && isToday(item.createdAt)) return 'time';
    return 'ellipse';
  };

  const renderJobCard = ({ item }: { item: JobCard }) => (
    <TouchableOpacity 
      style={styles.jobCard} 
      onPress={() => setSelectedJobCardId(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Ionicons name="car" size={20} color="#6B7280" style={styles.vehicleIcon} />
          <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
          <Ionicons 
            name={getStatusIcon(item)} 
            size={12} 
            color="white" 
            style={styles.statusIcon} 
          />
          <Text style={styles.statusText}>
            {item.dispatchDate ? 'Completed' : 'Ongoing'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>
            {item.createdAt && typeof item.createdAt.toLocaleDateString === 'function'
              ? item.createdAt.toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>
        
        {item.dispatchDate && typeof item.dispatchDate.toLocaleDateString === 'function' ? (
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Completed:</Text>
            <Text style={styles.infoValue}>
              {item.dispatchDate.toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </View>
      
      <View style={styles.cardFooter}>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  // Vehicle card renderer
  const renderVehicleCard = ({ item }: { item: { label: string; value: string } }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => setSelectedVehicleId(item.value)}
      activeOpacity={0.7}
    >
      <Ionicons name="car" size={20} color="#6B7280" style={styles.vehicleIcon} />
      <Text style={styles.vehicleNumber}>{item.label}</Text>
    </TouchableOpacity>
  );

  if (selectedJobCardId && mode === 'jobcards') {
    return <Details4_1 id={selectedJobCardId} onBack={() => setSelectedJobCardId(null)} />;
  }
  if (selectedVehicleId && mode === 'vehicles') {
    const Details4_2 = require('../components/details_4.2').default;
    return <Details4_2 vehicleId={selectedVehicleId} onBack={() => setSelectedVehicleId(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{mode === 'jobcards' ? 'Job Cards' : 'Vehicles'}</Text>
        <Text style={styles.headerSubtitle}>
          {mode === 'jobcards' ? 'Search and manage your job cards' : 'Browse all vehicles'}
        </Text>
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'jobcards' && styles.toggleButtonActive]}
          onPress={() => setMode('jobcards')}
        >
          <Text style={[styles.toggleButtonText, mode === 'jobcards' && styles.toggleButtonTextActive]}>Job Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'vehicles' && styles.toggleButtonActive]}
          onPress={() => setMode('vehicles')}
        >
          <Text style={[styles.toggleButtonText, mode === 'vehicles' && styles.toggleButtonTextActive]}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={mode === 'jobcards' ? 'Search by vehicle number...' : 'Search vehicles...'}
            placeholderTextColor="#9CA3AF"
            value={mode === 'jobcards' ? search : vehicleSearch}
            onChangeText={mode === 'jobcards' ? setSearch : setVehicleSearch}
          />
          {(mode === 'jobcards' ? search.length > 0 : vehicleSearch.length > 0) && (
            <TouchableOpacity onPress={() => (mode === 'jobcards' ? setSearch('') : setVehicleSearch(''))} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section (only for jobcards) */}
      {mode === 'jobcards' && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Status</Text>
          <View style={styles.pickerContainer}>
            <Ionicons name="filter" size={18} color="#6B7280" style={styles.filterIcon} />
            <Picker
              selectedValue={filter}
              style={styles.picker}
              onValueChange={itemValue => setFilter(itemValue)}
              dropdownIconColor="#6B7280"
            >
              {FILTERS.map(f => (
                <Picker.Item key={f.key} label={f.label} value={f.key} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Results Section */}
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {mode === 'jobcards'
              ? loading
                ? 'Loading...'
                : `${filtered.length} Job Cards Found`
              : vehicleLoading
                ? 'Loading...'
                : `${filteredVehicles.length} Vehicles Found`}
          </Text>
        </View>

        {mode === 'jobcards' ? (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading job cards...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={renderJobCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No Job Cards Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your search or filter criteria
                  </Text>
                </View>
              }
            />
          )
        ) : (
          vehicleLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading vehicles...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVehicles}
              keyExtractor={item => item.value}
              renderItem={renderVehicleCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="car-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No Vehicles Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your search
                  </Text>
                </View>
              }
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 16,
    height: 48,
  },
  filterIcon: {
    marginRight: 12,
  },
  picker: {
    flex: 1,
    height: 48,
    color: '#111827',
    paddingVertical: 40, // Add padding to prevent text from being cut off
  },
  resultsSection: {
    flex: 1,
    paddingTop: 16,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    marginRight: 8,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});