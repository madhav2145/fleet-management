import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, TextInput, 
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, BackHandler 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { signUp } from '../authService';
import { Ionicons } from '@expo/vector-icons'; // Replaced lucide-react-native with @expo/vector-icons
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignUp: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedModule, setSelectedModule] = useState<'module_1' | 'module_2' | 'module_3'>('module_1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const backAction = () => {
      router.replace('/dashboard');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Signing up with:', { email, selectedModule }); // Debug log

      // Call the updated signUp function
      const user = await signUp(email, password, selectedModule);

      // Save the user token to AsyncStorage
      await AsyncStorage.setItem('userToken', user.email);

      setIsSubmitting(false);

      // Route to the appropriate module's home page
      router.push({
        pathname:
          selectedModule === 'module_1'
            ? '/(module_1)/home'
            : selectedModule === 'module_2'
            ? '/(module_2)/home'
            : '/(module_3)/home',
      });
    } catch (error) {
      console.error('Sign-up error:', error); // Log the error
      setError('Failed to sign up. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Create an Account</Text>
          <Text style={styles.subtitle}>Join FleetTracker today!</Text>

          <View style={styles.formContainer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8B9EB0"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { color: '#000' }]} 
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  placeholderTextColor="#8B9EB0"
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
                  {passwordVisible ? (
                    <Ionicons name="eye-off" size={20} color="#8B9EB0" />
                  ) : (
                    <Ionicons name="eye" size={20} color="#8B9EB0" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { color: '#000' }]} 
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!confirmPasswordVisible}
                  placeholderTextColor="#8B9EB0"
                />
                <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.eyeIcon}>
                  {confirmPasswordVisible ? (
                    <Ionicons name="eye-off" size={20} color="#8B9EB0" />
                  ) : (
                    <Ionicons name="eye" size={20} color="#8B9EB0" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Module</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedModule}
                  onValueChange={(itemValue) => setSelectedModule(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Module 1" value="module_1" />
                  <Picker.Item label="Module 2" value="module_2" />
                  <Picker.Item label="Module 3" value="module_3" /> 
                </Picker>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.signupButton} 
              onPress={handleSignUp}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
            </TouchableOpacity>

            {/* <View style={styles.helpContainer}>
              <Text style={styles.helpText}>Need assistance? </Text>
              <TouchableOpacity>
                <Text style={styles.helpLink}>Contact Support</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A3D91',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#5A7184',
    textAlign: 'center',
    marginBottom: 25,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#D01C1F',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A3D91',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: '#E1E8ED',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E1E8ED',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F7FAFC',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    paddingLeft: 0,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  pickerContainer: {
    borderColor: '#E1E8ED',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  signupButton: {
    backgroundColor: '#D01C1F',
    borderRadius: 8,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#5A7184',
  },
  helpLink: {
    fontSize: 14,
    color: '#0A3D91',
    fontWeight: 'bold',
  },
  error: {
    color: '#D01C1F',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default SignUp;