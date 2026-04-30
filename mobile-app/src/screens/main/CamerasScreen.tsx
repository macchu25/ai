import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/config';
import { fetchCameras, addCamera, deleteCamera } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../context/WebSocketContext';
import AppHeader from '../../components/AppHeader';
import CameraCard from '../../components/CameraCard';
import AddCameraModal from '../../components/AddCameraModal';

export default function CamerasScreen() {
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
      Alert.alert('Lỗi', 'Không thể thêm camera.');
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
        renderItem={({ item }) => (
          <CameraCard 
            item={item} 
            hasAlert={alertState[item.id ?? item._id ?? '']} 
            onDelete={handleDeleteCamera}
            onClearAlert={clearAlert}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyBox}>
              <Ionicons name="videocam-outline" size={48} color={COLORS.textDim} style={{marginBottom: 16}} />
              <Text style={styles.emptyTitle}>Chưa có Camera nào{'\n'}được cấu hình</Text>
              <Text style={styles.emptyDesc}>Bấm nút "Thêm" ở trên hoặc vào Hồ Sơ để thiết lập thông tin người thân trước.</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <AddCameraModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddCamera}
        name={newName} setName={setNewName}
        url={newUrl} setUrl={setNewUrl}
        adding={adding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, gap: 14 },
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
  list: { padding: 16, gap: 16, flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 24,
    width: '100%',
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 12, lineHeight: 28 },
  emptyDesc: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  addBtnHeader: { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
