import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, BackHandler, Dimensions, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

interface JobCardData {
  id: string;
  vehicleNumber: string;
  date: string;
  dispatchDate?: string | null;
  driverName?: string;
  driverContact?: string;
  vehicleCompany?: string;
  kilometers?: string;
  issues?: any;
  unsolvedIssues?: any;
  signDriver?: string;
  signOperator?: string;
  signManager?: string;
}

interface Details4_1Props {
  id?: string;
  onBack?: () => void;
}

const Details4_1: React.FC<Details4_1Props> = (props) => {
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ id: string }>();
  const id = props.id || routeParams.id;
  const onBack = props.onBack;
  const [job, setJob] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<JobCardData | null>(null);
  const [closing, setClosing] = useState(false);
  const [editingIssues, setEditingIssues] = useState<any | null>(null);
  const [driverContact, setDriverContact] = useState<string | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'repaired' | 'replaced' | null>(null);
  const [modalIssue, setModalIssue] = useState<string | null>(null);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partSearch, setPartSearch] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [mechanicalParts, setMechanicalParts] = useState<{ label: string; value: string }[]>([]);
  const [electricalParts, setElectricalParts] = useState<{ label: string; value: string }[]>([]);
  // Add state to hold the raw inventory objects for lookup
  const [mechanicalInventory, setMechanicalInventory] = useState<any>({});
  const [electricalInventory, setElectricalInventory] = useState<any>({});

  // Helper: parse id to get vehicleNumber and jobcardKey
  function parseId(id: string | undefined): { vehicleNumber: string; jobcardKey: string } | null {
    if (!id) return null;
    const idx = id.indexOf('_jobcard_');
    if (idx === -1) return null;
    return {
      vehicleNumber: id.substring(0, idx),
      jobcardKey: id.substring(idx + 1),
    };
  }

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      const parsed = parseId(id);
      if (!parsed) {
        Alert.alert('Invalid ID', 'Could not parse jobcard ID.');
        if (onBack) onBack();
        else router.back();
        return;
      }
      try {
        const docRef = doc(firestore, 'jobcard', parsed.vehicleNumber);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const jc = data[parsed.jobcardKey];
          if (jc) {
            setJob({
              id,
              vehicleNumber: parsed.vehicleNumber,
              date: jc.date,
              dispatchDate: jc.dispatchDate,
              driverName: jc.driverName,
              driverContact: jc.driverContact,
              vehicleCompany: jc.vehicleCompany,
              kilometers: jc.kilometers,
              issues: jc.issues,
              unsolvedIssues: jc.unsolvedIssues,
              signDriver: jc.signDriver,
              signOperator: jc.signOperator,
              signManager: jc.signManager,
            });
            setEditData({
              id,
              vehicleNumber: parsed.vehicleNumber,
              date: jc.date,
              dispatchDate: jc.dispatchDate,
              driverName: jc.driverName,
              driverContact: jc.driverContact,
              vehicleCompany: jc.vehicleCompany,
              kilometers: jc.kilometers,
              issues: jc.issues,
              unsolvedIssues: jc.unsolvedIssues,
              signDriver: jc.signDriver,
              signOperator: jc.signOperator,
              signManager: jc.signManager,
            });
            const initialEditingIssues = jc.issues ? JSON.parse(JSON.stringify(jc.issues)) : {};
            if (jc.unsolvedIssues) {
              for (const k of Object.keys(jc.unsolvedIssues)) {
                if (!initialEditingIssues[k]) initialEditingIssues[k] = {};
                if (initialEditingIssues[k].unsolved === undefined) initialEditingIssues[k].unsolved = jc.unsolvedIssues[k];
              }
            }
            setEditingIssues(initialEditingIssues);
          } else {
            Alert.alert('Not found', 'Job card not found.');
            if (onBack) onBack();
            else router.back();
          }
        } else {
          Alert.alert('Not found', 'Job card not found.');
          if (onBack) onBack();
          else router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch job card.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) onBack();
      else router.back();
      return true;
    });
    return () => {
      backHandler.remove();
    };
  }, [id, onBack]);

  useEffect(() => {
    // Fetch driver contact info if job is loaded and has driverName
    if (job && job.driverName) {
      (async () => {
        try {
          const driversRef = collection(firestore, 'drivers');
          // Query for driver with matching name
          const snapshot = await getDocs(driversRef);
          let foundContact = undefined;
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.name && data.name.trim().toLowerCase() === job.driverName!.trim().toLowerCase()) {
              foundContact = data.number;
            }
          });
          setDriverContact(foundContact);
        } catch (e) {
          setDriverContact(undefined);
        }
      })();
    }
  }, [job]);

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

  const handleCloseJob = async () => {
    if (!job || !id) return;
    const parsed = parseId(id);
    if (!parsed) return;
    try {
      setClosing(true);
      const docRef = doc(firestore, 'jobcard', parsed.vehicleNumber);
      await updateDoc(docRef, {
        [`${parsed.jobcardKey}.dispatchDate`]: new Date().toISOString(),
      });
      setJob({ ...job, dispatchDate: new Date().toISOString() });
      Alert.alert('Job Closed', 'The job has been marked as completed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to close job.');
    } finally {
      setClosing(false);
    }
  };

  const handleSaveAll = async () => {
    if (!editData || !id) return;
    const parsed = parseId(id);
    if (!parsed) return;
    try {
      setLoading(true);
      const docRef = doc(firestore, 'jobcard', parsed.vehicleNumber);
      await updateDoc(docRef, {
        [`${parsed.jobcardKey}`]: {
          ...job,
          ...editData,
          vehicleNumber: job!.vehicleNumber,
          driverName: job!.driverName,
          driverContact: job!.driverContact,
          vehicleCompany: job!.vehicleCompany,
          kilometers: job!.kilometers,
          issues: editingIssues,
          unsolvedIssues: Object.fromEntries(
            Object.entries(editingIssues || {}).map(([type, fields]: any) => [type, fields.unsolved || ''])
          ),
        },
        unsolvedIssues: Object.fromEntries(
          Object.entries(editingIssues || {}).map(([type, fields]: any) => [type, fields.unsolved || ''])
        ),
      });
      setJob({ 
        ...job!, 
        ...editData, 
        issues: editingIssues, 
        unsolvedIssues: Object.fromEntries(
          Object.entries(editingIssues || {}).map(([type, fields]: any) => [type, fields.unsolved || ''])
        ) 
      });
      setEditing(false);
      Alert.alert('Success', 'Job card updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update job card.');
    } finally {
      setLoading(false);
    }
  };

  const openPartModal = (issue: string, type: 'repaired' | 'replaced') => {
    setModalIssue(issue);
    setModalType(type);
    setSelectedParts(
      editingIssues?.[issue]?.[type]
        ? editingIssues[issue][type].split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
    );
    setModalVisible(true);
  };

  const saveSelectedParts = () => {
    if (modalIssue && modalType) {
      setEditingIssues((prev: any) => ({
        ...prev,
        [modalIssue]: {
          ...prev?.[modalIssue],
          [modalType]: selectedParts.join(', '),
        },
      }));
    }
    setModalVisible(false);
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) return null;

  const InfoRow = ({ icon, label, value, iconColor = "#6B7280" }: { icon: string, label: string, value: string, iconColor?: string }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={20} color={iconColor} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );

  const SectionHeader = ({ icon, title, iconColor = "#2563EB" }: { icon: string, title: string, iconColor?: string }) => (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon as any} size={24} color={iconColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onBack ? onBack() : router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2563EB" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Card Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {editing && !job.dispatchDate ? (
          <>
            {/* General Vehicle Info (read-only in edit mode) */}
            <View style={styles.card}>
              <SectionHeader icon="directions-car" title="General Vehicle Info" />
              <View style={styles.cardContent}>
                <InfoRow icon="car" label="Vehicle Number" value={job.vehicleNumber} />
                <InfoRow icon="person" label="Driver Name" value={job.driverName || ''} />
                <InfoRow icon="call" label="Driver Contact" value={job.driverContact || ''} />
                <InfoRow icon="business" label="Vehicle Company" value={job.vehicleCompany || ''} />
                <InfoRow icon="speedometer" label="Kilometers" value={job.kilometers || ''} />
              </View>
            </View>

            {/* Maintenance Issues (editable) */}
            <View style={styles.card}>
              <SectionHeader icon="build" title="Maintenance Issues" iconColor="#059669" />
              <View style={styles.cardContent}>
                {[
                  { key: 'engine', label: 'Engine Work', icon: 'settings' },
                  { key: 'electrical', label: 'Electrical Work', icon: 'flash' },
                  { key: 'body', label: 'Body Work', icon: 'car-sport' },
                  { key: 'tyre', label: 'Tyre Work', icon: 'ellipse' },
                  { key: 'warranty', label: 'Work Done Under Warranty', icon: 'shield-checkmark' },
                  { key: 'other', label: 'Any Other Issue', icon: 'construct' },
                ].map(({ key, label, icon }) => (
                  <View style={styles.issueSection} key={key}>
                    <View style={styles.issueTitleRow}>
                      <Ionicons name={icon as any} size={20} color="#059669" />
                      <Text style={styles.issueTitle}>{label}</Text>
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Description</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editingIssues?.[key]?.description || ''}
                        onChangeText={text => setEditingIssues((prev: any) => ({
                          ...prev,
                          [key]: { ...prev?.[key], description: text }
                        }))}
                        multiline
                        placeholder="Enter description..."
                      />
                    </View>

                    {/* For mechanical and electrical, use part selector for repaired/replaced */}
                    {['engine', 'electrical'].includes(key) ? (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Items Repaired</Text>
                          <TouchableOpacity
                            style={[styles.editInput, { minHeight: 50, justifyContent: 'center' }]}
                            onPress={() => openPartModal(key, 'repaired')}
                          >
                            <Text style={{ color: editingIssues?.[key]?.repaired ? '#1e293b' : '#94a3b8' }}>
                              {editingIssues?.[key]?.repaired || 'Select repaired parts'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Items Replaced</Text>
                          <TouchableOpacity
                            style={[styles.editInput, { minHeight: 50, justifyContent: 'center' }]}
                            onPress={() => openPartModal(key, 'replaced')}
                          >
                            <Text style={{ color: editingIssues?.[key]?.replaced ? '#1e293b' : '#94a3b8' }}>
                              {editingIssues?.[key]?.replaced || 'Select replaced parts'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Items Repaired</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editingIssues?.[key]?.repaired || ''}
                            onChangeText={text => setEditingIssues((prev: any) => ({
                              ...prev,
                              [key]: { ...prev?.[key], repaired: text }
                            }))}
                            multiline
                            placeholder="List items that were repaired"
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Items Replaced</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editingIssues?.[key]?.replaced || ''}
                            onChangeText={text => setEditingIssues((prev: any) => ({
                              ...prev,
                              [key]: { ...prev?.[key], replaced: text }
                            }))}
                            multiline
                            placeholder="List items that were replaced"
                          />
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Unsolved Issues (editable) */}
            <View style={styles.card}>
              <SectionHeader icon="warning" title="Unsolved Issues" iconColor="#DC2626" />
              <View style={styles.cardContent}>
                {[
                  { key: 'engine', label: 'Engine Work', icon: 'settings' },
                  { key: 'electrical', label: 'Electrical Work', icon: 'flash' },
                  { key: 'body', label: 'Body Work', icon: 'car-sport' },
                  { key: 'tyre', label: 'Tyre Work', icon: 'ellipse' },
                  { key: 'other', label: 'Any Other Issue', icon: 'construct' },
                ].map(({ key, label, icon }) => (
                  <View key={key} style={styles.issueSection}>
                    <View style={styles.issueTitleRow}>
                      <Ionicons name={icon as any} size={20} color="#DC2626" />
                      <Text style={styles.issueTitle}>{label}</Text>
                    </View>
                    <TextInput
                      style={styles.editInput}
                      placeholder={`Enter unsolved issues for ${label}`}
                      value={editingIssues?.[key]?.unsolved ?? job.unsolvedIssues?.[key] ?? ''}
                      onChangeText={text => setEditingIssues((prev: any) => ({
                        ...prev,
                        [key]: { ...prev?.[key], unsolved: text },
                      }))}
                      multiline
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Dispatch & Signatures (editable) */}
            <View style={styles.card}>
              <SectionHeader icon="assignment" title="Dispatch & Signatures" iconColor="#7C3AED" />
              <View style={styles.cardContent}>
                <InfoRow 
                  icon="time" 
                  label="Dispatch Date & Time" 
                  value={editData?.dispatchDate ? new Date(editData.dispatchDate).toLocaleString() : 'Not yet dispatched'} 
                />
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Driver Signature</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData?.signDriver || ''}
                    onChangeText={text => setEditData(d => d ? { ...d, signDriver: text } : d)}
                    placeholder="Driver signature..."
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Operator Signature</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData?.signOperator || ''}
                    onChangeText={text => setEditData(d => d ? { ...d, signOperator: text } : d)}
                    placeholder="Operator signature..."
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Manager Signature</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData?.signManager || ''}
                    onChangeText={text => setEditData(d => d ? { ...d, signManager: text } : d)}
                    placeholder="Manager signature..."
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save All Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* General Vehicle Info (view mode) */}
            <View style={styles.card}>
              <SectionHeader icon="directions-car" title="General Vehicle Info" />
              <View style={styles.cardContent}>
                <InfoRow icon="car" label="Vehicle Number" value={job.vehicleNumber} />
                <InfoRow icon="person" label="Driver Name" value={job.driverName || ''} />
                <InfoRow icon="call" label="Driver Contact" value={driverContact || job.driverContact || ''} />
                <InfoRow icon="business" label="Vehicle Company" value={job.vehicleCompany || ''} />
                <InfoRow icon="speedometer" label="Kilometers" value={job.kilometers || ''} />
              </View>
            </View>

            {/* Maintenance Issues (view mode) */}
            <View style={styles.card}>
              <SectionHeader icon="build" title="Maintenance Issues" iconColor="#059669" />
              <View style={styles.cardContent}>
                {(() => {
                  const issueOrder = ['engine', 'electrical', 'body', 'tyre', 'warranty', 'other'];
                  const issueTitles: Record<string, string> = {
                    engine: 'Engine Work',
                    electrical: 'Electrical Work',
                    body: 'Body Work',
                    tyre: 'Tyre Work',
                    warranty: 'Work Done Under Warranty',
                    other: 'Any Other Issue',
                  };
                  const issueIcons: Record<string, string> = {
                    engine: 'settings',
                    electrical: 'flash',
                    body: 'car-sport',
                    tyre: 'ellipse',
                    warranty: 'shield-checkmark',
                    other: 'construct',
                  };

                  return issueOrder.map(type => {
                    const issue = job.issues?.[type];
                    if (!issue) return null;
                    return (
                      <View key={type} style={styles.issueViewSection}>
                        <View style={styles.issueTitleRow}>
                          <Ionicons name={issueIcons[type] as any} size={20} color="#059669" />
                          <Text style={styles.issueTitle}>{issueTitles[type]}</Text>
                        </View>
                        <View style={styles.issueDetail}>
                          <Text style={styles.issueDetailLabel}>Description</Text>
                          <Text style={styles.issueDetailValue}>{issue.description || 'Not specified'}</Text>
                        </View>
                        {/* For mechanical/electrical, show color-coded parts with units used */}
                        {['engine', 'electrical'].includes(type) ? (
                          <>
                            <View style={styles.issueDetail}>
                              <Text style={styles.issueDetailLabel}>Items Repaired</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {(issue.repaired || '').split(',').map((partStr: string, idx: number) => {
                                  const match = partStr.match(/^(.*?)(?: \(x(\d+)\))?$/);
                                  const partName = match ? match[1].trim() : partStr.trim();
                                  const used = match && match[2] ? parseInt(match[2]) : 1;
                                  // Use inventory object for lookup
                                  const units = type === 'engine' ? mechanicalInventory[partName] : electricalInventory[partName];
                                  const color = typeof units === 'number' && units > 0 ? '#059669' : '#dc2626';
                                  return (
                                    <Text key={idx} style={{ color, fontWeight: 'bold', marginRight: 8 }}>
                                      {partName} (x{used})
                                    </Text>
                                  );
                                })}
                              </View>
                            </View>
                            <View style={styles.issueDetail}>
                              <Text style={styles.issueDetailLabel}>Items Replaced</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {(issue.replaced || '').split(',').map((partStr: string, idx: number) => {
                                  const match = partStr.match(/^(.*?)(?: \(x(\d+)\))?$/);
                                  const partName = match ? match[1].trim() : partStr.trim();
                                  const used = match && match[2] ? parseInt(match[2]) : 1;
                                  // Use inventory object for lookup
                                  const units = type === 'engine' ? mechanicalInventory[partName] : electricalInventory[partName];
                                  const color = typeof units === 'number' && units > 0 ? '#059669' : '#dc2626';
                                  return (
                                    <Text key={idx} style={{ color, fontWeight: 'bold', marginRight: 8 }}>
                                      {partName} (x{used})
                                    </Text>
                                  );
                                })}
                              </View>
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={styles.issueDetail}>
                              <Text style={styles.issueDetailLabel}>Items Repaired</Text>
                              <Text style={styles.issueDetailValue}>{issue.repaired || 'Not specified'}</Text>
                            </View>
                            <View style={styles.issueDetail}>
                              <Text style={styles.issueDetailLabel}>Items Replaced</Text>
                              <Text style={styles.issueDetailValue}>{issue.replaced || 'Not specified'}</Text>
                            </View>
                          </>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>
            </View>

            {/* Unsolved Issues (view mode) */}
            <View style={styles.card}>
              <SectionHeader icon="warning" title="Unsolved Issues" iconColor="#DC2626" />
              <View style={styles.cardContent}>
                {(() => {
                  const unsolvedOrder = ['engine', 'electrical', 'body', 'tyre', 'other'];
                  const unsolvedTitles: Record<string, string> = {
                    engine: 'Engine Work',
                    electrical: 'Electrical Work',
                    body: 'Body Work',
                    tyre: 'Tyre Work',
                    other: 'Any Other Issue',
                  };
                  const unsolvedIcons: Record<string, string> = {
                    engine: 'settings',
                    electrical: 'flash',
                    body: 'car-sport',
                    tyre: 'ellipse',
                    other: 'construct',
                  };

                  if (!job.unsolvedIssues || Object.keys(job.unsolvedIssues).length === 0) {
                    return <Text style={styles.noDataText}>No unsolved issues.</Text>;
                  }

                  let hasAny = false;
                  const views = unsolvedOrder.map(type => {
                    const value = job.unsolvedIssues[type];
                    if (!value) return null;
                    hasAny = true;
                    return (
                      <View key={type} style={styles.issueViewSection}>
                        <View style={styles.issueTitleRow}>
                          <Ionicons name={unsolvedIcons[type] as any} size={20} color="#DC2626" />
                          <Text style={styles.issueTitle}>{unsolvedTitles[type]}</Text>
                        </View>
                        <Text style={styles.issueDetailValue}>{value}</Text>
                      </View>
                    );
                  });
                  return hasAny ? views : <Text style={styles.noDataText}>No unsolved issues.</Text>;
                })()}
              </View>
            </View>

            {/* Dispatch & Signatures (view mode) */}
            <View style={styles.card}>
              <SectionHeader icon="assignment" title="Dispatch & Signatures" iconColor="#7C3AED" />
              <View style={styles.cardContent}>
                <InfoRow 
                  icon="time" 
                  label="Dispatch Date & Time" 
                  value={job.dispatchDate ? new Date(job.dispatchDate).toLocaleString() : 'Not yet dispatched'} 
                />
                <InfoRow icon="create" label="Driver Signature" value={job.signDriver || ''} />
                <InfoRow icon="create" label="Operator Signature" value={job.signOperator || ''} />
                <InfoRow icon="create" label="Manager Signature" value={job.signManager || ''} />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.editButton, job.dispatchDate ? styles.disabledButton : {}]}
                onPress={() => { if (!job.dispatchDate) setEditing(true); }}
                disabled={!!job.dispatchDate}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.editButtonText}>
                  {job.dispatchDate ? 'Job Completed' : 'Edit Job Card'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!job.dispatchDate && (
          <TouchableOpacity 
            style={styles.closeJobButton} 
            onPress={handleCloseJob} 
            disabled={closing}
          >
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.closeJobButtonText}>
              {closing ? 'Closing Job...' : 'Close Job (Mark as Completed)'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
                    <Text style={{ color: '#64748b', marginBottom: 10 }}>No parts found</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, width: 180, fontSize: 15, marginBottom: 8 }}
                      placeholder="Add new part"
                      value={newPartName}
                      onChangeText={setNewPartName}
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: newPartName.trim() ? '#2563EB' : '#9CA3AF',
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 18,
                        opacity: newPartName.trim() ? 1 : 0.6,
                      }}
                      onPress={handleAddNewPart}
                      disabled={!newPartName.trim()}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  backButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  cardContent: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  issueSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  issueViewSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  issueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  issueDetail: {
    marginBottom: 8,
  },
  issueDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  issueDetailValue: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionButtons: {
    marginVertical: 16,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  closeJobButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  closeJobButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default Details4_1;