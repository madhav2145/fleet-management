import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function InventorySearch() {
  const [category, setCategory] = useState<'mechanical' | 'electrical'>('mechanical');
  const [search, setSearch] = useState('');
  const [parts, setParts] = useState<{ mechanical: any[]; electrical: any[] }>({ mechanical: [], electrical: [] });
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartUnits, setNewPartUnits] = useState('1');

  // Fetch inventory from Firestore in real-time
  useEffect(() => {
    setLoading(true);
    const docRef = doc(firestore, 'inventory', category);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const arr = Object.entries(data)
          .map(([name, units]) => ({ id: name, name, units }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setParts(prev => ({ ...prev, [category]: arr }));
      } else {
        setParts(prev => ({ ...prev, [category]: [] }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [category]);

  // Filtered parts based on search and category
  const filteredParts = parts[category].filter(part =>
    part.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Add new part to Firestore
  const handleAddPart = async () => {
    if (!newPartName.trim() || isNaN(Number(newPartUnits)) || Number(newPartUnits) < 0) return;
    const partName = newPartName.trim();
    const units = Number(newPartUnits);
    try {
      const docRef = doc(firestore, 'inventory', category);
      // Always fetch the latest data to avoid overwriting
      const docSnap = await getDoc(docRef);
      let updateObj = {};
      if (docSnap.exists()) {
        updateObj = { ...docSnap.data(), [partName]: units };
      } else {
        updateObj = { [partName]: units };
      }
      await setDoc(docRef, updateObj);
    } catch (e) {
      // fallback: do nothing
    }
    setNewPartName('');
    setNewPartUnits('1');
    setAddModalVisible(false);
  };

  // Update units in Firestore
  const handleUnitChange = async (id: string, units: number) => {
    const updated = parts[category].map(part =>
      part.id === id ? { ...part, units } : part
    );
    setParts(prev => ({ ...prev, [category]: updated }));
    try {
      const docRef = doc(firestore, 'inventory', category);
      await updateDoc(docRef, { [id]: units });
    } catch (e) {
      // fallback: do nothing
    }
  };

  const renderPart = ({ item }: { item: { id: string; name: string; units: number } }) => (
    <View style={styles.partRow}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1}>
        <Text style={styles.partName}>
          {item.name}
        </Text>
      </TouchableOpacity>
      <View style={styles.unitSelector}>
        <TouchableOpacity
          onPress={() => handleUnitChange(item.id, Math.max(0, item.units - 1))}
          style={styles.unitButton}
        >
          <Ionicons name="remove-circle-outline" size={22} color="#0A3D91" />
        </TouchableOpacity>
        <Text style={styles.unitText}>{item.units}</Text>
        <TouchableOpacity
          onPress={() => handleUnitChange(item.id, item.units + 1)}
          style={styles.unitButton}
        >
          <Ionicons name="add-circle-outline" size={22} color="#0A3D91" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Search</Text>
        <Text style={styles.subtitle}>Search and manage your parts inventory</Text>
      </View>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, category === 'mechanical' && styles.toggleButtonActive]}
          onPress={() => setCategory('mechanical')}
        >
          <Text style={[styles.toggleButtonText, category === 'mechanical' && styles.toggleButtonTextActive]}>Mechanical</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, category === 'electrical' && styles.toggleButtonActive]}
          onPress={() => setCategory('electrical')}
        >
          <Text style={[styles.toggleButtonText, category === 'electrical' && styles.toggleButtonTextActive]}>Electrical</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${category} parts...`}
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>{filteredParts.length} Parts Found</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Part</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <Text style={{ color: '#6B7280', fontSize: 16 }}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredParts}
            keyExtractor={item => item.id}
            renderItem={renderPart}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Parts Found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search or add a new part</Text>
              </View>
            }
          />
        )}
      </View>
      {/* Add Part Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Part</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Part Name"
              value={newPartName}
              onChangeText={setNewPartName}
              autoFocus
            />
            <View style={styles.unitInputRow}>
              <Text style={styles.unitInputLabel}>Units:</Text>
              <TextInput
                style={styles.unitInput}
                placeholder="1"
                value={newPartUnits}
                onChangeText={setNewPartUnits}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddPart}
                disabled={!newPartName.trim() || isNaN(Number(newPartUnits)) || Number(newPartUnits) < 1}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 2 },
  subtitle: { fontSize: 15, color: '#6B7280', fontWeight: '400' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  toggleButton: { flex: 1, paddingVertical: 8, marginHorizontal: 8, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#3B82F6' },
  toggleButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  toggleButtonTextActive: { color: '#FFFFFF' },
  searchSection: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 44 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '400' },
  clearButton: { padding: 4 },
  resultsSection: { flex: 1, paddingTop: 10 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A3D91', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginLeft: 6 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  partRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
  partName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    maxWidth: 160, // or '70%' if you want responsive
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  unitSelector: { flexDirection: 'row', alignItems: 'center' },
  unitButton: { padding: 4 },
  unitText: { fontSize: 16, fontWeight: '600', color: '#0A3D91', marginHorizontal: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#0A3D91' },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 14, color: '#111827' },
  unitInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  unitInputLabel: { fontSize: 15, color: '#374151', marginRight: 8 },
  unitInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, width: 60, fontSize: 15, color: '#111827' },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#F3F4F6', marginLeft: 10 },
  modalButtonPrimary: { backgroundColor: '#0A3D91' },
  modalButtonText: { fontSize: 15, color: '#374151', fontWeight: 'bold' },
  modalButtonTextPrimary: { color: '#FFFFFF' },
});
