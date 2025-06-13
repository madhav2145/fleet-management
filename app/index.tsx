import React, { useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; 

const Index = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const checkStoredCredentials = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedPassword = await AsyncStorage.getItem('userPassword');

        if (storedEmail && storedPassword) {
          // Authenticate the user with Firebase
          try {
            await signInWithEmailAndPassword(auth, storedEmail, storedPassword);
            console.log('User authenticated successfully.');
            // Navigate to the dashboard
            router.replace('/dashboard');
          } catch (authError) {
            console.error('Error authenticating user:', authError);
            // Clear invalid credentials to prevent repeated failed attempts
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('userPassword');
            setIsLoading(false); // Show login/signup buttons if authentication fails
          }
        } else {
          setIsLoading(false); // Show login/signup buttons if no credentials are found
        }
      } catch (error) {
        console.error('Error checking stored credentials:', error);
        setIsLoading(false);
      }
    };

    checkStoredCredentials();

    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D01C1F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FleetTracker</Text>
      <Text style={styles.subtitle}>Manage your transportation efficiently</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.busIconContainer}>
        <View style={styles.busLine}></View>
        <View style={styles.busIcon}>
          <View style={styles.busBody}></View>
          <View style={styles.busWindow}></View>
          <View style={styles.busWheel1}></View>
          <View style={styles.busWheel2}></View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0A3D91',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#5A7184',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
    width: '80%',
  },
  button: {
    backgroundColor: '#D01C1F',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  busIconContainer: {
    alignItems: 'center',
    marginTop: 30,
    position: 'relative',
  },
  busLine: {
    height: 2,
    backgroundColor: '#D8DEE5',
    width: '80%',
    position: 'absolute',
    bottom: 10,
  },
  busIcon: {
    width: 80,
    height: 40,
    position: 'relative',
  },
  busBody: {
    width: 80,
    height: 25,
    backgroundColor: '#D01C1F',
    borderRadius: 5,
    position: 'absolute',
    top: 0,
  },
  busWindow: {
    width: 20,
    height: 12,
    backgroundColor: '#0A3D91',
    position: 'absolute',
    top: 5,
    left: 10,
    borderRadius: 2,
  },
  busWheel1: {
    width: 12,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    left: 15,
  },
  busWheel2: {
    width: 12,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 15,
  },
});

export default Index;
