import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

interface DetailsPageProps {
  id: string; // ID of the vehicle to fetch
  onBack: () => void; // Callback to go back to the search page
}

const DetailsPage: React.FC<DetailsPageProps> = ({ id, onBack }) => {
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVehicleDetails = async () => {
    try {
      setIsLoading(true);
      const docRef = doc(firestore, 'laundry', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setVehicle({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Vehicle not found.');
      }
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError('Failed to fetch vehicle details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  useEffect(() => {
    const backAction = () => {
      onBack(); // Call the onBack callback to navigate back to the search page
      return true; // Prevent default back button behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Cleanup the event listener
  }, [onBack]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A3D91" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#0A3D91" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
      </View>

      {/* Vehicle Number */}
      <View style={styles.detailCard}>
        <Text style={styles.label}>Vehicle Number:</Text>
        <Text style={styles.value}>{vehicle?.vehicleNo || 'N/A'}</Text>
      </View>

      {/* Items Section */}
      <View style={styles.detailCard}>
        <Text style={styles.label}>Items:</Text>
        {vehicle?.items && Object.entries(vehicle.items).map(([item, count]) => (
          <View key={item} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{item}:</Text>
            <Text style={styles.itemValue}>{String(count)} items</Text>
          </View>
        ))}
      </View>

      {/* Defected Items Section */}
      <View style={styles.detailCard}>
        <Text style={styles.label}>Defected Items:</Text>
        {vehicle?.defectedItems && vehicle.defectedItems.length > 0 ? (
          vehicle.defectedItems.map((defectedItem: any, index: number) => (
            <View key={index} style={styles.defectedItemRow}>
              <Text style={styles.itemLabel}>
                {defectedItem.piece} - {defectedItem.count} items
              </Text>
              <Text style={styles.itemIssue}>
                Issue: {defectedItem.issue || 'No issue described'}
              </Text>
              {defectedItem.photos && defectedItem.photos.length > 0 && (
                <View style={styles.photosContainer}>
                  {defectedItem.photos.map((photo: string, photoIndex: number) => (
                    <View key={photoIndex} style={styles.photoWrapper}>
                      <Text style={styles.photoLabel}>Photo {photoIndex + 1}:</Text>
                      <Text style={styles.photoValue}>{photo}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDefectedItems}>No defected items</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A7184',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 14,
    color: '#5A7184',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  defectedItemRow: {
    marginBottom: 12,
  },
  itemIssue: {
    fontSize: 14,
    color: '#D01C1F',
    marginTop: 4,
  },
  photosContainer: {
    marginTop: 8,
  },
  photoWrapper: {
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 12,
    color: '#5A7184',
  },
  photoValue: {
    fontSize: 12,
    color: '#0A3D91',
  },
  noDefectedItems: {
    fontSize: 14,
    color: '#5A7184',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D01C1F',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#0A3D91',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetailsPage;