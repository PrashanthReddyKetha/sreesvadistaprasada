import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '../constants/theme';

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
const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const MenuStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ label, focused }) {
  const icons = { Home: '🏠', Menu: '🍽', Orders: '📦', You: '👤' };
  return (
    <View style={{ alignItems: 'center', paddingTop: 2 }}>
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

// ─── Per-tab stacks (keep tab bar visible on all screens) ────────────────────

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Category" component={CategoryScreen} />
      <HomeStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </HomeStack.Navigator>
  );
}

function MenuStackNav() {
  return (
    <MenuStack.Navigator screenOptions={{ headerShown: false }}>
      <MenuStack.Screen name="MenuMain" component={MenuScreen} />
      <MenuStack.Screen name="Category" component={CategoryScreen} />
      <MenuStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </MenuStack.Navigator>
  );
}

function OrdersStackNav() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersMain" component={OrdersScreen} />
      <OrdersStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="DabbaWala" component={DabbaWalaScreen} />
      <ProfileStack.Screen name="Enquiries" component={EnquiriesScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
      <ProfileStack.Screen name="DeliveryAreas" component={DeliveryAreasScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Contact" component={ContactScreen} />
      <ProfileStack.Screen name="Catering" component={CateringScreen} />
      <ProfileStack.Screen name="FAQ" component={FAQScreen} />
      <ProfileStack.Screen name="Gallery" component={GalleryScreen} />
      <ProfileStack.Screen name="Category" component={CategoryScreen} />
      <ProfileStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Bottom tabs ─────────────────────────────────────────────────────────────

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
        component={HomeStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Menu" focused={focused} /> }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Orders" focused={focused} /> }}
      />
      <Tab.Screen
        name="YouTab"
        component={ProfileStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="You" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Root stack (modal screens sit above tabs, no tab bar) ───────────────────

export default function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={HomeTabs} />
      {/* Full-screen modal flows — intentionally hide tab bar */}
      <RootStack.Screen name="Cart" component={CartScreen} options={{ presentation: 'modal' }} />
      <RootStack.Screen name="Checkout" component={CheckoutScreen} />
      <RootStack.Screen name="OrderConfirmed" component={OrderConfirmedScreen} options={{ gestureEnabled: false }} />
    </RootStack.Navigator>
  );
}
