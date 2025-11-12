import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/StackNavigator'; // ✅ updated

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;
export default function Notifications() {
  const navigation = useNavigation<NavigationProp>();

  const data = [
    {
      section: 'Today',
      items: [
        {
          icon: 'calendar-outline',
          title: 'Events',
          time: '23 min',
          message: "Don't miss out! A new event is just around the corner. Take this opportunity to participate.",
          link: 'Open Calendar',
        },
      
      ],
    },
    {
      section: 'Yesterday',
      items: [
         {
          icon: 'notifications-outline',
          title: 'Reminder!',
          time: '16 hr',
          message: "There's an exciting event happening today!",
          link: 'See Details',
        },
      ],
      
    },
    {
      section: 'Old',
      items: [
        {
          icon: 'notifications-outline',
          title: 'React',
          time: '9 d',
          message: "Sheila liked your post.",
          link: 'See Details',
        },
        
      ],
      
    },
  ];

  

  return (
    <ScrollView style={styles.container}>
      {data.map((group, i) => (
        <View key={i}>
          <Text style={styles.sectionHeader}>{group.section}</Text>
          {group.items.map((item, j) => (
            <View key={j} style={[styles.card, item.title === 'Events' && styles.eventCard]}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color="#333"
                  style={styles.icon}
                />
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (item.link === 'Open Calendar') {
                    navigation.navigate('EventCalendar');
                  }
                }}
              >
                <Text style={styles.link}>{item.link}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#eaf8f0',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  cardTitle: {
    fontWeight: 'bold',
    flex: 1,
    fontSize: 15,
  },
  time: {
    fontSize: 12,
    color: '#777',
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    color: '#444',
  },
  link: {
    marginTop: 6,
    color: '#0080ff',
    fontWeight: '500',
    fontSize: 13,
  },
});
