import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'react-native'
// import { NotificationProvider } from '@/context/NotificationContext'
// import * as Notifications from 'expo-notifications'

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// })

const Layout = () => {
  
  // useEffect(() => {
  //   Notifications.cancelAllScheduledNotificationsAsync().then(() => {
  //     console.log("All scheduled notifications have been canceled.");
  //   });
  // }, []);

  return (
   
      <>
        <StatusBar barStyle="dark-content" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen 
            name="login" 
            options={{ 
              headerTitle: "Login", 
              headerTitleAlign: 'center',
            }} 
          />
          <Stack.Screen 
            name="signup" 
            options={{ 
              headerTitle: "SignUp", 
              headerTitleAlign: 'center',
            }} 
          />
          <Stack.Screen name="(module_1)" options={{ headerShown: false }} />
          
          <Stack.Screen name="(module_2)" options={{ headerShown: false }} />

          <Stack.Screen name="(module_3)" options={{ headerShown: false }} />

          <Stack.Screen name="(module_4)" options={{ headerShown: false }} />

          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          
        </Stack>  
      </>
    )
}

export default Layout