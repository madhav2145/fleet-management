import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomDrawerContent = (props: any) => {
  const router = useRouter();

  console.log('CustomDrawerContent props:', props); // Debugging props

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
              // Sign out the user from Firebase
              await signOut(auth);

              // Clear any stored user session (if applicable)
              await AsyncStorage.removeItem('userToken');

              // Replace the current route with the login page
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out: ', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/favicon.png')} 
          style={styles.profileImage}
          resizeMode="cover"
          onError={() => console.log('Image failed to load')} 
        />
        <Text style={styles.username}>John Doe/</Text> 
        <Text style={styles.email}>johndoe@example.com</Text> 
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Footer Section */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes the image circular
    marginBottom: 10,
    backgroundColor: '#E2E8F0', // Adds a background color to avoid flickering
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A3D91',
  },
  email: {
    fontSize: 14,
    color: '#5A7184',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8, // Smooth edges
    elevation: 2, // Optional: Adds a shadow effect
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D01C1F',
  },
});

export default CustomDrawerContent;