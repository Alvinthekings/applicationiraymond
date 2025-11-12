import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RootStackParamList } from './navigation/StackNavigator';
import { loginUser } from './utils/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setModalMessage('Please enter both username and password.');
      setShowModal(true);
      return;
    }

    setLoading(true);
    const res = await loginUser(username, password);
    setLoading(false);

    if (res.success) {
      try {
        // ✅ Store ALL important user data from PHP response
        await AsyncStorage.setItem('user_id', res.user.id.toString());
        await AsyncStorage.setItem('username', res.user.username);
        await AsyncStorage.setItem('role', res.user.role || 'consumer');
        await AsyncStorage.setItem('email', res.user.email || '');
        await AsyncStorage.setItem('fname', res.user.fname || '');
        await AsyncStorage.setItem('lname', res.user.lname || '');
        await AsyncStorage.setItem('gender', res.user.gender || '');
        await AsyncStorage.setItem('age', res.user.age || '');
        await AsyncStorage.setItem('phone', res.user.phone || '');
        await AsyncStorage.setItem('address', res.user.address || '');
        await AsyncStorage.setItem('profile_image', res.user.image || '');
        await AsyncStorage.setItem('cover_image', res.user.cover || '');

        // ✅ Role-based navigation (no change)
        navigation.replace('Tabs', {
          username: res.user.username,
          role: res.user.role,
          profileImage: res.user.image,
          coverImage: res.user.cover,
        } as any);
      } catch (err) {
        console.error('Error saving user data:', err);
      }
    } else {
      setModalMessage(res.message || 'Login failed');
      setShowModal(true);
    }
  };

  const handleGoogleSignIn = () => {
    alert('Google Sign-In pressed (not yet connected)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={!isUsernameFocused && username === '' ? 'Username' : ''}
          placeholderTextColor="#888"
          onFocus={() => setIsUsernameFocused(true)}
          onBlur={() => setIsUsernameFocused(false)}
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={!isPasswordFocused && password === '' ? 'Password' : ''}
          placeholderTextColor="#888"
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >
          <Image
            source={require('../assets/images/google.png')}
            style={styles.googleLogo}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={{ marginTop: 15, color: '#008000' }}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 16,
    padding: 25,
    elevation: 8,
    alignItems: 'center',
  },
  logo: { width: 180, height: 80, resizeMode: 'contain', marginBottom: 10 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: 'green',
    paddingVertical: 13,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  googleLogo: { width: 20, height: 20, marginRight: 10 },
  googleText: { fontSize: 15, color: '#444' },
  forgotText: { color: '#888', fontSize: 14, marginTop: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: { fontSize: 16, marginBottom: 20, color: '#333', textAlign: 'center' },
  modalButton: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
