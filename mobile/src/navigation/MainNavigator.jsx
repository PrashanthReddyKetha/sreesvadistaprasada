import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '../constants/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import MenuScreen from '../screens/menu/MenuScreen';
import CategoryScreen from '../screens/menu/CategoryScreen';
import ItemDetailScreen from '../screens/menu/ItemDetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import OrderConfirmedScreen from '../screens/cart/OrderConfirmedScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import DabbaWalaScreen from '../screens/profile/DabbaWalaScreen';
import EnquiriesScreen from '../screens/profile/EnquiriesScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import DeliveryAreasScreen from '../screens/profile/DeliveryAreasScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ContactScreen from '../screens/profile/ContactScreen';
import CateringScreen from '../screens/profile/CateringScreen';
import FAQScreen from '../screens/profile/FAQScreen';
import GalleryScreen from '../screens/profile/GalleryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }) {
  const icons = {
    Home: focused ? '🏠' : '🏠',
    Menu: focused ? '🍽' : '🍽',
    Orders: focused ? '📦' : '📦',
    You: focused ? '👤' : '👤',
  };
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{icons[label]}</Text>
      <Text style={{
        fontSize: 10,
        marginTop: 2,
        fontFamily: FONTS.bodyMedium,
        color: focused ? COLORS.crimson : COLORS.grey,
      }}>{label}</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.lightGrey,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Menu" focused={focused} /> }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Orders" focused={focused} /> }}
      />
      <Tab.Screen
        name="YouTab"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="You" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={HomeTabs} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderConfirmed" component={OrderConfirmedScreen} />
      <Stack.Screen name="DabbaWala" component={DabbaWalaScreen} />
      <Stack.Screen name="Enquiries" component={EnquiriesScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="DeliveryAreas" component={DeliveryAreasScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Catering" component={CateringScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
