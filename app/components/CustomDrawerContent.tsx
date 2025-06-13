import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig'; // Import Firestore configuration

const CustomDrawerContent = (props: any) => {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null); // State to store the user's email

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const user = auth.currentUser; // Get the currently logged-in user
        if (!user) {
          console.error('No logged-in user found.');
          return;
        }

        // Fetch the user's email from Firestore
        const userRef = doc(firestore, 'users', user.uid); // Use UID as the document ID
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmail(userData.email || user.email); // Use email from Firestore or fallback to Firebase auth email
        } else {
          console.error('User document does not exist.');
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    fetchUserEmail();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out from this module?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Only navigate to dashboard, do not sign out
              router.replace('/dashboard');
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
        <Text style={styles.email}>{email || 'Loading...'}</Text>
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
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
  email: {
    fontSize: 14,
    color: '#5A7184',
  },
});

export default CustomDrawerContent;