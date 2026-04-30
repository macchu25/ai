import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import AppHeader from '../../components/AppHeader';

interface Step {
  step: number;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

const CPR_STEPS: Step[] = [
  { step: 1, title: 'Kiểm tra môi trường',     desc: 'Đảm bảo khu vực an toàn. Gọi tên bệnh nhân, kiểm tra phản ứng', icon: 'eye',            color: '#3b82f6' },
  { step: 2, title: 'Gọi cấp cứu ngay',        desc: 'Gọi 115 hoặc nhờ ai gọi. Xác nhận đã gọi trước khi bắt đầu CPR', icon: 'call',           color: '#ef4444' },
  { step: 3, title: 'Kiểm tra nhịp thở',       desc: 'Nghiêng đầu - nâng cằm. Nhìn, nghe, cảm nhận trong 10 giây', icon: 'ear',             color: '#f59e0b' },
  { step: 4, title: 'Bắt đầu ép ngực',         desc: '30 lần ép ngực: tốc độ 100-120 lần/phút, sâu 5-6cm', icon: 'heart',          color: '#ef4444' },
  { step: 5, title: 'Hô hấp nhân tạo (x2)',   desc: '2 nhịp thổi: nghiêng đầu, bịt mũi, thổi 1 giây/lần', icon: 'fitness',        color: '#10b981' },
  { step: 6, title: 'Lặp lại chu kỳ',         desc: 'Tiếp tục 30:2 đến khi xe cấp cứu đến hoặc bệnh nhân hồi tỉnh', icon: 'refresh-circle', color: '#8b5cf6' },
];

const EMERGENCY_NUMBERS = [
  { label: 'Cấp cứu 115', number: '115', icon: 'ambulance', color: '#ef4444' },
  { label: 'Cảnh sát 113', number: '113', icon: 'shield', color: '#3b82f6' },
  { label: 'Cứu hỏa 114', number: '114', icon: 'flame', color: '#f59e0b' },
];

export default function CPRScreen() {
  const callNumber = (num: string, label: string) => {
    Alert.alert(`Gọi ${label}`, `Gọi ngay ${num}?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: `Gọi ${num}`, onPress: () => Linking.openURL(`tel:${num}`) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader title="Sơ Cứu Khẩn Cấp" type="danger" />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient colors={[COLORS.danger, '#7f1d1d']} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroContent}>
            <View style={styles.heroPulse}>
              <Ionicons name="heart-circle" size={48} color="white" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Kỹ thuật CPR</Text>
              <Text style={styles.heroSub}>Quy trình hồi sinh tim phổi chuẩn quốc tế</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Emergency numbers */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📞 Gọi cấp cứu ngay</Text>
      </View>
      <View style={styles.callRow}>
        {EMERGENCY_NUMBERS.map((e) => (
          <TouchableOpacity key={e.number} style={[styles.callCard, { borderColor: e.color + '33' }]} onPress={() => callNumber(e.number, e.label)}>
            <View style={[styles.callIcon, { backgroundColor: e.color + '11' }]}>
              <Ionicons name={e.icon as any} size={24} color={e.color} />
            </View>
            <Text style={[styles.callNumber, { color: e.color }]}>{e.number}</Text>
            <Text style={styles.callLabel}>{e.label.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ratio reminder */}
      <View style={styles.ratioSection}>
        <View style={styles.ratioBanner}>
          <View style={styles.ratioItem}>
            <Text style={styles.ratioValue}>30</Text>
            <Text style={styles.ratioLabel}>Lần ép ngực</Text>
          </View>
          <View style={styles.ratioDivider} />
          <View style={styles.ratioItem}>
            <Text style={[styles.ratioValue, { color: COLORS.success }]}>02</Text>
            <Text style={styles.ratioLabel}>Lần thổi ngạt</Text>
          </View>
        </View>
      </View>

      {/* Steps */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📋 Quy trình 6 bước</Text>
      </View>
      {CPR_STEPS.map((s) => (
        <View key={s.step} style={styles.stepCard}>
          <View style={[styles.stepNum, { backgroundColor: s.color + '11' }]}>
            <Text style={[styles.stepNumText, { color: s.color }]}>{s.step}</Text>
          </View>
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
              <Text style={styles.stepTitleText}>{s.title}</Text>
            </View>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}

      {/* Warning */}
      <View style={styles.warnCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.warnHeading}>Lưu ý quan trọng</Text>
          <Text style={styles.warnText}>
            Thông tin chỉ mang tính tham khảo. Luôn gọi 115 ngay lập tức trong tình huống khẩn cấp.
          </Text>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content:   { paddingBottom: 20 },

  content:   { paddingBottom: 20 },

  heroSection: { padding: 20 },
  heroGradient: {
    padding: 24, borderRadius: 24,
    shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8,
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroPulse:  { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle:  { fontSize: 22, fontWeight: '900', color: 'white' },
  heroSub:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },

  sectionHeader: { paddingHorizontal: 24, marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },

  callRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  callCard: {
    flex: 1, backgroundColor: 'white',
    borderRadius: 24, padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  callIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  callNumber: { fontSize: 24, fontWeight: '900' },
  callLabel:  { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  ratioSection: { paddingHorizontal: 20, marginTop: 20 },
  ratioBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: 'white', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: COLORS.danger + '33',
  },
  ratioItem: { alignItems: 'center' },
  ratioValue: { fontSize: 32, fontWeight: '900', color: COLORS.danger },
  ratioLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '700', marginTop: 4 },
  ratioDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },

  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    backgroundColor: 'white', borderRadius: 24,
    marginHorizontal: 20, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  stepNum:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 22, fontWeight: '900' },
  stepContent: { flex: 1 },
  stepHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  stepTitleText:   { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  stepDesc:    { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, fontWeight: '500' },

  warnCard: {
    flexDirection: 'row', gap: 16, alignItems: 'center',
    backgroundColor: COLORS.warning + '11',
    marginHorizontal: 20, marginTop: 24,
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: COLORS.warning + '33',
  },
  warnHeading: { fontSize: 16, fontWeight: '800', color: COLORS.warning, marginBottom: 4 },
  warnText: { fontSize: 12, color: COLORS.warning, lineHeight: 18, fontWeight: '600' },
});
