import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { getResource } from '../../backend/waterUreaService';
import { ArrowLeft } from 'lucide-react-native';

interface DetailsPageProps {
  id: string; // ID of the resource to fetch
  onBack: () => void; // Callback to go back to the search page
}

const DetailsPage: React.FC<DetailsPageProps> = ({ id, onBack }) => {
  const [resource, setResource] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResourceDetails = async () => {
    try {
      setIsLoading(true);
      const data = await getResource(id); // Fetch resource details by ID
      if (data) {
        setResource(data);
      } else {
        setError('Resource not found.');
      }
    } catch (err) {
      console.error('Error fetching resource details:', err);
      setError('Failed to fetch resource details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResourceDetails();
    }
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
        <Text style={styles.headerTitle}>Resource Details</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Vehicle Number:</Text>
        <Text style={styles.value}>{resource?.vehicleNo || 'N/A'}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Water Packets:</Text>
        <Text style={styles.value}>
          {resource?.receivedWaterPackets || 0} received, {resource?.distributedWaterPackets || 0} distributed
        </Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Urea:</Text>
        <Text style={styles.value}>
          {resource?.ureaReceived || 0} received, {resource?.ureaDistributed || 0} distributed
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light background for better contrast
    paddingHorizontal: 16, // Add horizontal padding
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 3, // Add shadow for the header
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937', // Darker text for better readability
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 4, // Add shadow for the cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563', // Subtle gray for labels
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // Darker text for values
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
    color: '#DC2626', // Red for error messages
    textAlign: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#2563EB', // Blue for back button text
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetailsPage;