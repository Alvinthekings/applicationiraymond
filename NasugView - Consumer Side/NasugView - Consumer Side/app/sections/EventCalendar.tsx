import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function EventCalendar() {
  const navigation = useNavigation();
  const { date } = useLocalSearchParams();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const events: { [key: string]: { name: string; location: string; time: string } } = {
    '2025-06-22': { name: 'Fun Run', location: 'Town Convention Center', time: '10:00 AM – 3:00 PM' },
    '2025-07-01': { name: 'Coastal Cleanup', location: 'Co-Working Space', time: '2:00 PM – 5:00 PM' },
    '2025-06-30': { name: 'Coastal Cleanup: Nasugbu Beach', location: 'Eco Park Pavilion', time: '9:00 AM – 12:00 PM' },
    '2025-07-05': { name: 'Mamaraka', location: 'Municipal Hall of Nasugbu', time: '3:00 PM – 5:00 PM' },
  };

  useEffect(() => {
    if (date && typeof date === 'string') {
      setSelectedDate(date);
    } else {
      setSelectedDate(today);
    }
  }, [date]);

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const markedDates: { [key: string]: any } = {
    [today]: {
      selected: true,
      selectedColor: '#2ecc71',
    },
  };

  if (selectedDate && selectedDate !== today) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: 'white',
      customStyles: {
        container: {
          borderColor: '#2ecc71',
          borderWidth: 2,
          borderRadius: 16,
        },
        text: {
          color: '#2ecc71',
        },
      },
    };
  }

  Object.keys(events).forEach((eventDate) => {
    markedDates[eventDate] = {
      selected: true,
      selectedColor: '#3498db',
    };
  });

  return (
    <View style={styles.container}>
      {/* 🔝 Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Event Calendar</Text>
      </View>

      {/* 🔹 Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
          <Text style={styles.legendText}>Event</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>

      {/* 📅 Calendar */}
      <Calendar
        current={selectedDate || today}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="custom"
        theme={{
          arrowColor: '#004225',
          todayTextColor: '#004225',
          monthTextColor: '#004225',
          textSectionTitleColor: '#004225',
        }}
      />

      {/* 📌 Event Info */}
      {selectedDate && events[selectedDate] && (
        <View style={styles.eventCard}>
          <Text style={styles.eventText}>{events[selectedDate].name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  eventCard: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  eventText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
