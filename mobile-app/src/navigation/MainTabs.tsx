import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';
import { useWebSocket } from '../context/WebSocketContext';

import HomeScreen       from '../screens/main/HomeScreen';
import CamerasScreen    from '../screens/main/CamerasScreen';
import IncidentsScreen  from '../screens/main/IncidentsScreen';
import CPRScreen        from '../screens/main/CPRScreen';
import ProfileScreen    from '../screens/main/ProfileScreen';
import SettingsScreen   from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { alertState } = useWebSocket();
  const totalAlerts = Object.values(alertState).filter(Boolean).length;

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:      ['home',             'home-outline'],
            Cameras:   ['grid',             'grid-outline'],
            Incidents: ['list-circle',      'list-circle-outline'],
            CPR:       ['heart-circle',     'heart-circle-outline'],
            Profile:   ['person-circle',    'person-circle-outline'],
            Settings:  ['settings',         'settings-outline'],
          };
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? activeIcon : inactiveIcon) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Tổng Quan',
          tabBarBadge: totalAlerts > 0 ? totalAlerts : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.danger },
        }}
      />
      <Tab.Screen
        name="Cameras"
        component={CamerasScreen}
        options={{ tabBarLabel: 'Camera' }}
      />
      <Tab.Screen
        name="Incidents"
        component={IncidentsScreen}
        options={{ tabBarLabel: 'Sự Cố' }}
      />
      <Tab.Screen
        name="CPR"
        component={CPRScreen}
        options={{
          tabBarLabel: 'Sơ Cứu',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'heart-circle' : 'heart-circle-outline'}
              size={size}
              color={COLORS.danger}
            />
          ),
          tabBarActiveTintColor: COLORS.danger,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Hồ Sơ' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Cấu hình' }}
      />
    </Tab.Navigator>
  );
}
