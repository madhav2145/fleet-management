import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

interface Driver {
  id: string;
  name: string;
  number: string;
}

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'drivers'), (snapshot) => {
      const list: Driver[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({ id: docSnap.id, name: data.name, number: data.number });
      });
      setDrivers(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddDriver = async () => {
    if (!name.trim() || !number.trim()) {
      Alert.alert('Error', 'Please enter both name and number.');
      return;
    }
    // Only allow exactly 10 digits, starting with 6-9
    if (number.length !== 10 || !/^[6-9][0-9]{9}$/.test(number)) {
      Alert.alert('Error', 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      return;
    }
    setAdding(true);
    try {
      await addDoc(collection(firestore, 'drivers'), { name: name.trim(), number: number.trim() });
      setName('');
      setNumber('');
    } catch (e) {
      Alert.alert('Error', 'Failed to add driver.');
    }
    setAdding(false);
  };

  const handleDeleteDriver = async (id: string) => {
    Alert.alert('Delete Driver', 'Are you sure you want to delete this driver?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(firestore, 'drivers', id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete driver.');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Drivers</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Driver Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Driver Number"
          value={number}
          onChangeText={text => {
            // Allow only numbers, no length restriction in input
            const cleaned = text.replace(/[^0-9]/g, '');
            setNumber(cleaned);
          }}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddDriver} disabled={adding}>
          <Text style={styles.addButtonText}>{adding ? 'Adding...' : 'Add Driver'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.listHeader}>Driver List</Text>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.driverItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{item.name}</Text>
                <Text style={styles.driverNumber}>{item.number}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDriver(item.id)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No drivers found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#0A3D91' },
  form: { marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  addButton: { backgroundColor: '#007bff', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  listHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333' },
  loading: { textAlign: 'center', marginTop: 20 },
  driverItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 14, marginBottom: 12, backgroundColor: '#f9f9f9' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#0A3D91' },
  driverNumber: { fontSize: 15, color: '#555', marginTop: 2 },
  deleteButton: { backgroundColor: '#DC2626', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 10 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#888', marginTop: 30 },
});

export default Drivers;
