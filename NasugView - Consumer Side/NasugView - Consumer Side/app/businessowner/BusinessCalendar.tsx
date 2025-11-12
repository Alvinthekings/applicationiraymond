import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    FlatList,
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

// ✅ Business Owner Events (sample data)
const businessOwnerEvents: {
  [date: string]: { title: string; type: string; time: string; location: string; formURL: string };
} = {
  // 🕓 Past Events
  '2025-05-12': {
    title: 'Digital Marketing for MSMEs',
    type: 'In-person',
    time: '9:00 AM - 11:30 AM',
    location: 'Nasugbu Negosyo Center',
    formURL: '',
  },
  '2025-07-01': {
    title: 'E-Commerce Readiness Seminar',
    type: 'Online via Zoom',
    time: '2:00 PM - 4:00 PM',
    location: 'Zoom Meeting',
    formURL: '',
  },
  '2025-09-05': {
    title: 'Customer Experience and Branding Workshop',
    type: 'In-person',
    time: '1:00 PM - 4:00 PM',
    location: 'Batangas State University - ARASOF Campus',
    formURL: '',
  },

  // 🟢 Future Events
  '2025-11-25': {
    title: 'THE RISE OF ESG METRICS (Environment, Social, and Governance) AND THE EVOLUTION OF SUSTAINABLE CONSUMERISM',
    type: 'In-person',
    time: '9:00 AM - 12:00 PM',
    location: 'Nasugbu Negosyo Center Auditorium',
    formURL:
      'https://docs.google.com/forms/d/e/1FAIpQLSdZChAFOlf3xuo9eDnmtC3eFLXGYLcNT1D9cD5Nc26uxHOL-A/viewform?fbclid=IwY2xjawNdAoxleHRuA2FlbQIxMQABHhl-iRkNC3JfOf5ICzewJGhZfdu9v2lsZdpbXNxDBmuh86H1vQ065FM1E0QY_aem_Gbeq_vV3CUNbEKUCW0eFhA',
  },
  '2025-12-10': {
    title: 'Entrepreneurship and Leadership Forum 2025',
    type: 'Hybrid',
    time: '10:00 AM - 3:00 PM',
    location: 'Nasugbu Town Hall / Zoom',
    formURL: '',
  },
};

export default function EventCalendar() {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const today = new Date();
  const eventDetails = businessOwnerEvents;

  // ✅ Generate marked dates (green for future, gray for past)
  const markedDates: { [date: string]: any } = {};
  Object.keys(eventDetails).forEach((date) => {
    const eventDate = new Date(date);
    const isFuture = eventDate >= today;
    markedDates[date] = {
      marked: true,
      dotColor: isFuture ? '#1D9D65' : 'gray',
      selected: true,
      selectedColor: isFuture ? '#1D9D65' : '#d3d3d3',
    };
  });

  // ✅ Filter and separate future and past events
  const futureEvents = Object.keys(eventDetails)
    .filter((date) => new Date(date) >= today)
    .sort()
    .map((date) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      title: eventDetails[date].title,
    }));

  const pastEvents = Object.keys(eventDetails)
    .filter((date) => new Date(date) < today)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // sort descending
    .map((date) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      title: eventDetails[date].title,
    }));

  const handleDayPress = (day: any) => {
    const date = day.dateString;
    if (eventDetails[date]) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  const selectedEvent = eventDetails[selectedDate];

  const handleRegister = () => {
    if (selectedEvent?.formURL) {
      Linking.openURL(selectedEvent.formURL);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Back Button */}
      

      {/* 🟢 Title */}
      <Text style={styles.title}>Negosyo Center Events</Text>

      {/* 📅 Calendar */}
      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          selectedDayBackgroundColor: '#1D9D65',
          todayTextColor: '#1D9D65',
          arrowColor: '#1D9D65',
          textDayFontSize: 18,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 16,
        }}
      />

      {/* 🟢 Upcoming Events */}
      <Text style={styles.sectionHeader}>Upcoming Events</Text>
      <FlatList
        data={futureEvents}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventDate}>{item.date}</Text>
            <Text style={styles.eventTitle}>{item.title}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 10 }}
      />

      {/* ⚪ Past Events */}
      <Text style={styles.sectionHeader}>Past Events</Text>
      <FlatList
        data={pastEvents}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.eventCard, { backgroundColor: '#F2F2F2' }]}>
            <Text style={[styles.eventDate, { color: 'gray' }]}>{item.date}</Text>
            <Text style={[styles.eventTitle, { color: '#555' }]}>{item.title}</Text>
          </View>
        )}
      />

      {/* 📌 Event Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
            <Text style={styles.modalText}>Event Type: {selectedEvent?.type}</Text>
            <Text style={styles.modalText}>Time: {selectedEvent?.time}</Text>
            <Text style={styles.modalText}>Location: {selectedEvent?.location}</Text>

            {selectedEvent?.formURL ? (
              <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            ) : null}

            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    marginLeft: 8,
    color: '#1D9D65',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1D9D65',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    color: '#1D9D65',
  },
  eventCard: {
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D9D65',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1D9D65',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 6,
  },
  registerBtn: {
    marginTop: 18,
    backgroundColor: '#1D9D65',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeText: {
    color: 'gray',
    marginTop: 14,
    fontSize: 15,
    textAlign: 'center',
  },
});
