import { Drawer } from 'expo-router/drawer';
import React from 'react';
import CustomDrawerContent from '../components/CustomDrawerContent';

const HomeLayout = () => {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true, 
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
          drawerLabel: 'Home',
          title: 'Home',
        }}
      />
      <Drawer.Screen
        name="search"
        options={{
          drawerLabel: 'Search',
          title: 'Search',
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerLabel: 'Notifications',
          title: 'Notifications',
        }}
      />
      <Drawer.Screen
        name="addvehicle"
        options={{
          drawerLabel: 'Add Vehicle',
          title: 'Add Vehicle',
        }}
      />
    </Drawer>
  );
};

export default HomeLayout;