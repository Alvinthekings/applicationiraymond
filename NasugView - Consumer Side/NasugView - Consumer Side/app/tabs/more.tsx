import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MoreScreen({ navigation }: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<string | null>(null);

  // Load username and role when screen focuses
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedRole = await AsyncStorage.getItem('role');
        if (storedUsername) setUsername(storedUsername);
        if (storedRole) setRole(storedRole);
      };
      loadUserData();
    }, [])
  );

  const confirmLogout = async () => {
    setModalVisible(false);
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  // ✅ Role-based profile navigation
  const goToProfile = () => {
    if (role === 'business_owner') {
      navigation.navigate('BusinessProfile');
    } else {
      navigation.navigate('Profile');
    }
  };

const goToEventCalendar = () => {
  if (role === 'business_owner') {
    navigation.navigate('BusinessCalendar');
  } else {
    navigation.navigate('EventCalendar');
  }
};
  const goToDashboard = () => navigation.navigate('ProfessionalDashboard');

  // ✅ Navigate to Shop Performance Log
  const goToShopPerformanceLog = () => navigation.navigate('ShopPerformanceLog');

  return (
    <View style={styles.container}>
      {/* 👤 Profile Option */}
      <TouchableOpacity style={styles.option} onPress={goToProfile}>
        <Ionicons
          name="person-circle-outline"
          size={24}
          color="#008000"
          style={styles.icon}
        />
        <Text style={styles.optionText}>
          {role === 'business_owner' ? 'Business Profile' : 'Profile'}
        </Text>
      </TouchableOpacity>

      {/* ❤️ Likes — only for consumers */}
      {role !== 'business_owner' && (
        <TouchableOpacity style={styles.option}>
          <Ionicons
            name="heart-outline"
            size={24}
            color="#008000"
            style={styles.icon}
          />
          <Text style={styles.optionText}>Likes</Text>
        </TouchableOpacity>
      )}

      {/* 🗓️ Event Calendar */}
      <TouchableOpacity style={styles.option} onPress={goToEventCalendar}>
        <Ionicons
          name="calendar-outline"
          size={24}
          color="#008000"
          style={styles.icon}
        />
        <Text style={styles.optionText}>Event Calendar</Text>
      </TouchableOpacity>

      {/* 🌐 Language */}
      <TouchableOpacity style={styles.option}>
        <Ionicons
          name="globe-outline"
          size={24}
          color="#008000"
          style={styles.icon}
        />
        <Text style={styles.optionText}>Language</Text>
      </TouchableOpacity>

      {/* ⚙️ Settings */}
      <TouchableOpacity
  style={styles.option}
  onPress={() => navigation.navigate('SettingsSection')}
>
  <Ionicons
    name="settings-outline"
    size={24}
    color="#008000"
    style={styles.icon}
  />
  <Text style={styles.optionText}>Settings</Text>
</TouchableOpacity>



      {/* 👔 Business Owner Specific Options */}
      {role === 'business_owner' && (
        <>
          {/* ⭐ Reviews (No navigation yet) */}
          <TouchableOpacity style={styles.option}>
            <Ionicons
              name="star-outline"
              size={24}
              color="#008000"
              style={styles.icon}
            />
            <Text style={styles.optionText}>Reviews</Text>
          </TouchableOpacity>

          {/* 📊 Dashboard */}
          <TouchableOpacity style={styles.option} onPress={goToDashboard}>
            <Ionicons
              name="bar-chart-outline"
              size={24}
              color="#008000"
              style={styles.icon}
            />
            <Text style={styles.optionText}>Professional Dashboard</Text>
          </TouchableOpacity>

          {/* 🧾 Shop Performance Log */}
          <TouchableOpacity
            style={styles.option}
            onPress={goToShopPerformanceLog}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color="#008000"
              style={styles.icon}
            />
            <Text style={styles.optionText}> Profit Monitoring</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 🔓 Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* 🚪 Logout Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.yesButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.yesText}>Yes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#008000',
  },
  icon: {
    marginRight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 30,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#27ae60',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  cancelText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  yesButton: {
    backgroundColor: 'green',
  },
  yesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});