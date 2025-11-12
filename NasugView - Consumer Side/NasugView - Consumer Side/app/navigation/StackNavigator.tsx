import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar } from 'react-native';

// Business Owner Screens
import BusinessCalendar from '../businessowner/BusinessCalendar'; // ✅ ADDED
import BusinessProfile from '../businessowner/BusinessProfile';
import ProfessionalDashboard from '../businessowner/ProfessionalDashboard';
import ShopPerformanceLog from '../businessowner/ShopPerformanceLog';
import SettingsSection from '../sections/SettingsScreen'; // <-- Correct file path


// Shared Screens
import Tabs from '../index';
import Login from '../login';
import Signup from '../signup';

// User / Consumer Screens
import BusinessDetails from '../sections/BusinessDetails';
import EventCalendar from '../sections/EventCalendar';
import ProductDetails from '../sections/ProductDetails';
import Review from '../sections/Review';
import SubmitReview from '../sections/SubmitReview';
import SubmitReviewNo from '../sections/SubmitReviewNo';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Tabs: { username: string; profileImage?: string; coverImage?: string };
  Home2: { username: string; profileImage?: string; coverImage?: string };
  Profile: undefined;
  EventCalendar: undefined;
  BusinessCalendar: undefined; // ✅ ADDED

  Marketplace: undefined;
  Ureviews: { username: string };

  BusinessDetails: { 
    id?: number;            
    name: string; 
    image: string;          
    address: string;        
    username: string; 
    category?: string; 
  };

  Review: {
    id: number;
    name: string;
    image: string;
    address: string;
    username: string;
    category?: string;
  };

  SubmitReview: {
    name: string;
    image: any;
    address: string;
    username: string;
    category?: string;
  };

  SubmitReviewNo: {
    name: string;
    image: string;
    address: string;
    username: string;
    category?: string;
  };

  BusinessProfile: undefined; 
  ProfessionalDashboard: {
    username: string;
    profileImage?: string;
    coverImage?: string;
  };

 ProductDetails: {
    product_id: number;
    name: string;
    price: number;
    category: string;
    media: string[];
  };

  ShopPerformanceLog: {
    username: string;
    profileImage?: string;
    coverImage?: string;
  };
  SettingsSection: undefined;

};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>

        {/* Auth */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />

        {/* Tabs */}
        <Stack.Screen name="Tabs" component={Tabs} />

        {/* Event / Business Calendars */}
        <Stack.Screen name="EventCalendar" component={EventCalendar} />
        <Stack.Screen
          name="BusinessCalendar"
          component={BusinessCalendar}
          options={{
            headerShown: true,
            title: 'Business Calendar',
            headerStyle: { backgroundColor: '#2e7d32' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />

        {/* Business Details */}
        <Stack.Screen
          name="BusinessDetails"
          component={BusinessDetails}
          options={{
            headerShown: true,
            title: 'Business Details',
          }}
        />

   <Stack.Screen
          name="ProductDetails"
          component={ProductDetails}
          options={{
            headerShown: true,
            title: 'Product Details',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#000',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />

        {/* Review Screens */}
        <Stack.Screen
          name="Review"
          component={Review}
          options={{ headerShown: true, title: 'Write a Review' }}
        />
        <Stack.Screen
          name="SubmitReview"
          component={SubmitReview}
          options={{
            headerShown: true,
            title: 'Submit a Review',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: 'black',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="SubmitReviewNo"
          component={SubmitReviewNo}
          options={{
            headerShown: true,
            title: 'Submit a Review',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: 'black',
          }}
        />

        {/* Business Owner Screens */}
        <Stack.Screen
          name="BusinessProfile"
          component={BusinessProfile}
          options={{
            headerShown: true,
            title: 'Business Profile',
            headerStyle: { backgroundColor: '#2e7d32' },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen
          name="ProfessionalDashboard"
          component={ProfessionalDashboard}
          options={{
            headerShown: true,
            title: 'Professional Dashboard',
            headerStyle: { backgroundColor: '#2e7d32' },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen
          name="ShopPerformanceLog"
          component={ShopPerformanceLog}
          options={{
            headerShown: true,
            title: 'Shop Performance Log',
            headerStyle: { backgroundColor: '#2e7d32' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        {/* ✅ Settings Section */}
        <Stack.Screen
          name="SettingsSection"
          component={SettingsSection}
          options={{
            headerShown: true,
            title: 'Settings & Profile',
            headerStyle: { backgroundColor: '#2e7d32' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />

      </Stack.Navigator>
    </>
  );
}


