import { Drawer } from 'expo-router/drawer';
import React from 'react';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { Text } from 'react-native';

const HomeLayout = () => {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#F0F4F8',
          width: 240,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#0A3D91',
        drawerInactiveTintColor: '#5A7184',
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          drawerLabel: () => <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Home</Text>,
          title: 'Home',
        }}
      />
      <Drawer.Screen
        name="search"
        options={{
          drawerLabel: () => <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Search</Text>,
          title: 'Search',
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerLabel: () => <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Notifications</Text>,
          title: 'Notifications',
        }}
      />

<Drawer.Screen
        name="addvehicle"
        options={{
          drawerLabel: () => <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Add Vehicle</Text>,
          title: 'Add Vehicle',
        }}
      />
    </Drawer>
  );
};

export default HomeLayout;