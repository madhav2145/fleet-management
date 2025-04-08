import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, BackHandler, Alert } from 'react-native';
import { Truck, Calendar, FileCheck, Shield, Award, Ticket, FileText, User, ArrowLeft, Clock, AlertTriangle, Edit3, Save, X, LucideProps } from 'lucide-react-native';
import { getVehicle, updateVehicle } from '../../backend/vehicleService';
import { auth, firestore } from '../../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';

interface Vehicle {
  id: string;
  vehicleNo: string;
  registrationDate: string;
  pollutionExpiry: string;
  aitpExpiry: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitPaidTill1: string;
  permitPaidTill2: string;
  taxPaidTill: string;
  owner: string;
  vehicleType: string;
}

interface DetailSectionProps {
  title: string;
  icon: React.ComponentType<LucideProps>;
  children: React.ReactNode;
}

const DetailSection: React.FC<DetailSectionProps> = ({ title, icon: Icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon size={20} color="#0A3D91" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

interface DetailItemProps {
  label: string;
  value: string;
  icon: React.ComponentType<LucideProps>;
  isDate?: boolean;
  editable?: boolean;
  onChangeText?: (text: string) => void;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon: Icon, isDate = false, editable = false, onChangeText }) => {
  let statusColor = '#2D3748';
  let statusIcon = null;

  if (isDate) {
    const expiryDate = new Date(value);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      statusColor = '#DC2626';
      statusIcon = <AlertTriangle size={16} color="#DC2626" style={styles.statusIcon} />;
    } else if (daysUntilExpiry <= 30) {
      statusColor = '#F59E0B';
      statusIcon = <Clock size={16} color="#F59E0B" style={styles.statusIcon} />;
    }
  }

  const handleBlur = () => {
    if (isDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Updated format to YYYY-MM-DD
      if (value && !dateRegex.test(value)) {
        Alert.alert('Invalid Date Format', 'Please enter the date in YYYY-MM-DD format.');
      }
    }
  };

  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon size={16} color="#0A3D91" />
      </View>
      <Text style={styles.detailLabel}>{label}:</Text>
      <View style={styles.valueContainer}>
        {editable ? (
          <TextInput
            style={[
              styles.detailValue,
              { color: isDate ? statusColor : '#2D3748', textAlign: 'left' },
            ]}
            value={value}
            onChangeText={onChangeText}
            onBlur={handleBlur} // Validate on blur
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
          />
        ) : (
          <Text style={[styles.detailValue, { color: isDate ? statusColor : '#2D3748' }]}>
            {value}
          </Text>
        )}
        {statusIcon}
      </View>
    </View>
  );
};

interface DetailsProps {
  id: string;
  onBack: () => void;
}

