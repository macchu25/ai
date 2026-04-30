import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import AppHeader from '../../components/AppHeader';

export default function SettingsScreen() {
  const [thrLow, setThrLow] = useState(0.015);
  const [thrHigh, setThrHigh] = useState(0.040);
  const [audioAlert, setAudioAlert] = useState(true);
  const [telegramAlert, setTelegramAlert] = useState(false);

  const saveConfig = () => {
    Alert.alert('✅ Thành công', 'Cấu hình hệ thống đã được lưu lại.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader title="Cấu Hình" />

      {/* Page Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Cài đặt hệ thống</Text>
        <Text style={styles.pageSubtitle}>Tùy chỉnh tham số AI và phương thức nhận cảnh báo</Text>
      </View>

      {/* AI Sensitivity Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBadge, { backgroundColor: COLORS.primary + '11' }]}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.sectionTitleText}>Độ nhạy AI (Thresholds)</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Ngưỡng Bất Động (THR_LOW)</Text>
              <Text style={styles.settingDesc}>Dưới mức này AI coi là đối tượng đang bất động.</Text>
            </View>
            <View style={[styles.valueBadge, { backgroundColor: COLORS.primary + '11' }]}>
              <Text style={[styles.valueText, { color: COLORS.primary }]}>{thrLow.toFixed(3)}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Ngưỡng Co Giật (THR_HIGH)</Text>
              <Text style={styles.settingDesc}>Trên mức này AI kích hoạt cảnh báo co giật.</Text>
            </View>
            <View style={[styles.valueBadge, { backgroundColor: COLORS.warning + '11' }]}>
              <Text style={[styles.valueText, { color: COLORS.warning }]}>{thrHigh.toFixed(3)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBadge, { backgroundColor: COLORS.warning + '11' }]}>
            <Ionicons name="notifications" size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.sectionTitleText}>Thông báo & Cảnh báo</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.switchItem}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Âm thanh báo động</Text>
              <Text style={styles.settingDesc}>Phát còi hú khi phát hiện ngã.</Text>
            </View>
            <Switch value={audioAlert} onValueChange={setAudioAlert} trackColor={{ false: '#e2e8f0', true: COLORS.primary }} thumbColor="white" />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchItem}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Gửi Telegram / SMS</Text>
              <Text style={styles.settingDesc}>Gửi tin nhắn khẩn cấp cho người thân.</Text>
            </View>
            <Switch value={telegramAlert} onValueChange={setTelegramAlert} trackColor={{ false: '#e2e8f0', true: COLORS.primary }} thumbColor="white" />
          </View>
        </View>
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBadge, { backgroundColor: COLORS.success + '11' }]}>
            <Ionicons name="hardware-chip" size={20} color={COLORS.success} />
          </View>
          <Text style={styles.sectionTitleText}>Thiết bị liên kết</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>AI Service (Py)</Text>
            <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '11' }]}>
              <Text style={[styles.statusText, { color: COLORS.success }]}>Kết nối tốt</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Core Backend (Go)</Text>
            <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '11' }]}>
              <Text style={[styles.statusText, { color: COLORS.success }]}>Kết nối tốt</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Database (Cloud)</Text>
            <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '11' }]}>
              <Text style={[styles.statusText, { color: COLORS.success }]}>Kết nối tốt</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveConfig}>
          <LinearGradient colors={[COLORS.primary, COLORS.gradient2]} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="save" size={20} color="white" />
            <Text style={styles.saveBtnText}>LƯU CẤU HÌNH</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Sử dụng <Text style={{fontWeight: '700'}}>Webcam Local</Text> để calibrate ngưỡng Variance trước khi áp dụng cho camera giám sát treo tường.
          </Text>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  content:     { paddingBottom: 20 },

  content:     { paddingBottom: 20 },

  pageHeader: { padding: 24, paddingTop: 12, backgroundColor: 'white' },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitleText: { fontSize: 16, fontWeight: '800', color: '#1e293b' },

  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingText: { flex: 1, paddingRight: 16 },
  settingLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  settingDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  
  valueBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  valueText: { fontSize: 14, fontWeight: '800' },
  
  divider: { height: 1, backgroundColor: '#f8fafc', marginVertical: 16 },

  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },

  actionSection: { padding: 20, marginTop: 10, gap: 16 },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  saveBtnText: { color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1 },

  tipCard: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.primary + '11', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.primary + '22' },
  tipText: { flex: 1, fontSize: 13, color: '#1e293b', lineHeight: 20 },
});
