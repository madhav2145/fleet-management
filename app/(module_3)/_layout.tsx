import { Drawer } from 'expo-router/drawer';
import React from 'react';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { Text, StyleSheet } from 'react-native';

const HomeLayout = () => {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: styles.drawer,
        drawerLabelStyle: styles.drawerLabel,
        drawerActiveTintColor: '#0A3D91',
        drawerInactiveTintColor: '#5A7184',
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          drawerLabel: () => <Text style={styles.drawerLabel}>Home</Text>,
          title: 'Home',
        }}
      />
      <Drawer.Screen
        name="search"
        options={{
          drawerLabel: () => <Text style={styles.drawerLabel}>Search</Text>,
          title: 'Search',
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerLabel: () => <Text style={styles.drawerLabel}>Notifications</Text>,
          title: 'Notifications',
        }}
      />
      <Drawer.Screen
        name="addvehicle"
        options={{
          drawerLabel: () => <Text style={styles.drawerLabel}>Add Vehicle</Text>,
          title: 'Add Vehicle',
        }}
      />
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
    color: '#2D3748',
  },
});

export default HomeLayout;