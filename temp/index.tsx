// import React from 'react';
// import { Image, StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';
// import { navigate } from 'expo-router/build/global-state/routing';
// import { useNavigation } from 'expo-router';

// export default function HomeScreen() {
//   const navigation = useNavigation();

//   return (
    
//     <ThemedView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.hamburgerMenu}>
//           <Image source={require('@/assets/favicon.png')} style={styles.icon} />
//         </TouchableOpacity>
//         <TextInput style={styles.searchBar} placeholder="Search..." />
//         <TouchableOpacity style={styles.profileIcon}>
//           <Image source={require('@/assets/favicon.png')} style={styles.icon} />
//         </TouchableOpacity>
//       </View>
//       <View style={styles.body}>
//         {/* Add your body content here */}
//       </View>
//       {/* plus button */}
//       <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDetails')}>
//         <Image source={require('@/assets/favicon.png')} style={styles.fabIcon} />
//       </TouchableOpacity>
//     </ThemedView>
    
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 10,
//     marginTop: 30,
//     backgroundColor: '#fff',
//   },
//   hamburgerMenu: {
//     padding: 10,
//   },
//   searchBar: {
//     flex: 1,
//     marginHorizontal: 10,
//     padding: 10,
//     borderRadius: 5,
//     backgroundColor: '#f0f0f0',
//   },
//   profileIcon: {
//     padding: 10,
//   },
//   icon: {
//     width: 24,
//     height: 24,
//   },
//   body: {
//     flex: 1,
//     // Add your body styles here
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#007AFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   fabIcon: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });