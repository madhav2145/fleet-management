import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomDrawerContent = (props: any) => {
  const router = useRouter();
  const [user, setUser] = useState({ name: 'John Doe', email: 'johndoe@example.com' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData'); // Example key
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

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
              await signOut(auth);
              await AsyncStorage.removeItem('userToken');
              router.replace('/login');
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

  return (
    <View style={{ flex: 1 }}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/favicon.png')}
          style={styles.profileImage}
          resizeMode="cover"
          onError={(error) => console.error('Failed to load profile image:', error.nativeEvent.error)}
        />
        <Text style={styles.username}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
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
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#D01C1F',
    borderRadius: 8,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CustomDrawerContent;