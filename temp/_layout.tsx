// // import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// // import { useFonts } from 'expo-font';
// // import { Stack } from 'expo-router';
// // import * as SplashScreen from 'expo-splash-screen';
// // import { StatusBar } from 'expo-status-bar';
// // import { useEffect } from 'react';
// // import 'react-native-reanimated';

// // import { useColorScheme } from '../hooks/useColorScheme';
// // import HomeScreen from './index'; // Adjust the import path as necessary
// // import AddDetailsScreen from './AddDetailsScreen'; // Adjust the import path as necessary

// // // Prevent the splash screen from auto-hiding before asset loading is complete.
// // SplashScreen.preventAutoHideAsync();

// // export default function RootLayout() {
// //   const colorScheme = useColorScheme();
// //   const [loaded] = useFonts({
// //     SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
// //   });

// //   useEffect(() => {
// //     if (loaded) {
// //       SplashScreen.hideAsync();
// //     }
// //   }, [loaded]);

// //   if (!loaded) {
// //     return null;
// //   }

// //   return (
// //     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
// //       <Stack screenOptions={{ headerShown: false }}>
// //         <Stack.Screen name="Home" component={HomeScreen} />
// //         <Stack.Screen name="AddDetails" component={AddDetailsScreen} />
// //       </Stack>
// //       <StatusBar style="auto" />
// //     </ThemeProvider>
// //   );
// // }
// import * as React from 'react';
// import {NavigationContainer} from '@react-navigation/native';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
// import HomeScreen from './index';
// import AddDetailsScreen from './AddDetailsScreen';


// const Stack = createNativeStackNavigator();

// const MyStack = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
//         <Stack.Screen
//           name="Home"
//           component={HomeScreen}
//           options={{title: 'Welcome'}}
//         />
//         <Stack.Screen name="AddDetails" component={AddDetailsScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };