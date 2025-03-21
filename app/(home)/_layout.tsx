import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';

const HomeLayout = () => {
  const router = useRouter();

  return (
    <Drawer
      screenOptions={{
        drawerStyle: styles.drawer,
        drawerLabelStyle: styles.drawerLabel,
        drawerActiveTintColor: '#0A3D91',
        drawerInactiveTintColor: '#5A7184',
      }}
    > 
      {/* <Drawer.Screen
        name="search"
        options={{
          drawerLabel: 'Search',
          title: 'Search',
        }}
      />
      <Drawer.Screen
        name="aboutus"
        options={{
          drawerLabel: 'About Us',
          title: 'About Us',
        }}
      /> */}
    </Drawer>
  );
};

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: '#F0F4F8',
    width: 240,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeLayout;