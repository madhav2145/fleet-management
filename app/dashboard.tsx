import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, BackHandler, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const Dashboard = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null); // State to store the user's email
  const [pushToken, setPushToken] = useState<string | null>(null); // State to store the push token
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to store error messages
  const [role, setRole] = useState<string | null>(null); // State to store user role
  const [allowedModules, setAllowedModules] = useState<string[]>([]); // State to store allowed modules for user
  const [isLoading, setIsLoading] = useState(true); // State to manage loading
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // On mount, get role and allowedModules from AsyncStorage only
    (async () => {
      const storedRole = await AsyncStorage.getItem('role');
      let storedModules = await AsyncStorage.getItem('userModule');
      let parsedModules: string[] = [];
      if (storedModules) {
        try {
          parsedModules = JSON.parse(storedModules);
          if (!Array.isArray(parsedModules)) parsedModules = [storedModules];
        } catch {
          parsedModules = [storedModules];
        }
      }
      setRole(storedRole);
      setAllowedModules(parsedModules);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const requestNotifications = async () => {
      await registerForPushNotificationsAsync();
    };
    requestNotifications();
  }, []);

  useEffect(() => {
    let lastBackPressed: number | null = null;
    const backAction = () => {
      if (auth.currentUser) {
        const now = Date.now();
        if (lastBackPressed && now - lastBackPressed < 300) {
          BackHandler.exitApp();
        } else {
          lastBackPressed = now;
          // No popup, just require double press
        }
      } else {
        router.replace('/');
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      if (!Device.isDevice) {
        setErrorMessage('Push notifications are only supported on physical devices.');
        return;
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        setErrorMessage('Failed to get push token for push notifications. Please grant notification permissions.');
        return;
      }
      const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      setPushToken(expoPushToken);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('An error occurred while generating the push token.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove push token from backend (Firestore)
              try {
                const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
                const user = auth.currentUser;
                if (user && expoPushToken) {
                  const userRef = doc(firestore, 'users', user.uid);
                  await updateDoc(userRef, { pushToken: arrayRemove(expoPushToken) });
                }
              } catch (e) {
                // Ignore errors in push token removal
              }
              // Sign out the user from Firebase
              await signOut(auth);
              // Clear any stored user session (email, password, module, token) from AsyncStorage
              await AsyncStorage.removeItem('userEmail');
              await AsyncStorage.removeItem('userPassword');
              await AsyncStorage.removeItem('userModule');
              await AsyncStorage.removeItem('userToken');
              // Replace the current route with the index page
              router.replace('/');
            } catch (error) {
              console.error('Error logging out: ', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleModulePress = (module: string) => {
    // Normalize module name for access check (e.g., '(module_1)' => 'module_1')
    const plainModule = module.replace(/[()]/g, '');
    if (role === 'admin' || allowedModules.includes(plainModule)) {
      if (module === '(module_1)') router.push('/(module_1)/home');
      else if (module === '(module_2)') router.push('/(module_2)/home');
      else if (module === '(module_3)') router.push('/(module_3)/home');
      else if (module === '(module_4)') router.push('/(module_4)/home');
    } else {
      Alert.alert('Access Denied', 'You do not have access to this module.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D01C1F" />
      </View>
    );
  }

  // Module data with summary and color
  const modules = [
    {
      key: '(module_1)',
      title: 'Module 1',
      summary: 'Fleet Vehicle Management: Add, search, and manage vehicles.',
      color: '#0A3D91',
    },
    {
      key: '(module_2)',
      title: 'Module 2',
      summary: 'Water & Urea: Track and manage usage for vehicles.',
      color: '#1C658C',
    },
    {
      key: '(module_3)',
      title: 'Module 3',
      summary: 'Laundry Management: Add, search, and manage laundry jobs.',
      color: '#398AB9',
    },
    {
      key: '(module_4)',
      title: 'Module 4',
      summary: 'Job Card: Create, search, and update job cards.',
      color: '#D01C1F',
    },
  ];

  // If no role or no modules, show error
  if (!role || (role !== 'admin' && allowedModules.length === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Module</Text>
        <Text style={{ color: 'red', alignSelf: 'center', marginBottom: 20 }}>
          {errorMessage || 'No modules available. Please contact admin or log in again.'}
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#D01C1F' }]}
          onPress={handleLogout}
        >
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
        <Text style={styles.title}>Select Module</Text>
        {errorMessage && <Text style={{ color: 'red', alignSelf: 'center' }}>{errorMessage}</Text>}
        <View style={styles.cardContainer}>
          <View style={styles.gridRow}>
            {modules.slice(0, 2).map((mod) => {
              const plainModule = mod.key.replace(/[()]/g, '');
              const hasAccess = role === 'admin' || allowedModules.includes(plainModule);
              return (
                <TouchableOpacity
                  key={mod.key}
                  style={[styles.moduleCard, { borderLeftColor: mod.color, opacity: hasAccess ? 1 : 0.5 }]}
                  onPress={() => {
                    if (hasAccess) handleModulePress(mod.key);
                    else Alert.alert('Access Denied', 'You do not have access to this module.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.moduleTitle, { color: mod.color }]}>{mod.title}</Text>
                  <Text style={styles.moduleSummary}>{mod.summary}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.gridRow}>
            {modules.slice(2, 4).map((mod) => {
              const plainModule = mod.key.replace(/[()]/g, '');
              const hasAccess = role === 'admin' || allowedModules.includes(plainModule);
              return (
                <TouchableOpacity
                  key={mod.key}
                  style={[styles.moduleCard, { borderLeftColor: mod.color, opacity: hasAccess ? 1 : 0.5 }]}
                  onPress={() => {
                    if (hasAccess) handleModulePress(mod.key);
                    else Alert.alert('Access Denied', 'You do not have access to this module.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.moduleTitle, { color: mod.color }]}>{mod.title}</Text>
                  <Text style={styles.moduleSummary}>{mod.summary}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {role === 'admin' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/signup')}>
            <Text style={styles.actionButtonText}>Sign Up</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#D01C1F' }]}
          onPress={handleLogout}
        >
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8', paddingHorizontal: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0A3D91', marginBottom: 24, alignSelf: 'center' },
  cardContainer: { width: '100%', alignItems: 'center', marginBottom: 24 },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    width: '47%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 7,
  },
  moduleTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  moduleSummary: { fontSize: 15, color: '#444', marginBottom: 2 },
  actionButton: {
    backgroundColor: '#0A3D91',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 8,
    width: 220,
    alignSelf: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default Dashboard;