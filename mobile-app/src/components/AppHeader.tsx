import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  type?: 'primary' | 'danger' | 'warning';
}

export default function AppHeader({ title, subtitle, type = 'primary' }: AppHeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const colorMap = {
    primary: COLORS.primary,
    danger: COLORS.danger,
    warning: COLORS.warning,
  };

  const activeColor = colorMap[type];

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{title} <Text style={{color: activeColor}}>AI</Text></Text>
        <Text style={styles.headerDate}>
          {time.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}, {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
      </View>
      <View style={styles.headerIcons}>
        <View style={styles.iconCircle}>
          <Ionicons name={type === 'danger' ? 'medical' : type === 'warning' ? 'alert-circle' : 'pulse'} size={20} color={activeColor} />
        </View>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.primary, marginLeft: 12 }]}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>AD</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingTop: (StatusBar.currentHeight || 0) + 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  headerDate: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
});
