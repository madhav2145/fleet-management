import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Replaced lucide-react-native with @expo/vector-icons
import { addVehicle, getVehicle } from '../../backend/vehicleService';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker

// ✅ Type for FormSection Props
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// ✅ Type for FormInput Props
interface FormInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap; // Use Ionicons icon names
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FormInput: React.FC<FormInputProps> = ({ label, icon, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon && <Ionicons name={icon} size={20} color="#0A3D91" style={styles.inputIcon} />}
      <TextInput 
        style={[styles.input, icon && styles.inputWithIcon]} 
        placeholderTextColor="#94A3B8"
        {...props}
      />
    </View>
  </View>
);

const AddVehicle: React.FC = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const vehicleNoRef = useRef<TextInput>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false); // State for date picker visibility
  const [selectedDateField, setSelectedDateField] = useState<keyof typeof formData | null>(null); // Track which field is being edited
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for selected date

  const [formData, setFormData] = useState({
    vehicleNo: '',
    vehicleType: '',
    owner: '',
    registrationDate: '',
    pollutionExpiry: '',
    aitpExpiry: '',
    insuranceExpiry: '',
    fitnessExpiry: '',
    permitPaidTill1: '',
    permitPaidTill2: '',
    taxPaidTill: '',
  });

  useFocusEffect(
    React.useCallback(() => {
      // Clear form data when navigating back to the page
      setFormData({
        vehicleNo: '',
        vehicleType: '',
        owner: '',
        registrationDate: '',
        pollutionExpiry: '',
        aitpExpiry: '',
        insuranceExpiry: '',
        fitnessExpiry: '',
        permitPaidTill1: '',
        permitPaidTill2: '',
        taxPaidTill: '',
      });
      setError('');
    }, [])
  );

  const checkVehicleExists = async (vehicleNo: string) => {
    try {
      const vehicle = await getVehicle(vehicleNo);
      return !!vehicle;
    } catch (error) {
      console.error('Error checking vehicle existence:', error);
      return false;
    }
  };

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateConfirm = (event: any, date?: Date) => {
    setIsDatePickerVisible(false);
    if (date && selectedDateField) {
      setFormData((prev) => ({
        ...prev,
        [selectedDateField]: date.toISOString().split('T')[0], // Save date in YYYY-MM-DD format
      }));
    }
  };

  const openDatePicker = (field: keyof typeof formData) => {
    setSelectedDateField(field);
    setSelectedDate(formData[field] ? new Date(formData[field]) : new Date());
    setIsDatePickerVisible(true);
  };

  const handleAddVehicle = async () => {
    if (!formData.vehicleNo) {
      setError('Vehicle number is mandatory.');
      vehicleNoRef.current?.focus();
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsSubmitting(true);
    const vehicleExists = await checkVehicleExists(formData.vehicleNo);
    if (vehicleExists) {
      setError('Vehicle with this number already exists.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      setIsSubmitting(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    try {
      await addVehicle(formData);
      setIsSubmitting(false);
      router.push('/home');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setError('Error adding vehicle. Please try again.');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      setIsSubmitting(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      ref={scrollViewRef}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Vehicle</Text>
          <Text style={styles.subtitle}>Enter vehicle details below</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FormSection title="Basic Information">
          <FormInput
            label="Vehicle Number"
            icon="car"
            value={formData.vehicleNo}
            onChangeText={(text) => handleChange('vehicleNo', text)}
            placeholder="Enter vehicle number"
            autoCapitalize="characters"
          />
          <FormInput
            label="Vehicle Type"
            icon="car-sport"
            value={formData.vehicleType}
            onChangeText={(text) => handleChange('vehicleType', text)}
            placeholder="Enter vehicle type"
          />
          <FormInput
            label="Owner Name"
            icon="person"
            value={formData.owner}
            onChangeText={(text) => handleChange('owner', text)}
            placeholder="Enter owner name"
          />
        </FormSection>

        <FormSection title="Registration Details">
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('registrationDate')}
          >
            <Text style={styles.dateText}>
              {formData.registrationDate || 'Select Registration Date'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>
        </FormSection>

        <FormSection title="Document Expiry Dates">
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('pollutionExpiry')}
          >
            <Text style={styles.dateText}>
              {formData.pollutionExpiry || 'Select Pollution Expiry'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('aitpExpiry')}
          >
            <Text style={styles.dateText}>
              {formData.aitpExpiry || 'Select AITP Expiry'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('insuranceExpiry')}
          >
            <Text style={styles.dateText}>
              {formData.insuranceExpiry || 'Select Insurance Expiry'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('fitnessExpiry')}
          >
            <Text style={styles.dateText}>
              {formData.fitnessExpiry || 'Select Fitness Expiry'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>
        </FormSection>

        <FormSection title="Permit & Tax Details">
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('permitPaidTill1')}
          >
            <Text style={styles.dateText}>
              {formData.permitPaidTill1 || 'Select Permit Paid Till (1)'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('permitPaidTill2')}
          >
            <Text style={styles.dateText}>
              {formData.permitPaidTill2 || 'Select Permit Paid Till (2)'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openDatePicker('taxPaidTill')}
          >
            <Text style={styles.dateText}>
              {formData.taxPaidTill || 'Select Tax Paid Till'}
            </Text>
            <Ionicons name="calendar" size={20} color="#0A3D91" />
          </TouchableOpacity>
        </FormSection>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleAddVehicle}
          disabled={isSubmitting || !!error}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Vehicle</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* DateTimePicker */}
      {isDatePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateConfirm}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0A3D91' },
  subtitle: { fontSize: 16, color: '#5A7184', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2D3748', marginBottom: 16 },
  sectionContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, elevation: 3 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  inputIcon: { padding: 12, opacity: 0.7 },
  input: { flex: 1, height: 48, paddingHorizontal: 12, fontSize: 16, color: '#2D3748' },
  inputWithIcon: { paddingLeft: 0 },
  submitButton: { backgroundColor: '#D01C1F', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  error: { color: '#D01C1F', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#5A7184',
  },
});

export default AddVehicle;