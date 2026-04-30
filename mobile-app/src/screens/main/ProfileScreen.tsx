import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, Alert,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import { fetchHealthProfile, updateContacts } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AppHeader from '../../components/AppHeader';

interface Contact {
  id?: string;
  name: string;
  phone: string;
  relation: string;
}

export default function ProfileScreen() {
  const token   = useAuthStore((s) => s.user!.token);
  const myName  = useAuthStore((s) => s.user!.name);
  const logout  = useAuthStore((s) => s.logout);

  const [profile, setProfile]     = useState<any>(null);
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating]     = useState(false);

  // Profile fields
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [bloodType, setBloodType] = useState('');

  // Add contact form
  const [newName, setNewName]       = useState('');
  const [newPhone, setNewPhone]     = useState('');
  const [newRelation, setNewRelation] = useState('');

  const loadData = async () => {
    try {
      const p = await fetchHealthProfile(token);
      setProfile(p);
      setContacts(Array.isArray(p.contacts) ? p.contacts : []);
      setAddress(p.location ?? '');
      setAge(String(p.age ?? ''));
      setBloodType(p.bloodType ?? '');
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const getAutomaticLocation = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Vui lòng cho phép truy cập vị trí để sử dụng tính năng này.');
        setLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverse.length > 0) {
        const item = reverse[0];
        const addr = `${item.name ? item.name + ', ' : ''}${item.street ? item.street + ', ' : ''}${item.district ? item.district + ', ' : ''}${item.city || item.region || ''}`;
        setAddress(addr);
        Alert.alert('📍 Đã định vị', `Vị trí hiện tại: ${addr}`);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí tự động.');
    }
    setLocating(false);
  };

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số điện thoại');
      return;
    }
    setContacts((prev) => [...prev, { name: newName.trim(), phone: newPhone.trim(), relation: newRelation.trim() || 'Người thân' }]);
    setNewName(''); setNewPhone(''); setNewRelation('');
  };

  const removeContact = (idx: number) => {
    Alert.alert('Xác nhận', 'Xoá liên hệ này?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => setContacts((prev) => prev.filter((_, i) => i !== idx)) },
    ]);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // 1. Save core profile info
      await updateHealthProfile(token, {
        name: profile?.name ?? myName,
        age: parseInt(age) || 0,
        location: address,
        bloodType: bloodType,
        conditions: profile?.conditions || [],
      });

      // 2. Save contacts
      await updateContacts(token, contacts);
      
      Alert.alert('✅ Thành công', 'Hồ sơ sức khỏe và địa chỉ đã được cập nhật.');
      loadData();
    } catch (_) {
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  const profileRows = [
    { icon: 'person-circle', label: 'Họ tên', value: profile?.name ?? myName },
    { icon: 'water',         label: 'Nhóm máu', value: profile?.bloodType ?? 'Chưa rõ' },
    { icon: 'calendar',      label: 'Tuổi', value: profile?.age ? `${profile.age} tuổi` : 'N/A' },
    { icon: 'location',      label: 'Địa điểm', value: profile?.location ?? 'Chưa xác định' },
    { icon: 'medkit',        label: 'Bệnh nền', value: Array.isArray(profile?.conditions) && profile.conditions.length ? profile.conditions.join(', ') : 'Không có' },
    { icon: 'time',          label: 'Sự cố gần nhất', value: profile?.lastIncident ?? 'Chưa có' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
    >
      <AppHeader title="Hồ Sơ Sức Khỏe" />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient colors={[COLORS.primary, COLORS.gradient2]} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color={COLORS.primary} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{profile?.name ?? myName}</Text>
            <Text style={styles.heroSub}>Bệnh nhân • Mã BN: CAS-{String(profile?.id ?? '001').slice(-4).toUpperCase()}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Info Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Thông tin Y Tế</Text>
        <TouchableOpacity><Text style={styles.editLink}>Chỉnh sửa</Text></TouchableOpacity>
      </View>
      <View style={styles.profileGrid}>
        {profileRows.map((row, idx) => (
          <View key={row.label} style={[styles.profileCard, { borderBottomWidth: idx === profileRows.length - 1 ? 0 : 1 }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.cardIconBox, { backgroundColor: COLORS.primary + '11' }]}>
                <Ionicons name={row.icon as any} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.cardLabel}>{row.label}</Text>
            </View>
            <Text style={styles.cardValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Health Info Form */}
      <View style={styles.addSection}>
        <Text style={styles.addTitle}>Cập nhật thông tin Y Tế</Text>
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tuổi" value={age} onChangeText={setAge} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nhóm máu" value={bloodType} onChangeText={setBloodType} />
          </View>
          
          <View style={styles.addressContainer}>
            <TextInput 
              style={[styles.input, { flex: 1 }]} 
              placeholder="Địa chỉ cư trú / Lắp đặt *" 
              value={address} 
              onChangeText={setAddress}
              multiline
            />
            <TouchableOpacity style={styles.locationBtn} onPress={getAutomaticLocation} disabled={locating}>
              {locating ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
                <Ionicons name="location" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>Sử dụng nút định vị để lấy địa chỉ tự động dựa trên GPS.</Text>
        </View>
      </View>

      {/* Contacts Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh bạ khẩn cấp</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{contacts.length}</Text></View>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={32} color={COLORS.textDim} />
          <Text style={styles.emptyText}>Chưa có liên hệ khẩn cấp nào</Text>
        </View>
      ) : (
        contacts.map((c, i) => (
          <View key={i} style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: COLORS.success + '11' }]}>
              <Ionicons name="call" size={18} color={COLORS.success} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactPhone}>{c.phone}</Text>
              <Text style={styles.contactRelation}>{c.relation}</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeContact(i)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Add New */}
      <View style={styles.addSection}>
        <Text style={styles.addTitle}>Thêm liên hệ mới</Text>
        <View style={styles.inputGroup}>
          <TextInput style={styles.input} placeholder="Họ tên *" placeholderTextColor={COLORS.textDim} value={newName} onChangeText={setNewName} />
          <TextInput style={styles.input} placeholder="Số điện thoại *" placeholderTextColor={COLORS.textDim} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Quan hệ (VD: Con, Vợ...)" placeholderTextColor={COLORS.textDim} value={newRelation} onChangeText={setNewRelation} />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addContact}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Thêm vào danh sách</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveProfile} disabled={saving}>
          <LinearGradient colors={[COLORS.primary, COLORS.gradient2]} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {saving ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất?', [{ text: 'Huỷ', style: 'cancel' }, { text: 'Đăng xuất', style: 'destructive', onPress: logout }])}>
          <Text style={styles.logoutText}>Đăng xuất khỏi tài khoản</Text>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  content:     { paddingBottom: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, gap: 14 },
  loadingText: { color: COLORS.textMuted, fontSize: 15 },

  loadingText: { color: COLORS.textMuted, fontSize: 15 },

  heroSection: { padding: 20 },
  heroGradient: {
    padding: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  heroText: { marginLeft: 20 },
  heroName: { fontSize: 20, fontWeight: '900', color: 'white' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', flex: 1 },
  editLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  badge: { backgroundColor: COLORS.primary + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },

  profileGrid: { backgroundColor: 'white', borderRadius: 24, marginHorizontal: 20, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  profileCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderBottomColor: '#f8fafc' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  cardValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'white', borderRadius: 24, padding: 16,
    marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9',
  },
  contactIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  contactPhone: { fontSize: 13, color: COLORS.primary, marginTop: 2, fontWeight: '700' },
  contactRelation: { fontSize: 11, color: COLORS.textDim, marginTop: 2, fontWeight: '600' },
  deleteBtn: { padding: 8 },

  emptyBox: { padding: 32, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, marginHorizontal: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  emptyText: { color: COLORS.textDim, fontSize: 14, marginTop: 10, fontWeight: '600' },

  addSection: { backgroundColor: '#f8fafc', borderRadius: 24, margin: 20, padding: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  addTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  inputGroup: { gap: 12 },
  inputRow: { flexDirection: 'row', gap: 12 },
  addressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 12, alignItems: 'center', justifyContent: 'center' },
  inputHint: { fontSize: 12, color: '#94a3b8', lineHeight: 18, marginTop: 4 },
  input: { backgroundColor: 'white', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b', fontSize: 14, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 10 },
  addButtonText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },

  actionSection: { padding: 20, gap: 16 },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 },
  logoutText: { color: COLORS.danger, fontWeight: '800', fontSize: 14 },
});
