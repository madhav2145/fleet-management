import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import messaging from '@react-native-firebase/messaging';

// Handle background notifications
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background:', remoteMessage);
});

const Index = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FleetTracker</Text>
      <Text style={styles.subtitle}>Manage your transportation efficiently</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/signup')}>
          <Text style={styles.buttonText}>Sign Up</Text>
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
  )
}

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
  }
})

export default Index
