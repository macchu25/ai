import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#475569', '#cbd5e1', '#f8fafc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark-outline" size={24} color="white" style={styles.logoIcon} />
          <Text style={styles.logoText}>
            CASOS<Text style={styles.logoHighlight}>.ai</Text>
          </Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>
            Bảo vệ tối đa bằng các{' '}
            <Text style={styles.titleHighlight}>mô hình AI</Text>{'\n'}
            với CASOS ngay.
          </Text>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.btnContinue} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnText}>Tiếp tục</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 24,
    paddingTop: 60, // Fallback for devices without safe area
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 80,
  },
  logoIcon: {
    marginRight: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  logoHighlight: {
    color: '#60a5fa', // Light blue
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: 'white',
    lineHeight: 52,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleHighlight: {
    color: '#93c5fd', // Lighter blue for the AI text
  },
  footer: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  btnContinue: {
    backgroundColor: '#1e293b', // Dark slate button
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
