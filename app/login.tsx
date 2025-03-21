import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, TextInput, 
  Image, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { signIn } from '../authService';

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      setIsSubmitting(false);
      router.push('/home');
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
              style={styles.input}
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
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#8B9EB0"
            />
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
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoSquare: {
    width: 70,
    height: 80,
    backgroundColor: '#0A3D91',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 90,
    height: 80,
    resizeMode: 'contain',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A3D91',
    marginTop: 10,
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
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#D01C1F',
    borderRadius: 8,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    marginTop: 30,
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
    width: 80,
    height: 40,
    position: 'relative',
  },
  busBody: {
    width: 80,
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