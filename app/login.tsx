import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, TextInput, 
  Image, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, BackHandler 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { signIn } from '../authService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedModule, setSelectedModule] = useState<'module_1' | 'module_2' | 'module_3'>('module_1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

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
      router.replace('..');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const user = await signIn(email, password);
      if ((user && user.module !== selectedModule) && user.role !== 'admin') {
        setError('You do not have access to this module.');
        setIsSubmitting(false);
        return;
      }
      if (user) {
        await AsyncStorage.setItem('userToken', user.email);
      }
      setIsSubmitting(false);

      router.replace({
        pathname:
          selectedModule === 'module_1'
            ? '/(module_1)/home'
            : selectedModule === 'module_2'
            ? '/(module_2)/home'
            : '/(module_3)/home',
      });
    } catch (error) {
      setError('Please check your email and password.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoSquare}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logo} 
              />
            </View>
            <Text style={styles.companyName}>FleetTracker</Text>
          </View>
          
          <Text style={styles.title}>User Login</Text>
          <Text style={styles.subtitle}>Access your bus management dashboard</Text>
          
          <View style={styles.formContainer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="driver@company.com"
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
              <Text style={styles.inputLabel}>Select Module</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedModule}
                  onValueChange={(itemValue) => setSelectedModule(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Module 1" value="module_1" />
                  <Picker.Item label="Module 2" value="module_2" />
                  <Picker.Item label="Module 3" value="module_3" />
                </Picker>
              </View>
            </View>
            
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
            
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleSignIn}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Access Dashboard</Text>}
            </TouchableOpacity>
            
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>Need assistance? </Text>
              <TouchableOpacity>
                <Text style={styles.helpLink}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.busIconContainer}>
            <View style={styles.busLine}></View>
            <View style={styles.busIcon}>
              <View style={styles.busBody}></View>
              <View style={styles.busWindow}></View>
              <View style={styles.busWheel1}></View>
              <View style={styles.busWheel2}></View>
            </View>
          </View>
        </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 15, // Reduced padding
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 5, // Reduced margin
  },
  logoSquare: {
    width: 60,
    height: 70,
    backgroundColor: '#0A3D91',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 70,
    resizeMode: 'contain',
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A3D91',
    marginTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A3D91',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#5A7184',
    textAlign: 'center',
    marginBottom: 5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#D01C1F',
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A3D91',
    marginBottom: 5,
  },
  input: {
    height: 45,
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
    height: 45,
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
    height: 50, // Increased height
    justifyContent: 'center', // Center the text vertically
  },
  picker: {
    height: 50, // Increased height
    width: '100%',
  },
  pickerItem: {
    fontSize: 14, // Reduced font size for Picker items
    height: 50, // Ensure the height is consistent with other inputs
  },
  error: {
    fontSize: 14,
    color: '#D01C1F',
    textAlign: 'center',
    marginBottom: 10,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#D01C1F',
    textAlign: 'right',
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#D01C1F',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
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
  busIconContainer: {
    alignItems: 'center',
    marginTop: 20, // Increased margin
    position: 'relative',
  },
  busLine: {
    height: 2,
    backgroundColor: '#D8DEE5',
    width: '80%',
    position: 'absolute',
    bottom: 10,
  },
  busIcon: {
    width: 70,
    height: 35,
    position: 'relative',
  },
  busBody: {
    width: 70,
    height: 25,
    backgroundColor: '#D01C1F',
    borderRadius: 5,
    position: 'absolute',
    top: 0,
  },
  busWindow: {
    width: 20,
    height: 12,
    backgroundColor: '#0A3D91',
    position: 'absolute',
    top: 5,
    left: 10,
    borderRadius: 2,
  },
  busWheel1: {
    width: 12,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    left: 15,
  },
  busWheel2: {
    width: 12,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 15,
  }
});

export default Login;