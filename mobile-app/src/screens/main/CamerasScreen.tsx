import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, API_BASE } from '../../constants/config';
import { fetchCameras, addCamera, deleteCamera } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../context/WebSocketContext';
import AppHeader from '../../components/AppHeader';

export default function CamerasScreen() {
  const navigation = useNavigation<any>();
  const token = useAuthStore((s) => s.user!.token);
  const { alertState, clearAlert } = useWebSocket();

  const [cameras, setCameras]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchCameras(token);
      setCameras(Array.isArray(data) ? data : []);
    } catch (_) { setCameras([]); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddCamera = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên và URL RTSP');
      return;
    }
    setAdding(true);
    try {
      await addCamera(token, { name: newName, rtsp_url: newUrl });
      Alert.alert('Thành công', 'Đã thêm camera mới');
      setModalVisible(false);
      setNewName('');
      setNewUrl('');
      loadData();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể thêm camera. Vui lòng kiểm tra lại URL.');
    }
    setAdding(false);
  };

  const handleDeleteCamera = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa camera này?', [
      { text: 'Huỷ', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await deleteCamera(token, id);
            loadData();
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể xóa camera');
          }
        } 
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const camId   = item.id ?? item._id ?? '';
    const hasAlert = alertState[camId];
    const isOnline = item.status === 'online';

    return (
      <View style={[styles.card, hasAlert && styles.cardAlert]}>
        <View style={[styles.thumb, { backgroundColor: isOnline ? '#1e3a5f' : '#1e293b' }]}>
          {isOnline ? (
            <Ionicons name="videocam" size={32} color={COLORS.primary} />
          ) : (
            <Ionicons name="videocam-off" size={32} color={COLORS.textDim} />
          )}
          <View style={[styles.liveBadge, { backgroundColor: isOnline ? COLORS.danger : COLORS.textDim }]}>
            <Text style={styles.liveBadgeText}>{isOnline ? '● LIVE' : 'OFFLINE'}</Text>
          </View>
          {hasAlert && (
            <View style={styles.alertOverlay}>
              <Ionicons name="warning" size={28} color={COLORS.danger} />
              <Text style={styles.alertOverlayText}>CẢNH BÁO!</Text>
            </View>
          )}
          <TouchableOpacity style={styles.deleteIconBtn} onPress={() => handleDeleteCamera(camId)}>
            <Ionicons name="trash" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.camName}>{item.name}</Text>
          <Text style={styles.camRtsp} numberOfLines={1}>{item.rtsp_url}</Text>
          <Text style={styles.hlsLabel} numberOfLines={1}>ID: {camId}</Text>

          <View style={styles.cardActions}>
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? COLORS.success + '22' : COLORS.textDim + '22' }]}>
              <Text style={[styles.statusText, { color: isOnline ? COLORS.success : COLORS.textDim }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            {hasAlert && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => clearAlert(camId)}>
                <Text style={styles.clearBtnText}>Xoá cảnh báo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Trung Tâm Điều Hành" />

      <View style={styles.pageHeaderRow}>
        <View style={styles.pageHeaderLeft}>
          <Text style={styles.pageTitle}>Phối Cam</Text>
          <Text style={styles.pageSubtitle}>Giám sát thời gian thực</Text>
        </View>
        <TouchableOpacity style={styles.addBtnHeader} onPress={() => setModalVisible(true)}>
          <LinearGradient colors={[COLORS.primary, '#4f46e5']} style={styles.addBtnGrad} start={{x:0, y:0}} end={{x:1, y:0}}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addBtnText}>Thêm</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cameras}
        keyExtractor={(item, i) => String(item.id ?? item._id ?? i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyBox}>
              <Ionicons name="videocam-outline" size={48} color={COLORS.textDim} style={{marginBottom: 16}} />
              <Text style={styles.emptyTitle}>Chưa có Camera nào{'\n'}được cấu hình</Text>
              <Text style={styles.emptyDesc}>Bấm nút "Thêm" ở trên hoặc vào Hồ Sơ để thiết lập thông tin người thân trước.</Text>
              <TouchableOpacity style={styles.configBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.configBtnText}>Thêm Camera Mới</Text>
                <Ionicons name="add-circle-outline" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        }
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Camera Mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Tên Camera</Text>
              <TextInput style={styles.modalInput} placeholder="VD: Phòng khách, Ban công..." value={newName} onChangeText={setNewName} />
              <Text style={styles.inputLabel}>RTSP URL (Luồng video)</Text>
              <TextInput style={styles.modalInput} placeholder="rtsp://admin:password@ip:port/stream" value={newUrl} onChangeText={setNewUrl} autoCapitalize="none" />
              <Text style={styles.inputHint}>Lưu ý: Camera cần hỗ trợ chuẩn RTSP để AI có thể phân tích.</Text>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCamera} disabled={adding}>
                <LinearGradient colors={[COLORS.primary, '#4f46e5']} style={styles.submitBtnGrad}>
                  {adding ? <ActivityIndicator color="white" /> : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.submitBtnText}>XÁC NHẬN THÊM</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  pageHeaderRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  toggleBtn: { padding: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  
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
  },
  refreshBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  list: { padding: 16, gap: 16, flexGrow: 1 },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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
    lineHeight: 28,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  configBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
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

  // Existing Card styles
  card: {
    backgroundColor: 'white', borderRadius: 20,
    borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardAlert: { borderColor: COLORS.danger, borderWidth: 2 },
  thumb: {
    height: 160, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  deleteIconBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 12,
  },
  liveBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20,
  },
  liveBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  alertOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: COLORS.danger + '33',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  alertOverlayText: { color: COLORS.danger, fontWeight: '900', fontSize: 16 },
  cardInfo:   { padding: 14 },
  camName:    { fontSize: 16, fontWeight: '800', color: COLORS.text },
  camRtsp:    { fontSize: 12, color: COLORS.textDim, marginTop: 4 },
  hlsLabel:   { fontSize: 11, color: COLORS.primary + 'aa', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  clearBtn:    { backgroundColor: COLORS.danger + '22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  clearBtnText:{ color: COLORS.danger, fontSize: 11, fontWeight: '700' },

  // New Add Button styles
  addBtnHeader: { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  form: { gap: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  inputHint: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
  submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
});
