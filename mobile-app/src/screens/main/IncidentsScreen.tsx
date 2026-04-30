import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import { fetchIncidents } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AppHeader from '../../components/AppHeader';

const LABEL_MAP: Record<string, { label: string; color: string; icon: string }> = {
  fall:    { label: 'Ngã Khẩn Cấp',    color: COLORS.danger,  icon: 'alert-circle'     },
  sitting: { label: 'Ngồi',            color: COLORS.primary, icon: 'person'            },
  lying:   { label: 'Nằm',             color: COLORS.warning, icon: 'bed'               },
  standing:{ label: 'Đứng',            color: COLORS.success, icon: 'body'              },
};

export default function IncidentsScreen() {
  const token = useAuthStore((s) => s.user!.token);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchIncidents(token);
      setIncidents(Array.isArray(data) ? data.reverse() : []);
    } catch (_) {
      setIncidents([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const labelKey  = (item.label ?? item.Label ?? '').toLowerCase();
    const meta = LABEL_MAP[labelKey] ?? { label: item.Label ?? 'Sự cố', color: COLORS.textMuted, icon: 'flash' };
    const date = item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'N/A';
    const conf = item.confidence != null ? `${(item.confidence * 100).toFixed(0)}%` : '';

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />
        <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.labelText}>{meta.label}</Text>
          <Text style={styles.dateText}>{date}</Text>
          {item.camera_id && (
            <Text style={styles.cameraId}>Camera: {String(item.camera_id).slice(-8)}</Text>
          )}
        </View>
        {conf ? (
          <View style={[styles.confBadge, { backgroundColor: meta.color + '22' }]}>
            <Text style={[styles.confText, { color: meta.color }]}>{conf}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải nhật ký...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Nhật Ký Sự Cố" />

      {/* Title & Actions */}
      <View style={styles.pageHeaderRow}>
        <View style={styles.pageHeaderLeft}>
          <Text style={styles.pageTitle}>Nhật Ký</Text>
          <Text style={styles.pageSubtitle}>Lịch sử nhận diện và các tình huống khẩn cấp</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <Ionicons name="refresh" size={16} color={COLORS.text} />
          <Text style={styles.refreshBtnText}>Cập nhật</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyBox}>
              <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.success} style={{marginBottom: 16}} />
              <Text style={styles.emptyTitle}>Hệ thống an toàn</Text>
              <Text style={styles.emptyDesc}>Hiện tại chưa ghi nhận sự cố nào{'\n'}từ các nguồn Camera của bạn.</Text>
            </View>

            <View style={styles.securityBadge}>
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.textDim} />
              <Text style={styles.securityText}>Mã hóa dữ liệu 256-bit • Nhật ký bảo mật</Text>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, gap: 14 },
  loadingText: { color: COLORS.textMuted, fontSize: 15 },

  loadingText: { color: COLORS.textMuted, fontSize: 15 },

  pageHeaderRow: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageHeaderLeft: { flex: 1, paddingRight: 10 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  refreshBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  list: { padding: 16, gap: 12, flexGrow: 1 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'white', borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  cardAccent: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  iconWrap:   { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info:       { flex: 1 },
  labelText:  { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  dateText:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  cameraId:   { fontSize: 11, color: COLORS.textDim, marginTop: 2, fontWeight: '600' },
  confBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  confText:   { fontSize: 11, fontWeight: '800' },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 24,
    width: '100%',
    padding: 40,
    alignItems: 'center',
    marginBottom: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: '600',
  },
});
