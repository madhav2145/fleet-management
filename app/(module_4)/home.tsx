import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

const FILTERS = [
  { key: 'today', label: 'Created Today' },
  { key: 'previous', label: 'Created Previously' },
  { key: 'completed', label: 'Completed' },
  { key: 'ongoing', label: 'All Ongoing' },
] as const;
type FilterKey = typeof FILTERS[number]['key'];

function isToday(date: Date) {
  const now = new Date();
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getCountForFilter(filterKey: string, jobCards: any[]) {
  if (filterKey === 'today') {
    return jobCards.filter(jc => jc.createdAt && isToday(jc.createdAt) && jc.dispatchDate === null).length;
  } else if (filterKey === 'previous') {
    return jobCards.filter(jc => jc.createdAt && !isToday(jc.createdAt) && jc.dispatchDate === null).length;
  } else if (filterKey === 'completed') {
    return jobCards.filter(jc => jc.dispatchDate !== null).length;
  } else if (filterKey === 'ongoing') {
    return jobCards.filter(jc => jc.dispatchDate === null).length;
  }
  return 0;
}

const Home = () => {
  const router = useRouter();
  const segments = useSegments();
  const [jobCards, setJobCards] = useState<any[]>([]); // Now fetched from Firestore
  const [counts, setCounts] = useState<Record<FilterKey, number>>({ today: 0, previous: 0, completed: 0, ongoing: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch jobcards from Firestore and flatten them (real-time updates)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'jobcard'), (querySnapshot) => {
      let allJobCards: any[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const vehicleNumber = docSnap.id;
        Object.keys(data)
          .filter(key => key.startsWith('jobcard_'))
          .forEach(key => {
            const jc = data[key];
            if (jc) {
              allJobCards.push({
                id: `${vehicleNumber}_${key}`,
                vehicleNumber,
                createdAt: jc.date ? new Date(jc.date) : null,
                dispatchDate: jc.dispatchDate ? new Date(jc.dispatchDate) : null,
                ...jc,
              });
            }
          });
      });
      setJobCards(allJobCards);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCounts({
      today: getCountForFilter('today', jobCards),
      previous: getCountForFilter('previous', jobCards),
      completed: getCountForFilter('completed', jobCards),
      ongoing: getCountForFilter('ongoing', jobCards),
    });
  }, [jobCards]);

  useEffect(() => {
    const backAction = () => {
      const currentRoute = segments.join('/');
      if (currentRoute === '(module_4)/home') {
        router.replace('/dashboard');
        return true;
      } else {
        router.replace('/(module_4)/home');
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [segments]);

  const handlePress = (filterKey: string) => {
    router.push({ pathname: '/(module_4)/search', params: { selectedFilter: filterKey } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Job Card Overview</Text>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading...</Text>
      ) : (
        FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={styles.card} onPress={() => handlePress(f.key)}>
            <Text style={styles.cardTitle}>{f.label}</Text>
            <Text style={styles.count}>{counts[f.key as FilterKey]} job cards</Text>
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => router.push('/(module_4)/jobcard')}
      >
        <Text style={styles.createBtnText}>Create a Job Card</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 50 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 20, marginBottom: 18, backgroundColor: '#f9f9f9', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  count: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
  createBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Home;