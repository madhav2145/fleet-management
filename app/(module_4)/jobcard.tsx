import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  Platform, 
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList
} from 'react-native';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import CustomDropdown from '../components/CustomDropdown';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type IssueTypeKey = 'engine' | 'electrical' | 'body' | 'tyre' | 'warranty' | 'other';

type IssueFields = {
  description: string;
  repaired: string;
  replaced: string;
};

type IssuesState = {
  engine: IssueFields;
  electrical: IssueFields;
  body: IssueFields;
  tyre: IssueFields;
  warranty: IssueFields;
  other: IssueFields;
};

type UnsolvedIssues = {
  engine: string;
  electrical: string;
  body: string;
  tyre: string;
  other: string;
};

const issueTypes: { key: IssueTypeKey; label: string; icon: string }[] = [
  { key: 'engine', label: 'Engine Work (Mechanical)', icon: 'settings' },
  { key: 'electrical', label: 'Electrical Work', icon: 'flash' },
  { key: 'body', label: 'Body Work', icon: 'car-sport' },
  { key: 'tyre', label: 'Tyre Work', icon: 'ellipse' },
  { key: 'warranty', label: 'Work Under Warranty', icon: 'shield-checkmark' },
  { key: 'other', label: 'Any Other Issue', icon: 'construct' },
];

