import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'react-native'

const Layout = () => {
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
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

export default Layout