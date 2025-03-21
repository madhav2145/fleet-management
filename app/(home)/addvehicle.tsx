import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator 
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Calendar, Truck, FileText, Shield, Award, Ticket, User, FileCheck 
} from 'lucide-react-native';
import { addVehicle, getVehicle } from '../../backend/vehicleService';

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
  icon?: React.ElementType;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FormInput: React.FC<FormInputProps> = ({ label, icon: Icon, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      {Icon && <Icon size={20} color="#0A3D91" style={styles.inputIcon} />}
      <TextInput 
        style={[styles.input, Icon && styles.inputWithIcon]} 
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
            icon={Truck}
            value={formData.vehicleNo}
            onChangeText={(text) => handleChange('vehicleNo', text)}
            placeholder="Enter vehicle number"
            autoCapitalize="characters"
            
          />
          <FormInput
            label="Vehicle Type"
            icon={Truck}
            value={formData.vehicleType}
            onChangeText={(text) => handleChange('vehicleType', text)}
            placeholder="Enter vehicle type"
          />
          <FormInput
            label="Owner Name"
            icon={User}
            value={formData.owner}
            onChangeText={(text) => handleChange('owner', text)}
            placeholder="Enter owner name"
          />
        </FormSection>

        <FormSection title="Registration Details">
          <FormInput
            label="Registration Date"
            icon={Calendar}
            value={formData.registrationDate}
            onChangeText={(text) => handleChange('registrationDate', text)}
            placeholder="YYYY-MM-DD"
          />
        </FormSection>

        <FormSection title="Document Expiry Dates">
          <FormInput
            label="Pollution Expiry"
            icon={FileCheck}
            value={formData.pollutionExpiry}
            onChangeText={(text) => handleChange('pollutionExpiry', text)}
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            label="AITP Expiry"
            icon={FileText}
            value={formData.aitpExpiry}
            onChangeText={(text) => handleChange('aitpExpiry', text)}
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            label="Insurance Expiry"
            icon={Shield}
            value={formData.insuranceExpiry}
            onChangeText={(text) => handleChange('insuranceExpiry', text)}
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            label="Fitness Expiry"
            icon={Award}
            value={formData.fitnessExpiry}
            onChangeText={(text) => handleChange('fitnessExpiry', text)}
            placeholder="YYYY-MM-DD"
          />
        </FormSection>

        <FormSection title="Permit & Tax Details">
          <FormInput
            label="Permit Paid Till (1)"
            icon={Ticket}
            value={formData.permitPaidTill1}
            onChangeText={(text) => handleChange('permitPaidTill1', text)}
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            label="Permit Paid Till (2)"
            icon={Ticket}
            value={formData.permitPaidTill2}
            onChangeText={(text) => handleChange('permitPaidTill2', text)}
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            label="Tax Paid Till"
            icon={FileText}
            value={formData.taxPaidTill}
            onChangeText={(text) => handleChange('taxPaidTill', text)}
            placeholder="YYYY-MM-DD"
          />
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
});

export default AddVehicle;