import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, ActionSheetIOS, Modal, Platform 
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Replaced lucide-react-native with @expo/vector-icons
import { getVehicle, addVehicle } from '../../backend/vehicleService';

import { addDoc, collection, doc, setDoc } from 'firebase/firestore'; // Import Firestore methods
import { firestore } from '../../firebaseConfig'; // Import Firestore configuration
import * as DocumentPicker from 'expo-document-picker'; // Use expo-document-picker
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker
import * as ImagePicker from 'expo-image-picker';

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
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false); // OCR loading state

  interface PdfFile {
    uri: string;
    name: string;
  }
  
  const [pdfFiles, setPdfFiles] = useState<{
    registrationDate: PdfFile | null;
    pollutionExpiry: PdfFile | null;
    aitpExpiry: PdfFile | null;
    insuranceExpiry: PdfFile | null;
    fitnessExpiry: PdfFile | null;
    permitPaidTill1: PdfFile | null;
    permitPaidTill2: PdfFile | null;
    taxPaidTill: PdfFile | null;
  }>({
    registrationDate: null,
    pollutionExpiry: null,
    aitpExpiry: null,
    insuranceExpiry: null,
    fitnessExpiry: null,
    permitPaidTill1: null,
    permitPaidTill2: null,
    taxPaidTill: null,
  });

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
    if (event.type === 'set' && date && selectedDateField) {
      setFormData((prev) => ({
        ...prev,
        [selectedDateField]: date.toISOString().split('T')[0], // Save date in YYYY-MM-DD format
      }));
    }
  };

  const clearDate = (field: keyof typeof formData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: '', // Clear the date
    }));
  };

  const openDatePicker = (field: keyof typeof formData) => {
    setSelectedDateField(field);
    setSelectedDate(formData[field] ? new Date(formData[field]) : new Date());
    setIsDatePickerVisible(true);
  };

  const handlePdfUpload = async (field: keyof typeof pdfFiles) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: false });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileUri = res.assets[0].uri;
        const fileName = res.assets[0].name;
        setPdfFiles((prev) => ({
          ...prev,
          [field]: { uri: fileUri, name: fileName },
        }));
      }
    } catch (err) {
      console.error('Error picking PDF:', err);
    }
  };

  const clearPdf = (field: keyof typeof pdfFiles) => {
    setPdfFiles((prev) => ({
      ...prev,
      [field]: null, // Clear the PDF
    }));
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


  const handleAddVehicle = async () => {
  if (!formData.vehicleNo) {
    setError('Vehicle number is mandatory.');
    vehicleNoRef.current?.focus();
    setTimeout(() => setError(''), 3000);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    return;
  }

  setIsSubmitting(true);
  const vehicleExists = await checkVehicleExists(formData.vehicleNo);
  if (vehicleExists) {
    setError('Vehicle with this number already exists.');
    setTimeout(() => setError(''), 3000);
    setIsSubmitting(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    return;
  }

  try {
    const uploadedPdfUrls: { [key: string]: string } = {};
    for (const [key, file] of Object.entries(pdfFiles)) {
      if (file) {
        console.log(`Uploading file for field: ${key}`);
        try {
          const secureUrl = await uploadToCloudinary({
            uri: file.uri,
            name: file.name,
            type: 'application/pdf', // Assuming all files are PDFs
          });
          uploadedPdfUrls[key] = secureUrl;
          console.log(`Successfully uploaded ${key}: ${secureUrl}`);
        } catch (error) {
          console.error(`Failed to upload ${key}:`, error);
          throw new Error(`Failed to upload ${key}`);
        }
      } else {
        console.log(`No file provided for ${key}, skipping upload.`);
      }
    }

    console.log('All files processed. Uploaded URLs:', uploadedPdfUrls);

    // Save formData and uploadedPdfUrls separately in Firestore
    const vehicleDocRef = doc(firestore, 'vehicles', formData.vehicleNo);
    await setDoc(vehicleDocRef, {
      ...formData, // Save formData as it is (with date fields)
      pdfUrls: uploadedPdfUrls, // Save uploaded PDF URLs in a separate field
    });

    const waterAndUreaDocRef = doc(firestore, 'waterandurea', formData.vehicleNo);
    await setDoc(waterAndUreaDocRef, {
      totalWater: 0,
      totalUrea: 0,
    });

    setIsSubmitting(false);
    Alert.alert('Success', 'Vehicle added successfully!');
    router.push('/home');
  } catch (error) {
    console.error('Error adding vehicle:', error);
    setError('Error adding vehicle. Please try again.');
    setTimeout(() => setError(''), 3000);
    setIsSubmitting(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }
};

const handleScanAndFill = async () => {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', /*'Scan with Camera',*/ 'Select Document'],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        // if (buttonIndex === 1) {
        //   await handleCameraScan();
        // } else 
        if (buttonIndex === 1) {
          await handleDocumentScan();
        }
      }
    );
  } else {
    setScanModalVisible(true);
  }
};

  // Helper to upload image to backend OCR API
  const uploadImageForOCR = async (imageUri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      // Extract file name and type
      const name = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
      const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      formData.append('image', {
        uri: imageUri,
        name,
        type,
      } as any);
      // Use deployed Render server URL for OCR API
      const response = await fetch('https://fleet-management-backend-kgxo.onrender.com/api/ocr', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Do NOT set Content-Type, let fetch set it for FormData
        },
      });
      // Use local server for OCR API during development
      // const response = await fetch('http://192.168.137.1/api/ocr', {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     'Accept': 'application/json',
      //     // Do NOT set Content-Type, let fetch set it for FormData
      //   },
      // });
      if (!response.ok) {
        throw new Error('OCR API error');
      }
      const json = await response.json();
      return json.text || null;
    } catch (err) {
      console.error('OCR upload error:', err);
      return null;
    }
  };