const Details: React.FC<DetailsProps> = ({ id, onBack }) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Vehicle | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<string[]>([]); // Track invalid fields

  const fetchVehicleDetails = async () => {
    try {
      setIsLoading(true);
      const vehicleData = await getVehicle(id); // Use the getVehicle function to fetch details
  
      if (vehicleData) {
        console.log('Fetched Vehicle Data:', vehicleData); // Debugging log
        setVehicle({ ...(vehicleData as Vehicle), id });
        setFormData({ id, ...vehicleData } as Vehicle);
      } else {
        console.error('Vehicle not found for ID:', id); // Debugging log
        setError('Vehicle not found.');
      }
    } catch (err) {
      console.error('Error fetching vehicle details:', err); // Debugging log
      setError('Failed to fetch vehicle details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleDetails();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack(); // Call the onBack callback to navigate back to the search page
      return true; // Prevent default back button behavior
    });

    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === 'admin');
        }
      }
    };

    checkAdmin();

    return () => backHandler.remove(); // Cleanup the event listener
  }, [id, onBack]);

  const handleSave = async () => {
    if (formData) {
      // Regex to validate YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      // Validate all date fields
      const dateFields = [
        { label: 'Registration Date', key: 'registrationDate', value: formData.registrationDate },
        { label: 'Pollution Expiry', key: 'pollutionExpiry', value: formData.pollutionExpiry },
        { label: 'AITP Expiry', key: 'aitpExpiry', value: formData.aitpExpiry },
        { label: 'Insurance Expiry', key: 'insuranceExpiry', value: formData.insuranceExpiry },
        { label: 'Fitness Expiry', key: 'fitnessExpiry', value: formData.fitnessExpiry },
        { label: '1 Year Permit Till', key: 'permitPaidTill1', value: formData.permitPaidTill1 },
        { label: '5 Year Permit Till', key: 'permitPaidTill2', value: formData.permitPaidTill2 },
        { label: 'Tax Paid Till', key: 'taxPaidTill', value: formData.taxPaidTill },
      ];

      // Find invalid fields
      const invalidFields = dateFields
        .filter((field) => field.value && !dateRegex.test(field.value)) // Check if the value is invalid
        .map((field) => field.key); // Extract the keys of invalid fields

      if (invalidFields.length > 0) {
        setInvalidFields(invalidFields); // Highlight invalid fields
        Alert.alert(
          'Invalid Date Format',
          `The following fields must be in YYYY-MM-DD format:\n${invalidFields
            .map((key) => dateFields.find((field) => field.key === key)?.label)
            .join(', ')}`
        );
        return; // Stop the save operation
      }

      try {
        await updateVehicle(id, formData); // Save the data if all validations pass
        setVehicle(formData);
        setIsEditing(false);
        setInvalidFields([]); // Clear invalid fields after successful save
      } catch (error) {
        console.error('Error updating vehicle:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData(vehicle);
    setIsEditing(false);
  };

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

      {vehicle && (
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleIconContainer}>
            <Truck size={32} color="#FFFFFF" />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNo}>{vehicle.vehicleNo}</Text>
            <Text style={styles.vehicleType}>{vehicle.vehicleType}</Text>
          </View>
        </View>
      )}

      <DetailSection title="Basic Information" icon={Truck}>
        <DetailItem
          label="Owner"
          value={formData?.owner || ''}
          icon={User}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, owner: text } as Vehicle)}
        />
        <DetailItem
          label="Registration Date"
          value={formData?.registrationDate || ''}
          icon={Calendar}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, registrationDate: text } as Vehicle)}
        />
      </DetailSection>

      <DetailSection title="Document Expiry Dates" icon={Calendar}>
        <DetailItem
          label="Pollution Expiry"
          value={formData?.pollutionExpiry || ''}
          icon={FileCheck}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, pollutionExpiry: text } as Vehicle)}
        />
        <DetailItem
          label="AITP Expiry"
          value={formData?.aitpExpiry || ''}
          icon={FileText}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, aitpExpiry: text } as Vehicle)}
        />
        <DetailItem
          label="Insurance Expiry"
          value={formData?.insuranceExpiry || ''}
          icon={Shield}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, insuranceExpiry: text } as Vehicle)}
        />
        <DetailItem
          label="Fitness Expiry"
          value={formData?.fitnessExpiry || ''}
          icon={Award}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, fitnessExpiry: text } as Vehicle)}
        />
      </DetailSection>

      <DetailSection title="Permit & Tax Information" icon={Ticket}>
        <DetailItem
          label="1 Year Permit Till"
          value={formData?.permitPaidTill1 || ''}
          icon={Ticket}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, permitPaidTill1: text } as Vehicle)}
        />
        <DetailItem
          label="5 Year Permit Till"
          value={formData?.permitPaidTill2 || ''}
          icon={Ticket}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, permitPaidTill2: text } as Vehicle)}
        />
        <DetailItem
          label="Tax Paid Till"
          value={formData?.taxPaidTill || ''}
          icon={FileText}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, taxPaidTill: text })}
        />
      </DetailSection>

      {isAdmin && (
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <X size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.modifyButton} onPress={() => setIsEditing(true)}>
              <Edit3 size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Modify</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  vehicleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A3D91',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#0A3D91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  vehicleType: {
    fontSize: 16,
    color: '#5A7184',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A3D91',
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#5A7184',
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left', // Explicitly set textAlign to 'left'
    paddingVertical: 4, // Add padding for better usability
    paddingHorizontal: 8, // Add horizontal padding for better usability
  },
  statusIcon: {
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 24,
  },
  returnButton: {
    backgroundColor: '#0A3D91',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  modifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A3D91',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#0A3D91',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Details;