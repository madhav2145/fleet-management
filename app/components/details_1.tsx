import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Alert,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Truck,
  Calendar,
  FileCheck,
  Shield,
  Award,
  Ticket,
  FileText,
  User,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Edit3,
  Save,
  X,
  LucideProps,
} from 'lucide-react-native';

import * as DocumentPicker from 'expo-document-picker'; // Use expo-document-picker

import { getVehicle, updateVehicle } from '../../backend/vehicleService';
import { auth, firestore } from '../../firebaseConfig';
import { getDoc, doc, deleteDoc } from 'firebase/firestore';



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
  pdfUrls?: { [key: string]: string };
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
    <View style={styles.sectionContent}>{children}</View>
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

const DetailItem: React.FC<DetailItemProps & { pdfUrl?: string; onPdfRemove?: () => void; onPdfReplace?: (file: { assets: { uri: string; name: string }[]; canceled?: boolean }) => void }> = ({
  label,
  value,
  icon: Icon,
  isDate = false,
  editable = false,
  onChangeText,
  pdfUrl,
  onPdfRemove,
  onPdfReplace,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate && onChangeText) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      onChangeText(formattedDate);
    }
  };

  const clearDate = () => {
    if (onChangeText) {
      onChangeText('');
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    try {
      await Linking.openURL(pdfUrl);
    } catch (e) {
      Alert.alert('Open Failed', 'Could not open PDF in browser.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: false });
      if (!res.canceled && res.assets && res.assets.length > 0 && onPdfReplace) {
        onPdfReplace({
          assets: [{ uri: res.assets[0].uri, name: res.assets[0].name }],
          canceled: false,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick PDF.');
    }
  };

  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon size={16} color="#0A3D91" />
      </View>
      <Text style={styles.detailLabel}>{label}:</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.valueContainer}>
          {editable && isDate ? (
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={[styles.datePickerButton, { borderColor: '#E2E8F0' }]}
                onPress={() => setShowDatePicker(true)}
                disabled={!editable}
              >
                <Text style={styles.detailValue}>
                  {value || 'Select Date'}
                </Text>
              </TouchableOpacity>
              {value ? (
                <TouchableOpacity
                  style={styles.clearDateIcon}
                  onPress={clearDate}
                  disabled={!editable}
                >
                  <X size={16} color="#DC2626" />
                </TouchableOpacity>
              ) : null}
              {showDatePicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleDateChange}
                  disabled={!editable}
                />
              )}
            </View>
          ) : (
            <Text style={styles.detailValue}>{value}</Text>
          )}
        </View>
        {/* PDF controls for date fields only, always below the date value, and always left-aligned and wrapped */}
        {isDate && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 8, marginLeft: 0 }}>
            {pdfUrl ? (
              <>
                <TouchableOpacity
                  style={styles.pdfDownloadButton}
                  onPress={handleDownload}
                  disabled={downloading}
                >
                  <Text style={styles.pdfButtonText}>{downloading ? '...' : 'PDF'}</Text>
                </TouchableOpacity>
                {editable && (
                  <>
                    <TouchableOpacity
                      style={[styles.pdfDownloadButton, { backgroundColor: '#DC2626', marginLeft: 6 }]}
                      onPress={onPdfRemove}
                    >
                      <Text style={styles.pdfButtonText}>Remove</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pdfDownloadButton, { backgroundColor: '#398AB9', marginLeft: 6 }]}
                      onPress={handlePickPdf}
                    >
                      <Text style={styles.pdfButtonText}>Replace</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              editable && (
                <TouchableOpacity
                  style={[styles.pdfDownloadButton, { backgroundColor: '#398AB9' }]}
                  onPress={handlePickPdf}
                >
                  <Text style={styles.pdfButtonText}>Add PDF</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
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
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchVehicleDetails = async () => {
    try {
      setIsLoading(true);
      const vehicleData = await getVehicle(id);

      if (vehicleData) {
        setVehicle({ ...(vehicleData as Vehicle), id });
        setFormData({ id, ...vehicleData } as Vehicle);
      } else {
        setError('Vehicle not found.');
      }

      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (err) {
      setError('Failed to fetch vehicle details.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToCloudinary = async (file: { uri: string; name: string; type: string }) => {
    const data = new FormData();
    data.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    data.append('upload_preset', 'fleet_manager');
    const response = await fetch('https://api.cloudinary.com/v1_1/dywapv8ct/raw/upload', {
      method: 'POST',
      body: data,
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    const json = await response.json();
    return json.secure_url;
  };

  const handleUploadPdf = async (file: { assets: { uri: string; name: string }[]; canceled?: boolean }, pdfKey: string) => {
    if (!file || file.canceled || !file.assets || !file.assets[0]?.uri) {
      Alert.alert('Error', 'No PDF selected.');
      return;
    }
    try {
      const { uri, name } = file.assets[0];
      const secureUrl = await uploadToCloudinary({ uri, name, type: 'application/pdf' });
      setFormData((prev) => prev ? {
        ...prev,
        pdfUrls: { ...prev.pdfUrls, [pdfKey]: secureUrl }
      } : prev);
      Alert.alert('Success', 'PDF uploaded successfully.');
    } catch (e) {
      Alert.alert('Upload Failed', 'Could not upload PDF.');
    }
  };

  const handleSave = async () => {
    if (formData) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

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

      const invalidFields = dateFields
        .filter((field) => field.value && !dateRegex.test(field.value))
        .map((field) => field.key);

      if (invalidFields.length > 0) {
        setInvalidFields(invalidFields);
        Alert.alert(
          'Invalid Date Format',
          `The following fields must be in YYYY-MM-DD format:\n${invalidFields
            .map((key) => dateFields.find((field) => field.key === key)?.label)
            .join(', ')}`
        );
        return;
      }

      try {
        await updateVehicle(id, formData);
        setVehicle(formData);
        setIsEditing(false);
        setInvalidFields([]);
      } catch (error) {
        console.error('Error updating vehicle:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData(vehicle);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'vehicles', id));
              Alert.alert('Success', 'Vehicle deleted successfully.');
              onBack();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete the vehicle. Please try again.');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchVehicleDetails();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [id, onBack]);

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
          pdfUrl={formData?.pdfUrls?.owner}
        />
        <DetailItem
          label="Registration Date"
          value={formData?.registrationDate || ''}
          icon={Calendar}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, registrationDate: text } as Vehicle)}
          pdfUrl={formData?.pdfUrls?.registrationDate}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, registrationDate: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'registrationDate') : undefined}
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
          pdfUrl={formData?.pdfUrls?.pollutionExpiry}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, pollutionExpiry: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'pollutionExpiry') : undefined}
        />
        <DetailItem
          label="AITP Expiry"
          value={formData?.aitpExpiry || ''}
          icon={FileText}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, aitpExpiry: text } as Vehicle)}
          pdfUrl={formData?.pdfUrls?.aitpExpiry}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, aitpExpiry: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'aitpExpiry') : undefined}
        />
        <DetailItem
          label="Insurance Expiry"
          value={formData?.insuranceExpiry || ''}
          icon={Shield}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, insuranceExpiry: text } as Vehicle)}
          pdfUrl={formData?.pdfUrls?.insuranceExpiry}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, insuranceExpiry: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'insuranceExpiry') : undefined}
        />
        <DetailItem
          label="Fitness Expiry"
          value={formData?.fitnessExpiry || ''}
          icon={Award}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, fitnessExpiry: text } as Vehicle)}
          pdfUrl={formData?.pdfUrls?.fitnessExpiry}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, fitnessExpiry: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'fitnessExpiry') : undefined}
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
          pdfUrl={formData?.pdfUrls?.permitPaidTill1}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, permitPaidTill1: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'permitPaidTill1') : undefined}
        />
        <DetailItem
          label="5 Year Permit Till"
          value={formData?.permitPaidTill2 || ''}
          icon={Ticket}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, permitPaidTill2: text } as Vehicle)}
          pdfUrl={formData?.pdfUrls?.permitPaidTill2}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, permitPaidTill2: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'permitPaidTill2') : undefined}
        />
        <DetailItem
          label="Tax Paid Till"
          value={formData?.taxPaidTill || ''}
          icon={FileText}
          isDate={true}
          editable={isEditing}
          onChangeText={(text) => formData && setFormData({ ...formData, taxPaidTill: text })}
          pdfUrl={formData?.pdfUrls?.taxPaidTill}
          onPdfRemove={isEditing ? () => {
            setFormData((prev) => prev ? { ...prev, pdfUrls: { ...prev.pdfUrls, taxPaidTill: '' } } : prev);
          } : undefined}
          onPdfReplace={isEditing ? async (file) => handleUploadPdf(file, 'taxPaidTill') : undefined}
        />
      </DetailSection>

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
            {isAdmin && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <X size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.modifyButton} onPress={() => setIsEditing(true)}>
            <Edit3 size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Modify</Text>
          </TouchableOpacity>
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    borderWidth: 1,
    borderColor: '#0A3D91',
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#5A7184',
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusIcon: {
    marginLeft: 6,
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  clearDateIcon: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfDownloadButton: {
    backgroundColor: '#0A3D91',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginLeft: 0,
    marginRight: 8,
    marginBottom: 6,
    maxWidth: 110,
    alignItems: 'center',
  },
  pdfButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
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
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  deleteButton: {
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