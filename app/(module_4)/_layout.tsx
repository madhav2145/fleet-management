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
        name="jobcard"
        options={{
          drawerLabel: () => <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Job Card</Text>,
          title: 'Job Card',
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
        name="drivers"
        options={{
          drawerLabel: () => <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Drivers</Text>,
          title: 'Drivers',
        }}
      />
    
    <Drawer.Screen
        name="inventory"
        options={{
          drawerLabel: () => <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Inventory</Text>,
          title: 'Inventory',
        }}
      />
    </Drawer>
  );
};

export default HomeLayout;
