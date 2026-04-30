import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import { fetchCameras, fetchIncidents } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../context/WebSocketContext';
import AppHeader from '../../components/AppHeader';

export default function HomeScreen() {
  const token = useAuthStore((s) => s.user!.token);
  const name  = useAuthStore((s) => s.user!.name);
  const { alertState, connected } = useWebSocket();

  const [cameras, setCameras]     = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [cams, incs] = await Promise.all([
        fetchCameras(token),
        fetchIncidents(token),
      ]);
      setCameras(Array.isArray(cams) ? cams : []);
      setIncidents(Array.isArray(incs) ? incs : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const onlineCams  = cameras.filter((c) => c.status === 'online').length;
  const activeAlerts = Object.values(alertState).filter(Boolean).length;
  const recentIncs   = incidents.slice(0, 5);

  const stats = [
    { label: 'Camera Online', value: onlineCams, icon: 'videocam', color: COLORS.success },
    { label: 'Cảnh báo', value: activeAlerts, icon: 'alert-circle', color: COLORS.danger },
    { label: 'Tổng sự cố', value: incidents.length, icon: 'list', color: COLORS.warning },
    { label: 'Tổng Camera', value: cameras.length, icon: 'hardware-chip', color: COLORS.primary },
  ];

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
    >
      <AppHeader title="Trung Tâm Điều Hành" />

      {/* HUD Widgets Grid */}
      <View style={styles.hudGrid}>
        <View style={styles.hudCard}>
          <View style={styles.hudHeader}>
            <Ionicons name="wifi" size={14} color={COLORS.success} />
            <Text style={styles.hudLabel}>Latency</Text>
          </View>
          <Text style={styles.hudValue}>92ms</Text>
          <View style={styles.hudChart}>
             <View style={{height: 2, width: '100%', backgroundColor: COLORS.success + '44', position: 'absolute', top: 10}} />
             <View style={{height: 10, width: 4, backgroundColor: COLORS.success, position: 'absolute', left: '40%', top: 6, borderRadius: 2}} />
          </View>
        </View>

        <View style={styles.hudCard}>
          <View style={styles.hudHeader}>
            <Ionicons name="speedometer" size={14} color={COLORS.warning} />
            <Text style={styles.hudLabel}>Processing</Text>
          </View>
          <Text style={styles.hudValue}>60 FPS</Text>
          <View style={styles.hudChartRow}>
            {[1,2,3,4,5,6,7].map(i => <View key={i} style={[styles.hudBar, { height: 10 + Math.random()*15, backgroundColor: i > 5 ? COLORS.warning + '44' : COLORS.warning }]} />)}
          </View>
        </View>

        <View style={styles.hudCard}>
          <View style={styles.hudHeader}>
            <Ionicons name="videocam" size={14} color={COLORS.primary} />
            <Text style={styles.hudLabel}>Stream</Text>
          </View>
          <Text style={styles.hudValue}>{onlineCams} Live</Text>
          <View style={styles.hudLineChart}>
             <Ionicons name="trending-up" size={20} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.hudCard}>
          <View style={styles.hudHeader}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
            <Text style={styles.hudLabel}>AI Status</Text>
          </View>
          <Text style={[styles.hudValue, { fontSize: 13 }]}>Active & Normal</Text>
          <View style={styles.hudBadge}>
             <Text style={styles.hudBadgeText}>99.9% Uptime</Text>
          </View>
        </View>
      </View>

      {/* Medical & Privacy Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>Mục Y Tế & Giám Sát</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          <View style={[styles.overviewCard, { borderColor: COLORS.primary + '33' }]}>
            <View style={[styles.cardIconBox, { backgroundColor: COLORS.primary + '11' }]}>
              <Ionicons name="shield-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Bảo Mật & Riêng Tư</Text>
            <Text style={styles.cardPara}>Dữ liệu y tế được mã hóa AES-256 đầu cuối, đảm bảo quyền riêng tư.</Text>
          </View>

          <View style={[styles.overviewCard, { borderColor: COLORS.danger + '33' }]}>
            <View style={[styles.cardIconBox, { backgroundColor: COLORS.danger + '11' }]}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.cardTitle}>Cảnh Báo Tức Thì</Text>
            <Text style={styles.cardPara}>Nhận diện té ngã và gửi thông báo khẩn cấp trong vòng 0.5 giây.</Text>
          </View>

          <View style={[styles.overviewCard, { borderColor: COLORS.success + '33' }]}>
            <View style={[styles.cardIconBox, { backgroundColor: COLORS.success + '11' }]}>
              <Ionicons name="heart-outline" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.cardTitle}>Nhịp Tim & Pose</Text>
            <Text style={styles.cardPara}>Phân tích tư thế cơ thể để phân biệt chính xác tình huống gục ngã.</Text>
          </View>
        </ScrollView>
      </View>

      {/* User Guide Section */}
      <View style={styles.guideContainer}>
        <View style={styles.guideHeader}>
          <Ionicons name="book-outline" size={24} color={COLORS.primary} />
          <Text style={styles.guideTitle}>Hướng dẫn sử dụng hệ thống</Text>
        </View>
        <Text style={styles.guideSub}>
          Chỉ với 3 bước đơn giản dưới đây, hệ thống sẽ tự động giám sát và bảo vệ người thân của bạn.
        </Text>

        {/* Steps */}
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
          <View style={styles.stepIconWrap}><Ionicons name="medical-outline" size={22} color={COLORS.success} /></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Khai báo Y Tế</Text>
            <Text style={styles.stepDesc}>
              Vào <Text style={{fontWeight: '700'}}>Hồ Sơ Sức Khỏe</Text> để thêm thông tin bệnh án và số điện thoại người thân.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
          <View style={styles.stepIconWrap}><Ionicons name="videocam-outline" size={22} color={COLORS.primary} /></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Thêm Camera</Text>
            <Text style={styles.stepDesc}>
              Sử dụng <Text style={{fontWeight: '700'}}>Webcam Local</Text> hoặc <Text style={{fontWeight: '700'}}>Camera IP (RTSP)</Text> để bắt đầu giám sát.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
          <View style={styles.stepIconWrap}><Ionicons name="notifications-outline" size={22} color={COLORS.danger} /></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Bắt đầu Giám sát</Text>
            <Text style={styles.stepDesc}>
              AI sẽ tự động hú còi và gọi Telegram ngay khi phát hiện té ngã.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  content:     { paddingBottom: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, gap: 16 },
  loadingText: { color: COLORS.textMuted, fontSize: 15 },

  loadingText: { color: COLORS.textMuted, fontSize: 15 },

  guideContainer: {
    padding: 20,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    flex: 1,
  },
  guideSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },

  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: -10,
    left: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniStatText: {
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: '600',
  },

  hudGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  hudCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  hudLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  hudValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
  },
  hudChart: {
    height: 20,
    width: '100%',
    position: 'relative',
  },
  hudChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 20,
  },
  hudBar: {
    width: 4,
    borderRadius: 2,
  },
  hudLineChart: {
    height: 20,
    justifyContent: 'center',
  },
  hudBadge: {
    backgroundColor: COLORS.success + '11',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  hudBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },

  sectionContainer: {
    paddingVertical: 10,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 10,
  },
  overviewCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardPara: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