// Helper function to parse recognized text and autofill form fields
const parseAndFillForm = (lines: string[]) => {
  // Join all lines for easier regex matching
  const text = lines.join(' ');
  // Regex for vehicle number (e.g., MH12AB1234)
  const vehicleNoMatch = text.match(/([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i);
  // Regex for vehicle type (simple, e.g., Truck, Car, Bus, etc.)
  const vehicleTypeMatch = text.match(/(Truck|Car|Bus|Tempo|Van|Jeep|Auto|Tractor|Trailer)/i);
  // Regex for owner name (look for 'Owner' or 'Name' followed by a word or two)
  const ownerMatch = text.match(/(?:Owner|Name)\s*[:\-]?\s*([A-Za-z ]{3,})/i);

  setFormData((prev) => ({
    ...prev,
    vehicleNo: vehicleNoMatch ? vehicleNoMatch[1].toUpperCase() : prev.vehicleNo,
    vehicleType: vehicleTypeMatch ? vehicleTypeMatch[1] : prev.vehicleType,
    owner: ownerMatch ? ownerMatch[1].trim() : prev.owner,
  }));
};

// Helper to send OCR text to Gemini AI API and extract structured vehicle data
const extractVehicleDataWithGemini = async (ocrText: string): Promise<Partial<typeof formData> | null> => {
  try {
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBWGyUEs6hKXOBe43Dij7W789BBlWPvGV8';
    const prompt = `Extract the following vehicle details from this text and return as a JSON object with keys: vehicleNo, vehicleType, owner, registrationDate, pollutionExpiry, aitpExpiry, insuranceExpiry, fitnessExpiry, permitPaidTill1, permitPaidTill2, taxPaidTill.\nText: ${ocrText}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error details:', errorText);
      throw new Error('Gemini API error');
    }
    const json = await response.json();
    const aiText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) return null;
    const match = aiText.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (err) {
    console.error('Gemini AI extraction error:', err);
    return null;
  }
};


  const handleCameraScan = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is required to scan documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setOcrLoading(true);
      try {
        const text = await uploadImageForOCR(imageUri);
        if (text) {
         console.log('OCR Extracted Text:', text); // Log the extracted text before sending to Gemini
          // Send OCR text to Gemini AI for structured extraction
          const aiData = await extractVehicleDataWithGemini(text);
          setOcrLoading(false);
          if (aiData) {
            setFormData((prev) => ({ ...prev, ...aiData }));
            Alert.alert('Scan Success', 'Text extracted and form autofilled by AI.');
          } else {
            Alert.alert('AI Extraction Error', 'Failed to extract structured data from text.');
          }
        } else {
          setOcrLoading(false);
          Alert.alert('OCR Error', 'Failed to extract text from image.');
        }
      } catch (err) {
        setOcrLoading(false);
        Alert.alert('OCR/AI Error', 'Failed to extract and process text.');
      }
    }
  };

  const handleDocumentScan = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: false });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const imageUri = res.assets[0].uri;
      setOcrLoading(true);
      try {
        const text = await uploadImageForOCR(imageUri);
        if (text) {
          console.log('OCR Extracted Text:', text); // Log the extracted text before sending to Gemini
          // Send OCR text to Gemini AI for structured extraction
          const aiData = await extractVehicleDataWithGemini(text);
          setOcrLoading(false);
          if (aiData) {
            setFormData((prev) => ({ ...prev, ...aiData }));
            Alert.alert('Scan Success', 'Text extracted and form autofilled by AI.');
          } else {
            Alert.alert('AI Extraction Error', 'Failed to extract structured data from text.');
          }
        } else {
          setOcrLoading(false);
          Alert.alert('OCR Error', 'Failed to extract text from image.');
        }
      } catch (err) {
        setOcrLoading(false);
        Alert.alert('OCR/AI Error', 'Failed to extract and process text.');
      }
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
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('registrationDate')}
            >
              <Text style={styles.dateText}>
                {formData.registrationDate || 'Select Registration Date'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.registrationDate ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('registrationDate')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* PDF Upload for Registration Date */}
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('registrationDate')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.registrationDate ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.registrationDate && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.registrationDate.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('registrationDate')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>
          
        </FormSection>

        <FormSection title="Document Expiry Dates">
          {/* Pollution Expiry */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('pollutionExpiry')}
            >
              <Text style={styles.dateText}>
                {formData.pollutionExpiry || 'Select Pollution Expiry'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.pollutionExpiry ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('pollutionExpiry')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('pollutionExpiry')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.pollutionExpiry ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.pollutionExpiry && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.pollutionExpiry.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('pollutionExpiry')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* AITP Expiry */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('aitpExpiry')}
            >
              <Text style={styles.dateText}>
                {formData.aitpExpiry || 'Select AITP Expiry'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.aitpExpiry ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('aitpExpiry')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('aitpExpiry')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.aitpExpiry ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.aitpExpiry && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.aitpExpiry.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('aitpExpiry')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Insurance Expiry */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('insuranceExpiry')}
            >
              <Text style={styles.dateText}>
                {formData.insuranceExpiry || 'Select Insurance Expiry'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.insuranceExpiry ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('insuranceExpiry')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('insuranceExpiry')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.insuranceExpiry ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.insuranceExpiry && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.insuranceExpiry.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('insuranceExpiry')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Fitness Expiry */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('fitnessExpiry')}
            >
              <Text style={styles.dateText}>
                {formData.fitnessExpiry || 'Select Fitness Expiry'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.fitnessExpiry ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('fitnessExpiry')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('fitnessExpiry')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.fitnessExpiry ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.fitnessExpiry && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.fitnessExpiry.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('fitnessExpiry')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </FormSection>

        <FormSection title="Permit & Tax Details">
          {/* Permit Paid Till (1) */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('permitPaidTill1')}
            >
              <Text style={styles.dateText}>
                {formData.permitPaidTill1 || '1 year Permit Paid Till'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.permitPaidTill1 ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('permitPaidTill1')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('permitPaidTill1')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.permitPaidTill1 ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.permitPaidTill1 && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.permitPaidTill1.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('permitPaidTill1')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Permit Paid Till (2) */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('permitPaidTill2')}
            >
              <Text style={styles.dateText}>
                {formData.permitPaidTill2 || '5 year Permit Paid Till'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.permitPaidTill2 ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('permitPaidTill2')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('permitPaidTill2')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.permitPaidTill2 ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.permitPaidTill2 && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.permitPaidTill2.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('permitPaidTill2')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Tax Paid Till */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openDatePicker('taxPaidTill')}
            >
              <Text style={styles.dateText}>
                {formData.taxPaidTill || 'Select Tax Paid Till'}
              </Text>
              <Ionicons name="calendar" size={20} color="#0A3D91" />
            </TouchableOpacity>
            {formData.taxPaidTill ? (
              <TouchableOpacity
                style={styles.clearDateIcon}
                onPress={() => clearDate('taxPaidTill')}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => handlePdfUpload('taxPaidTill')}
            >
              <Text style={styles.pdfButtonText}>
                {pdfFiles.taxPaidTill ? 'Change PDF' : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {pdfFiles.taxPaidTill && (
              <>
                <Text style={styles.pdfFileName}>
                  {pdfFiles.taxPaidTill.name} {/* Display the file name */}
                </Text>
                <TouchableOpacity
                  style={styles.clearPdfIcon}
                  onPress={() => clearPdf('taxPaidTill')}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </FormSection>

        {/* Add Vehicle Button (already present) */}
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={handleScanAndFill}
          disabled={ocrLoading}
        >
          <Ionicons name="scan" size={20} color="#0A3D91" style={{ marginRight: 8 }} />
          <Text style={styles.scanButtonText}>{ocrLoading ? 'Scanning...' : 'Scan and Fill'}</Text>
          {ocrLoading && <ActivityIndicator size="small" color="#0A3D91" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
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

        {/* Android Modal for Scan Options */}
        <Modal
          visible={scanModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setScanModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 280 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Scan and Fill</Text>
              {/* <TouchableOpacity style={{ marginBottom: 16 }} onPress={async () => { setScanModalVisible(false); await handleCameraScan(); }}>
                <Text style={{ fontSize: 16, color: '#0A3D91' }}>Scan with Camera</Text>
              </TouchableOpacity> */}
              <TouchableOpacity style={{ marginBottom: 16 }} onPress={async () => { setScanModalVisible(false); await handleDocumentScan(); }}>
                <Text style={{ fontSize: 16, color: '#0A3D91' }}>Select Document</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Text style={{ fontSize: 16, color: '#DC2626' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#5A7184',
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    
    marginBottom: 15,
  },
  pdfButton: {
    backgroundColor: '#0A3D91',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearPdfIcon: {
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
  pdfFileName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2D3748',
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0A3D91',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  scanButtonText: {
    color: '#0A3D91',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddVehicle;