import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import BusinessDetails from '../sections/BusinessDetails';
import EventCalendar from '../sections/EventCalendar';
import Profile from '../sections/Profile';
import Review from '../sections/Review';
import SubmitReview from '../sections/SubmitReview';
import SubmitReviewNo from '../sections/SubmitReviewNo';
import Home from '../tabs/home';
import Marketplace from '../tabs/marketplace';
import More from '../tabs/more';
import Notifications from '../tabs/notifications';


const HomeStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const MarketplaceStack = createNativeStackNavigator();
const NotificationsStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs


// TabStacks.tsx
export default function TabNavigator() {
  const route = useRoute();
  const { username, profileImage, coverImage, role } = route.params as {
    username: string;
    profileImage: string;
    coverImage: string;
    role: string; // 👈 added
  };

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        children={() => <HomeStackNavigator username={username} />}
      />
      <Tab.Screen name="Marketplace" component={MarketplaceStackNavigator} />
      <Tab.Screen name="Notifications" component={NotificationsStackNavigator} />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        initialParams={{ username, profileImage, coverImage, role }} // 👈 pass role
      />
    </Tab.Navigator>
  );
}

// HOME stack
export function HomeStackNavigator({ username }: { username: string }) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: true }}>
      <HomeStack.Screen
        name="HomeMain"
        component={Home}
        initialParams={{ username }}
        options={{ title: 'Home' }}
      />
      <HomeStack.Screen
        name="BusinessDetails"
        component={BusinessDetails}
        options={({ route }) => ({
          title: (route.params as { name: string }).name,
        })}
      />
      <HomeStack.Screen name="Review" component={Review} options={{ title: 'Write a Review' }} />
      <HomeStack.Screen name="SubmitReview" component={SubmitReview} options={{ title: 'Submit Review' }} />
    </HomeStack.Navigator>
  );
}

export function MoreStackNavigator({ route }: { route: any }) {
  const { username, profileImage, coverImage, role } = route.params;

  return (
    <MoreStack.Navigator screenOptions={{ headerShown: true }}>
      <MoreStack.Screen
        name="More"
        component={More}
        initialParams={{ username, profileImage, coverImage, role }}
      />
      <MoreStack.Screen
        name="Profile"
        component={Profile}
        initialParams={{ username, profileImage, coverImage }}
        options={{ headerShown: false }}
      />
      <MoreStack.Screen name="EventCalendar" component={EventCalendar} options={{ headerShown: false }} />
    </MoreStack.Navigator>
  );
}


// MARKETPLACE stack
export function MarketplaceStackNavigator() {
  return (
    <MarketplaceStack.Navigator screenOptions={{ headerShown: true }}>
      <MarketplaceStack.Screen name="MarketplaceMain" component={Marketplace} options={{ title: 'Marketplace' }} />
      <MarketplaceStack.Screen
        name="BusinessDetails"
        component={BusinessDetails}
        options={({ route }) => ({
          title: (route.params as { name: string }).name,
        })}
      />
      <MarketplaceStack.Screen name="Review" component={Review} options={{ title: 'Write a Review' }} />
      <MarketplaceStack.Screen name="SubmitReview" component={SubmitReview} options={{ title: 'Submit a Review' }} />
      <MarketplaceStack.Screen 
  name="SubmitReviewNo" 
  component={SubmitReviewNo} 
  
/>

    </MarketplaceStack.Navigator>
  );
}

// NOTIFICATIONS stack
export function NotificationsStackNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: true }}>
      <NotificationsStack.Screen
        name="NotificationsMain"
        component={Notifications}
        options={{ title: 'Notifications' }}
      />
      <NotificationsStack.Screen
        name="EventCalendar"
        component={EventCalendar}
        options={{ headerShown: false }}
      />
    </NotificationsStack.Navigator>
  );
}
