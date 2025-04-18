// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { StatusBar } from 'react-native';
// import Login from './login';
// import SignUp from './signup';
// import Index from './index';
// import Module1 from './(module_1)/home'; // Ensure this points to the correct module 1 component
// import Module2 from './(module_2)/home'; // Ensure this points to the correct module 2 component
// import Module3 from './(module_3)/home'; // Ensure this points to the correct module 3 component

// const Stack = createNativeStackNavigator();

// const Layout = () => {
//   return (
//     <>
//       <StatusBar barStyle="dark-content" />
//       <Stack.Navigator>
//         <Stack.Screen 
//           name="index" 
//           component={Index} 
//           options={{ headerShown: false }} 
//         />
//         <Stack.Screen 
//           name="login" 
//           component={Login} 
//           options={{ 
//             headerTitle: "Login", 
//             headerTitleAlign: 'center',
//           }} 
//         />
//         <Stack.Screen 
//           name="signup" 
//           component={SignUp} 
//           options={{ 
//             headerTitle: "SignUp", 
//             headerTitleAlign: 'center',
//           }} 
//         />
//         <Stack.Screen 
//           name="(module_1)" 
//           component={Module1} 
//           options={{ headerShown: false }} 
//         />
//         <Stack.Screen 
//           name="(module_2)" 
//           component={Module2} 
//           options={{ headerShown: false }} 
//         />
//         <Stack.Screen 
//           name="(module_3)" 
//           component={Module3} 
//           options={{ headerShown: false }} 
//         />
//       </Stack.Navigator>
//     </>
//   );
// };

// export default Layout;

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
        </Stack>  
      </>
      
    
  )
}

export default Layout