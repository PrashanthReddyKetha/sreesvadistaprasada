import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { COLORS } from '../constants/theme';

export default function RootNavigator() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.warmWhite }}>
        <ActivityIndicator color={COLORS.crimson} size="large" />
      </View>
    );
  }

  return (user || isGuest) ? <MainNavigator /> : <AuthNavigator />;
}