export default function JobCard() {
  // General Info
  const [date] = useState<Date>(new Date());
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [vehicleCompany, setVehicleCompany] = useState('');
  const [kilometers, setKilometers] = useState('');

  // Maintenance Issues
  const [issues, setIssues] = useState<IssuesState>({
    engine: { description: '', repaired: '', replaced: '' },
    electrical: { description: '', repaired: '', replaced: '' },
    body: { description: '', repaired: '', replaced: '' },
    tyre: { description: '', repaired: '', replaced: '' },
    warranty: { description: '', repaired: '', replaced: '' },
    other: { description: '', repaired: '', replaced: '' },
  });

  // Unsolved Issues per work type
  const [unsolvedIssues, setUnsolvedIssues] = useState<UnsolvedIssues>({
    engine: '',
    electrical: '',
    body: '',
    tyre: '',
    other: '',
  });
  const [displayedUnsolvedIssues, setDisplayedUnsolvedIssues] = useState<UnsolvedIssues | null>(null);

  // Dispatch Info
  const [dispatchDate, setDispatchDate] = useState<Date | null>(null);
  const [signDriver, setSignDriver] = useState('');
  const [signOperator, setSignOperator] = useState('');
  const [signManager, setSignManager] = useState('');

  // Vehicle dropdown state
  const [vehicleItems, setVehicleItems] = useState<{ label: string; value: string }[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // Driver dropdown state
  const [driverItems, setDriverItems] = useState<{ label: string; value: string }[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [driverNumberItems, setDriverNumberItems] = useState<{ label: string; value: string }[]>([]);
  const [selectedDriverNumber, setSelectedDriverNumber] = useState<string | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);

  // Modal and part selection state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'repaired' | 'replaced' | null>(null);
  const [modalIssue, setModalIssue] = useState<IssueTypeKey | null>(null);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partSearch, setPartSearch] = useState('');
  const [newPartName, setNewPartName] = useState('');

  // Remove hardcoded mechanicalParts and electricalParts
  const [mechanicalParts, setMechanicalParts] = useState<{ label: string; value: string }[]>([]);
  const [electricalParts, setElectricalParts] = useState<{ label: string; value: string }[]>([]);

  // Add state to track units used for each selected part
  const [usedUnits, setUsedUnits] = useState<{ [part: string]: number }>({});

  // Add state to hold the raw inventory objects for lookup
  const [mechanicalInventory, setMechanicalInventory] = useState<any>({});
  const [electricalInventory, setElectricalInventory] = useState<any>({});

  useEffect(() => {
    const fetchVehicles = async () => {
      setVehicleLoading(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, 'vehicles'));
        let items: { label: string; value: string }[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          items.push({ label: data.vehicleNo || doc.id, value: doc.id });
        });
        items = items.sort((a, b) => a.label.localeCompare(b.label));
        setVehicleItems(items);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setVehicleLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    setDriverLoading(true);
    const unsubscribe = onSnapshot(collection(firestore, 'drivers'), (snapshot) => {
      const nameItems: { label: string; value: string }[] = [];
      const numberItems: { label: string; value: string }[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.name && data.number) {
          nameItems.push({ label: data.name, value: docSnap.id });
          numberItems.push({ label: data.number, value: docSnap.id });
        }
      });
      setDriverItems(nameItems);
      setDriverNumberItems(numberItems);
      setDriverLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedDriver === '') {
      setSelectedDriverNumber('');
      setDriverName('');
      return;
    }
    if (selectedDriver) {
      const driver = driverItems.find(d => d.value === selectedDriver);
      if (driver) {
        setDriverName(driver.label);
        const number = driverNumberItems.find(n => n.value === selectedDriver);
        if (number) setSelectedDriverNumber(number.value);
      }
    }
  }, [selectedDriver]);

  useEffect(() => {
    if (selectedDriverNumber === '') {
      setSelectedDriver('');
      setDriverName('');
      return;
    }
    if (selectedDriverNumber) {
      const number = driverNumberItems.find(n => n.value === selectedDriverNumber);
      if (number) {
        const name = driverItems.find(d => d.value === selectedDriverNumber);
        if (name) {
          setDriverName(name.label);
          setSelectedDriver(name.value);
        }
      }
    }
  }, [selectedDriverNumber]);

  useEffect(() => {
    const fetchUnsolvedIssues = async () => {
      if (!vehicleNumber) {
        setDisplayedUnsolvedIssues(null);
        setUnsolvedIssues({ engine: '', electrical: '', body: '', tyre: '', other: '' });
        return;
      }
      const selectedVehicleItem = vehicleItems.find(item => item.value === vehicleNumber);
      const vehicleNo = selectedVehicleItem ? selectedVehicleItem.label : vehicleNumber;
      const jobcardRef = doc(firestore, 'jobcard', vehicleNo);
      const jobcardSnap = await getDoc(jobcardRef);
      if (jobcardSnap.exists()) {
        const data = jobcardSnap.data();
        if (data.unsolvedIssues) {
          setDisplayedUnsolvedIssues(data.unsolvedIssues);
          setUnsolvedIssues(data.unsolvedIssues);
        } else {
          setDisplayedUnsolvedIssues(null);
          setUnsolvedIssues({ engine: '', electrical: '', body: '', tyre: '', other: '' });
        }
      } else {
        setDisplayedUnsolvedIssues(null);
        setUnsolvedIssues({ engine: '', electrical: '', body: '', tyre: '', other: '' });
      }
    };
    fetchUnsolvedIssues();
  }, [vehicleNumber, vehicleItems]);

  // Fetch inventory parts from Firestore
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const mechDoc = await getDoc(doc(firestore, 'inventory', 'mechanical'));
        const elecDoc = await getDoc(doc(firestore, 'inventory', 'electrical'));
        if (mechDoc.exists()) {
          const data = mechDoc.data();
          const sortedMech = Object.keys(data)
            .map(name => ({ label: name, value: name }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setMechanicalParts(sortedMech);
          setMechanicalInventory(data);
        } else {
          setMechanicalParts([]);
          setMechanicalInventory({});
        }
        if (elecDoc.exists()) {
          const data = elecDoc.data();
          const sortedElec = Object.keys(data)
            .map(name => ({ label: name, value: name }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setElectricalParts(sortedElec);
          setElectricalInventory(data);
        } else {
          setElectricalParts([]);
          setElectricalInventory({});
        }
      } catch {
        setMechanicalParts([]);
        setElectricalParts([]);
        setMechanicalInventory({});
        setElectricalInventory({});
      }
    };
    fetchInventory();
  }, []);

  const handleIssueChange = (type: IssueTypeKey, field: keyof IssueFields, value: string) => {
    setIssues(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleCreateJobcard = async () => {
    if (!vehicleNumber) {
      alert('Please select a vehicle number.');
      return;
    }
    try {
      const selectedVehicleItem = vehicleItems.find(item => item.value === vehicleNumber);
      const vehicleNo = selectedVehicleItem ? selectedVehicleItem.label : vehicleNumber;
      const jobcardRef = doc(firestore, 'jobcard', vehicleNo);
      const jobcardSnap = await getDoc(jobcardRef);
      const dateKey = `jobcard_${date.toISOString().slice(0, 10)}`;
      
      if (jobcardSnap.exists()) {
        const data = jobcardSnap.data();
        const jobcardKeys = Object.keys(data).filter(k => k.startsWith('jobcard_'));
        for (const key of jobcardKeys) {
          const jc = data[key];
          if (jc && jc.dispatchDate === null) {
            alert('A previous jobcard for this vehicle is still ongoing. Please complete it before creating a new one.');
            return;
          }
        }
      }

      // Set created date to now, dispatchDate to null (to be filled on completion)
      const now = new Date();
      // Set driverContact from selectedDriverNumber (dropdown value)
      let contact = driverContact;
      if (!contact && selectedDriverNumber) {
        const found = driverNumberItems.find(d => d.value === selectedDriverNumber);
        contact = found ? found.label : '';
      }
      const jobcardData = {
        date: now.toISOString(),
        driverName,
        driverContact: contact,
        vehicleCompany,
        kilometers,
        dispatchDate: null, // Not filled at creation
        signDriver,
        signOperator,
        signManager,
        issues,
        unsolvedIssues,
      };

      if (!jobcardSnap.exists()) {
        await setDoc(jobcardRef, {
          [dateKey]: jobcardData,
          unsolvedIssues,
        });
      } else {
        await updateDoc(jobcardRef, {
          [dateKey]: jobcardData,
          unsolvedIssues,
        });
      }

      // Show success alert, then clear fields WITHOUT confirmation
      if (Platform.OS === 'web') {
        alert('Jobcard created successfully!');
        clearAllFieldsDirectly();
      } else {
        Alert.alert(
          'Success',
          'Jobcard created successfully!',
          [
            { text: 'OK', onPress: clearAllFieldsDirectly }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating jobcard:', error);
      alert('Failed to create jobcard.');
    }
  };

  // Helper to clear all fields without confirmation (used after successful creation)
  const clearAllFieldsDirectly = () => {
    setVehicleNumber('');
    setSelectedVehicle(null);
    setDriverName('');
    setDriverContact('');
    setVehicleCompany('');
    setKilometers('');
    setIssues({
      engine: { description: '', repaired: '', replaced: '' },
      electrical: { description: '', repaired: '', replaced: '' },
      body: { description: '', repaired: '', replaced: '' },
      tyre: { description: '', repaired: '', replaced: '' },
      warranty: { description: '', repaired: '', replaced: '' },
      other: { description: '', repaired: '', replaced: '' },
    });
    setUnsolvedIssues({
      engine: '',
      electrical: '',
      body: '',
      tyre: '',
      other: '',
    });
    setDispatchDate(null);
    setSignDriver('');
    setSignOperator('');
    setSignManager('');
    setSelectedDriver('');
    setSelectedDriverNumber('');
  };

  const handleClearAllFields = () => {
    const clearFields = () => {
      clearAllFieldsDirectly();
    };

    if (Platform.OS === 'web') {
      if (window.confirm && typeof window.confirm === 'function') {
        if (!window.confirm('Are you sure you want to clear all fields?')) return;
      }
      clearFields();
    } else {
      Alert.alert(
        'Clear All Fields',
        'Are you sure you want to clear all fields?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: clearFields },
        ]
      );
    }
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    multiline = false,
    keyboardType: 'default' | 'numeric' = 'default'
  ) => (
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  );

  // Helper to open modal for part selection
  const openPartModal = (issue: IssueTypeKey, type: 'repaired' | 'replaced') => {
    setModalIssue(issue);
    setModalType(type);
    // Preselect already selected parts
    setSelectedParts(
      issues[issue][type]
        ? issues[issue][type].split(',').map(s => s.trim()).filter(Boolean)
        : []
    );
    setModalVisible(true);
  };

  // Helper to save selected parts from modal
  const saveSelectedParts = () => {
    if (modalIssue && modalType) {
      setIssues(prev => ({
        ...prev,
        [modalIssue]: {
          ...prev[modalIssue],
          [modalType]: selectedParts.map(p => `${p} (x${usedUnits[p] || 1})`).join(', '),
        },
      }));
    }
    setModalVisible(false);
    setUsedUnits({});
  };

  // When adding a new part from the modal, add it to Firestore and update the list
  const handleAddNewPart = async () => {
    if (!newPartName.trim()) return;
    const partName = newPartName.trim();
    try {
      if (modalIssue === 'engine') {
        await updateDoc(doc(firestore, 'inventory', 'mechanical'), { [partName]: 0 });
        setMechanicalParts(prev =>
          [...prev, { label: partName, value: partName }].sort((a, b) => a.label.localeCompare(b.label))
        );
        setMechanicalInventory((prev: any) => ({ ...prev, [partName]: 0 }));
      } else if (modalIssue === 'electrical') {
        await updateDoc(doc(firestore, 'inventory', 'electrical'), { [partName]: 0 });
        setElectricalParts(prev =>
          [...prev, { label: partName, value: partName }].sort((a, b) => a.label.localeCompare(b.label))
        );
        setElectricalInventory((prev: any) => ({ ...prev, [partName]: 0 }));
      }
      setSelectedParts(prev => [...prev, partName]);
      setNewPartName('');
      setPartSearch('');
    } catch {
      // fallback: try setDoc if doc doesn't exist
      if (modalIssue === 'engine') {
        await setDoc(doc(firestore, 'inventory', 'mechanical'), { [partName]: 0 }, { merge: true });
        setMechanicalParts(prev =>
          [...prev, { label: partName, value: partName }].sort((a, b) => a.label.localeCompare(b.label))
        );
        setMechanicalInventory((prev: any) => ({ ...prev, [partName]: 0 }));
      } else if (modalIssue === 'electrical') {
        await setDoc(doc(firestore, 'inventory', 'electrical'), { [partName]: 0 }, { merge: true });
        setElectricalParts(prev =>
          [...prev, { label: partName, value: partName }].sort((a, b) => a.label.localeCompare(b.label))
        );
        setElectricalInventory((prev: any) => ({ ...prev, [partName]: 0 }));
      }
      setSelectedParts(prev => [...prev, partName]);
      setNewPartName('');
      setPartSearch('');
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Vehicle Maintenance Log</Text>
        {/* <Text style={styles.subtitle}>Create and manage job cards efficiently</Text> */}
      </View>

      {/* General Vehicle Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📋</Text>
          <Text style={styles.sectionTitle}>General Vehicle Information</Text>
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Vehicle Number</Text>
          <CustomDropdown
            items={vehicleItems}
            selectedValue={vehicleNumber}
            onSelect={setVehicleNumber}
            placeholder={vehicleLoading ? 'Loading vehicles...' : 'Select a vehicle number'}
            searchable={true}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Driver Name</Text>
          <CustomDropdown
            items={driverItems}
            selectedValue={selectedDriver}
            onSelect={setSelectedDriver}
            placeholder={driverLoading ? 'Loading drivers...' : 'Select driver name'}
            searchable={true}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Driver Contact</Text>
          <CustomDropdown
            items={driverNumberItems}
            selectedValue={selectedDriverNumber}
            onSelect={setSelectedDriverNumber}
            placeholder={driverLoading ? 'Loading numbers...' : 'Select driver number'}
            searchable={true}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Vehicle Company</Text>
          {renderInput('Enter vehicle company', vehicleCompany, setVehicleCompany)}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Kilometers Driven</Text>
          {renderInput('Enter kilometers', kilometers, setKilometers, false, 'numeric')}
        </View>
      </View>

      {/* Maintenance Issues Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🔧</Text>
          <Text style={styles.sectionTitle}>Maintenance Issues</Text>
        </View>
        
        {issueTypes.map(issue => (
          <View key={issue.key} style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <Ionicons name={issue.icon as any} size={20} color="#059669" />
              <Text style={styles.issueTitle}>{issue.label}</Text>
            </View>
            
            <View style={styles.issueFields}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Issue Description</Text>
                {renderInput(
                  'Describe the issue in detail',
                  issues[issue.key].description,
                  text => handleIssueChange(issue.key, 'description', text),
                  true
                )}
              </View>

              {/* For mechanical and electrical, use part selector for repaired/replaced */}
              {['engine', 'electrical'].includes(issue.key) ? (
                <>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Items Repaired</Text>
                    <TouchableOpacity
                      style={[styles.input, { minHeight: 52, justifyContent: 'center' }]}
                      onPress={() => openPartModal(issue.key, 'repaired')}
                    >
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                        {issues[issue.key].repaired
                          ? issues[issue.key].repaired.split(',').map((partStr, idx) => {
                              const match = partStr.match(/^(.*?)(?: \(x(\d+)\))?$/);
                              const partName = match ? match[1].trim() : partStr.trim();
                              const used = match && match[2] ? parseInt(match[2]) : 1;
                              const units = issue.key === 'engine' ? mechanicalInventory[partName] : electricalInventory[partName];
                              const color = typeof units === 'number' && units > 0 ? '#059669' : '#dc2626';
                              return (
                                <Text key={idx} style={{ color, fontWeight: 'bold', marginRight: 8 }}>
                                  {partName} (x{used})
                                </Text>
                              );
                            })
                          : <Text style={{ color: '#94a3b8' }}>Select repaired parts</Text>}
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Items Replaced</Text>
                    <TouchableOpacity
                      style={[styles.input, { minHeight: 52, justifyContent: 'center' }]}
                      onPress={() => openPartModal(issue.key, 'replaced')}
                    >
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                        {issues[issue.key].replaced
                          ? issues[issue.key].replaced.split(',').map((partStr, idx) => {
                              const match = partStr.match(/^(.*?)(?: \(x(\d+)\))?$/);
                              const partName = match ? match[1].trim() : partStr.trim();
                              const used = match && match[2] ? parseInt(match[2]) : 1;
                              const units = issue.key === 'engine' ? mechanicalInventory[partName] : electricalInventory[partName];
                              const color = typeof units === 'number' && units > 0 ? '#059669' : '#dc2626';
                              return (
                                <Text key={idx} style={{ color, fontWeight: 'bold', marginRight: 8 }}>
                                  {partName} (x{used})
                                </Text>
                              );
                            })
                          : <Text style={{ color: '#94a3b8' }}>Select replaced parts</Text>}
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Items Repaired</Text>
                    {renderInput(
                      'List items that were repaired',
                      issues[issue.key].repaired,
                      text => handleIssueChange(issue.key, 'repaired', text),
                      true
                    )}
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Items Replaced</Text>
                    {renderInput(
                      'List items that were replaced',
                      issues[issue.key].replaced,
                      text => handleIssueChange(issue.key, 'replaced', text),
                      true
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Unsolved Issues Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>⚠️</Text>
          <Text style={styles.sectionTitle}>Unsolved Issues</Text>
        </View>
        
        <View style={styles.unsolvedCard}>
          {issueTypes.filter(i => i.key !== 'warranty').map(issue => (
            <View key={issue.key} style={styles.fieldContainer}>
              <View style={styles.unsolvedFieldHeader}>
                <Ionicons name={issue.icon as any} size={20} color="#DC2626" />
                <Text style={styles.fieldLabel}>{issue.label}</Text>
              </View>
              {renderInput(
                `Enter unsolved issues for ${issue.label}`,
                unsolvedIssues[issue.key as keyof UnsolvedIssues],
                text => setUnsolvedIssues(prev => ({ ...prev, [issue.key]: text })),
                true
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Dispatch & Signatures Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>✍️</Text>
          <Text style={styles.sectionTitle}>Dispatch & Signatures</Text>
        </View>
        
        <View style={styles.dispatchCard}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Driver Signature</Text>
            {renderInput('Driver name for signature', signDriver, setSignDriver)}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Operator Signature</Text>
            {renderInput('Operator name for signature', signOperator, setSignOperator)}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Manager Signature</Text>
            {renderInput('Manager name for signature', signManager, setSignManager)}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleCreateJobcard()}>
          <Text style={styles.primaryButtonText}>✅ Create Jobcard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => handleClearAllFields()}>
          <Text style={styles.secondaryButtonText}>🗑️ Clear All Fields</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for part selection */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, maxHeight: 440 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#0A3D91' }}>
              Select Parts
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 15 }}
              placeholder="Search parts..."
              value={partSearch}
              onChangeText={setPartSearch}
            />
            <FlatList
              data={(modalIssue === 'engine' ? mechanicalParts : electricalParts).filter(p => p.label.toLowerCase().includes(partSearch.toLowerCase()))}
              keyExtractor={item => item.value}
              renderItem={({ item }) => {
                const units = modalIssue === 'engine' ? mechanicalInventory[item.value] : electricalInventory[item.value];
                const color = typeof units === 'number' && units > 0 ? '#059669' : '#dc2626';
                return (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                    onPress={() => {
                      if (selectedParts.includes(item.value)) {
                        setSelectedParts(selectedParts.filter(p => p !== item.value));
                      } else {
                        setSelectedParts([...selectedParts, item.value]);
                      }
                    }}
                  >
                    <Ionicons
                      name={selectedParts.includes(item.value) ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={selectedParts.includes(item.value) ? color : '#64748b'}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ fontSize: 16, color }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                partSearch.trim() ? (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, width: 180, fontSize: 15, marginBottom: 8 }}
                      placeholder="Add new part"
                      value={newPartName}
                      onChangeText={setNewPartName}
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: newPartName.trim() ? '#2563EB' : '#9CA3AF',
                        paddingVertical: 10,
                        paddingHorizontal: 24,
                        borderRadius: 8,
                        marginTop: 4,
                        opacity: newPartName.trim() ? 1 : 0.6,
                      }}
                      disabled={!newPartName.trim()}
                      onPress={handleAddNewPart}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 20 }}>No parts found</Text>
                )
              }
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#dc2626', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSelectedParts}>
                <Text style={{ color: '#2563eb', fontSize: 16, fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Color palette
const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#64748b',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    fontSize: 25,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
    minHeight: 52,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  issueCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  issueIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  issueFields: {
    gap: 12,
  },
  unsolvedCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  unsolvedFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dispatchCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateDisplay: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 52,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  buttonContainer: {
    gap: 16,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.danger,
  },
  secondaryButtonText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '600',
  },
});