import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

const AddVehicle: React.FC = () => {
  const [vehicleNo, setVehicleNo] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({
    Cap: '0',
    'Seat Cover': '0',
    'Pillow Cover': '0',
    Bedsheet: '0',
    Blanket: '0',
    Curtains: '0',
  });
  const [defectedItems, setDefectedItems] = useState<
    { piece: string; count: string; issue: string; photos: string[] }[]
  >([]);
  const [selectedDefectedItem, setSelectedDefectedItem] = useState('');
  const [selectedDefectedCount, setSelectedDefectedCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const checkVehicleExists = async (vehicleNo: string): Promise<boolean> => {
    try {
      const querySnapshot = await getDocs(
        query(collection(firestore, 'laundry'), where('vehicleNo', '==', vehicleNo.trim()))
      );
      return !querySnapshot.empty; // Return true if a document exists
    } catch (error) {
      console.error('Error checking vehicle existence:', error);
      throw error;
    }
  };

  const handlePickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setDefectedItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].photos = [...updatedItems[index].photos, result.assets[0].uri];
        return updatedItems;
      });
    }
  };

  const handleAddDefectedItem = () => {
    if (!selectedDefectedItem || !selectedDefectedCount) {
      Alert.alert('Error', 'Please select an item and the number of items.');
      return;
    }

    // Check if the item already exists in the defected items list
    const existingItem = defectedItems.find(
      (item) => item.piece === selectedDefectedItem
    );
    if (existingItem) {
      Alert.alert('Error', 'This item already exists in the defected items list.');
      return;
    }

    setDefectedItems((prevItems) => [
      ...prevItems,
      {
        piece: selectedDefectedItem,
        count: selectedDefectedCount,
        issue: '',
        photos: [],
      },
    ]);

    // Reset the dropdowns
    setSelectedDefectedItem('');
    setSelectedDefectedCount('1');
  };

  const handleDeleteDefectedItem = (index: number) => {
    setDefectedItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleRemovePhoto = (itemIndex: number, photoIndex: number) => {
    setDefectedItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[itemIndex].photos = updatedItems[itemIndex].photos.filter(
        (_, index) => index !== photoIndex
      );
      return updatedItems;
    });
  };

  const handleSubmit = async () => {
    if (!vehicleNo) {
      Alert.alert('Error', 'Please enter the vehicle number.');
      return;
    }

    const formData = {
      vehicleNo,
      items: itemQuantities,
      defectedItems,
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSubmitting(true);

      // Check if the vehicle number already exists
      const vehicleExists = await checkVehicleExists(formData.vehicleNo);
      if (vehicleExists) {
        Alert.alert('Error', 'Vehicle with this number already exists.');
        setIsSubmitting(false);
        return;
      }

      // Save data to Firestore
      await addDoc(collection(firestore, 'laundry'), formData);
      Alert.alert('Success', 'Vehicle details submitted successfully!');

      // Reset form fields
      setVehicleNo('');
      setItemQuantities({
        Cap: '0',
        'Seat Cover': '0',
        'Pillow Cover': '0',
        Bedsheet: '0',
        Blanket: '0',
        Curtains: '0',
      });
      setDefectedItems([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', 'Failed to submit vehicle details. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} ref={scrollViewRef}>
      <Text style={styles.title}>Add Vehicle Details</Text>

      {/* Vehicle Number */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Vehicle No</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Vehicle Number"
          value={vehicleNo}
          onChangeText={setVehicleNo}
        />
      </View>

      {/* Items Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Items</Text>
        {Object.keys(itemQuantities).map((item) => (
          <View key={item} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{item}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={itemQuantities[item]}
                onValueChange={(value) =>
                  setItemQuantities((prev) => ({ ...prev, [item]: value }))
                }
                style={styles.picker}
              >
                {Array.from({ length: 51 }, (_, i) => (
                  <Picker.Item key={i} label={`${i}`} value={`${i}`} />
                ))}
              </Picker>
            </View>
          </View>
        ))}
      </View>

      {/* Defected Items Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Defected Items</Text>

        {/* Dropdowns for Defected Items */}
        <View style={styles.itemRow}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDefectedItem}
              onValueChange={(value) => setSelectedDefectedItem(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Item" value="" />
              <Picker.Item label="Cap" value="Cap" />
              <Picker.Item label="Seat Cover" value="Seat Cover" />
              <Picker.Item label="Pillow Cover" value="Pillow Cover" />
              <Picker.Item label="Bedsheet" value="Bedsheet" />
              <Picker.Item label="Blanket" value="Blanket" />
              <Picker.Item label="Curtains" value="Curtains" />
            </Picker>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDefectedCount}
              onValueChange={(value) => setSelectedDefectedCount(value)}
              style={styles.picker}
            >
              {Array.from({ length: 51 }, (_, i) => (
                <Picker.Item key={i} label={`${i}`} value={`${i}`} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Add Defected Item Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddDefectedItem}>
          <Text style={styles.addButtonText}>Add Defected Item</Text>
        </TouchableOpacity>

        {/* List of Defected Items */}
        {defectedItems.map((item, index) => (
          <View key={index} style={styles.defectedItemCard}>
            <Text style={styles.itemLabel}>
              {item.piece} - {item.count} items
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue"
              value={item.issue}
              onChangeText={(text) =>
                setDefectedItems((prevItems) => {
                  const updatedItems = [...prevItems];
                  updatedItems[index].issue = text;
                  return updatedItems;
                })
              }
              multiline
            />
            <TouchableOpacity onPress={() => handlePickImage(index)}>
              <Text style={styles.uploadText}>Add Photo</Text>
            </TouchableOpacity>
            <View style={styles.photosContainer}>
              {item.photos.map((photo, photoIndex) => (
                <View key={photoIndex} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index, photoIndex)}
                  >
                    <Text style={styles.removePhotoText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => handleDeleteDefectedItem(index)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A3D91',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5A7184',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50, // Matches the height of the container
    width: '100%', // Ensures the dropdown takes full width
    fontSize: 16, // Ensures the text is readable
    color: '#2D3748', // Sets the text color
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 16,
    color: '#0A3D91',
    flex: 1,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden', // Ensures the dropdown is clipped properly
    height: 50, // Adjust the height to ensure the dropdown is fully visible
    justifyContent: 'center', // Centers the dropdown text vertically
    paddingHorizontal: 8, // Adds padding to prevent text cutoff
  },
  addButton: {
    backgroundColor: '#D01C1F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  defectedItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    height: 100,
    textAlignVertical: 'top',
  },
  uploadText: {
    color: '#0A3D91',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteText: {
    fontSize: 14,
    color: '#D01C1F',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#0A3D91',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 25,
    
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  removePhotoText: {
    color: '#D01C1F',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#D01C1F',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoButtonText: { // Renamed to avoid duplication
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AddVehicle;