import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';

import {
  HomeStackNavigator,
  MarketplaceStackNavigator,
  MoreStackNavigator,
  NotificationsStackNavigator
} from './navigation/TabStacks';

const Tab = createBottomTabNavigator();

type TabsRouteProp = RouteProp<{ Tabs: { username: string } }, 'Tabs'>;

export default function Tabs() {
  const route = useRoute();
  const { username, profileImage, coverImage } = route.params as {
    username: string;
    profileImage: string;
    coverImage: string;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
          } else if (route.name === 'Notifications') {
            return <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />;
          } else if (route.name === 'Marketplace') {
            return <MaterialIcons name="storefront" size={size} color={color} />;
          } else if (route.name === 'More') {
            return <Ionicons name={focused ? 'menu' : 'menu-outline'} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#007a33',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#ccc',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        children={() => <HomeStackNavigator username={username} />}
      />
      <Tab.Screen name="Notifications" component={NotificationsStackNavigator} />
      <Tab.Screen name="Marketplace" component={MarketplaceStackNavigator} />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        initialParams={{
          username,
          profileImage,
          coverImage,
        }}
      />
    </Tab.Navigator>
  );
}
