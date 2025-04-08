import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { addResource } from '../../backend/waterUreaService';

const AddVehicle: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    vehicleNo: '',
    owner: '', // New field for owner
    vehicleType: '', // New field for vehicle type
    receivedWaterPackets: '',
    distributedWaterPackets: '',
    ureaReceived: '',
    ureaDistributed: '',
    remainingWaterPackets: '',
    remainingUreaPackets: '',
  });

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.vehicleNo || !formData.owner || !formData.vehicleType) {
      setError('Vehicle number, owner, and vehicle type are mandatory.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      return;
    }

    setIsSubmitting(true);

    try {
      // Save data to Firestore
      await addResource({
        vehicleNo: formData.vehicleNo,
        owner: formData.owner,
        vehicleType: formData.vehicleType,
        receivedWaterPackets: parseInt(formData.receivedWaterPackets || '0'),
        distributedWaterPackets: parseInt(formData.distributedWaterPackets || '0'),
        ureaReceived: parseInt(formData.ureaReceived || '0'),
        ureaDistributed: parseInt(formData.ureaDistributed || '0'),
        remainingWaterPackets: parseInt(formData.remainingWaterPackets || '0'),
        remainingUreaPackets: parseInt(formData.remainingUreaPackets || '0'),
      });

      console.log('Form Data Submitted:', formData);

      // Reset form fields
      setFormData({
        vehicleNo: '',
        owner: '',
        vehicleType: '',
        receivedWaterPackets: '',
        distributedWaterPackets: '',
        ureaReceived: '',
        ureaDistributed: '',
        remainingWaterPackets: '',
        remainingUreaPackets: '',
      });

      setIsSubmitting(false);

      // Navigate back to the home page with a refresh parameter
      router.push({
        pathname: '/(module_2)/home',
        params: { refresh: 'true' },
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error submitting form. Please try again.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Resource</Text>
          <Text style={styles.subtitle}>Enter resource details below</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vehicle No</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Vehicle No"
              value={formData.vehicleNo}
              onChangeText={(text) => handleChange('vehicleNo', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Owner</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Owner Name"
              value={formData.owner}
              onChangeText={(text) => handleChange('owner', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Vehicle Type"
              value={formData.vehicleType}
              onChangeText={(text) => handleChange('vehicleType', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Received Water Packets</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.receivedWaterPackets}
              onChangeText={(text) => handleChange('receivedWaterPackets', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Distributed Water Packets</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.distributedWaterPackets}
              onChangeText={(text) => handleChange('distributedWaterPackets', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Urea Received</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.ureaReceived}
              onChangeText={(text) => handleChange('ureaReceived', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Urea Distributed</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.ureaDistributed}
              onChangeText={(text) => handleChange('ureaDistributed', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Remaining Water Packets</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.remainingWaterPackets}
              onChangeText={(text) => handleChange('remainingWaterPackets', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Remaining Urea Packets</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.remainingUreaPackets}
              onChangeText={(text) => handleChange('remainingUreaPackets', text)}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting || !!error}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  subtitle: {
    fontSize: 16,
    color: '#5A7184',
    marginTop: 4,
  },
  error: {
    color: '#D01C1F',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A3D91',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#D01C1F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddVehicle;