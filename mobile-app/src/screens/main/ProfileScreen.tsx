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
import { fetchHealthProfile, updateContacts, updateHealthProfile } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AppHeader from '../../components/AppHeader';
import ContactCard from '../../components/ContactCard';

export default function ProfileScreen() {
  const token   = useAuthStore((s) => s.user!.token);
  const myName  = useAuthStore((s) => s.user!.name);
  const logout  = useAuthStore((s) => s.logout);

  const [profile, setProfile]     = useState<any>(null);
  const [contacts, setContacts]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating]     = useState(false);

  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [bloodType, setBloodType] = useState('');

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
        Alert.alert('Quyền bị từ chối', 'Vui lòng cho phép truy cập vị trí.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      let reverse = await Location.reverseGeocodeAsync(location.coords);
      if (reverse.length > 0) {
        const item = reverse[0];
        const addr = `${item.name ? item.name + ', ' : ''}${item.street ? item.street + ', ' : ''}${item.district ? item.district + ', ' : ''}${item.city || item.region || ''}`;
        setAddress(addr);
        Alert.alert('📍 Đã định vị', addr);
      }
    } catch (err) { Alert.alert('Lỗi', 'Không thể định vị.'); }
    setLocating(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateHealthProfile(token, {
        name: profile?.name ?? myName,
        age: parseInt(age) || 0,
        location: address,
        bloodType: bloodType,
        conditions: profile?.conditions || [],
      });
      await updateContacts(token, contacts);
      Alert.alert('✅ Thành công', 'Thông tin đã được lưu.');
      loadData();
    } catch (_) { Alert.alert('Lỗi', 'Không thể lưu hồ sơ.'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const profileRows = [
    { icon: 'person-circle', label: 'Họ tên', value: profile?.name ?? myName },
    { icon: 'water',         label: 'Nhóm máu', value: bloodType || 'Chưa rõ' },
    { icon: 'calendar',      label: 'Tuổi', value: age ? `${age} tuổi` : 'N/A' },
    { icon: 'location',      label: 'Địa điểm', value: address || 'Chưa xác định' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
    >
      <AppHeader title="Hồ Sơ Sức Khỏe" />

      <View style={styles.heroSection}>
        <LinearGradient colors={[COLORS.primary, COLORS.gradient2]} style={styles.heroGradient}>
          <View style={styles.avatarCircle}><Ionicons name="person" size={36} color={COLORS.primary} /></View>
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{profile?.name ?? myName}</Text>
            <Text style={styles.heroSub}>Bệnh nhân • Cardiac Alert</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.profileGrid}>
        {profileRows.map((row) => (
          <View key={row.label} style={styles.profileCard}>
            <Text style={styles.cardLabel}>{row.label}</Text>
            <Text style={styles.cardValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.addSection}>
        <Text style={styles.addTitle}>Cập nhật thông tin</Text>
        <TextInput style={styles.input} placeholder="Tuổi" value={age} onChangeText={setAge} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Nhóm máu" value={bloodType} onChangeText={setBloodType} />
        <View style={styles.addressContainer}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Địa chỉ *" value={address} onChangeText={setAddress} multiline />
          <TouchableOpacity style={styles.locationBtn} onPress={getAutomaticLocation} disabled={locating}>
            {locating ? <ActivityIndicator size="small" /> : <Ionicons name="location" size={20} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Danh bạ người thân</Text></View>
      {contacts.map((c, i) => (
        <ContactCard key={i} contact={c} onDelete={() => setContacts(prev => prev.filter((_, idx) => idx !== i))} />
      ))}

      <View style={styles.addSection}>
        <Text style={styles.addTitle}>Thêm liên hệ</Text>
        <TextInput style={styles.input} placeholder="Tên" value={newName} onChangeText={setNewName} />
        <TextInput style={styles.input} placeholder="SĐT" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
        <TouchableOpacity style={styles.addButton} onPress={() => { setContacts([...contacts, { name: newName, phone: newPhone, relation: 'Người thân' }]); setNewName(''); setNewPhone(''); }}>
          <Text style={styles.addButtonText}>Thêm vào danh sách</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
          <LinearGradient colors={[COLORS.primary, COLORS.gradient2]} style={styles.saveBtnGrad}>
            <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}><Text style={styles.logoutText}>Đăng xuất</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroSection: { padding: 20 },
  heroGradient: { padding: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  heroText: { marginLeft: 20 },
  heroName: { fontSize: 20, fontWeight: '900', color: 'white' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  profileGrid: { backgroundColor: 'white', borderRadius: 24, marginHorizontal: 20, padding: 12 },
  profileCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  cardLabel: { fontSize: 14, color: COLORS.textMuted },
  cardValue: { fontSize: 14, fontWeight: '700' },
  addSection: { backgroundColor: '#f8fafc', borderRadius: 24, margin: 20, padding: 24, gap: 12 },
  addTitle: { fontSize: 16, fontWeight: '800' },
  input: { backgroundColor: 'white', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  addressContainer: { flexDirection: 'row', gap: 10 },
  locationBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 12 },
  sectionHeader: { paddingHorizontal: 24, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  addButton: { paddingVertical: 10, alignItems: 'center' },
  addButtonText: { color: COLORS.primary, fontWeight: '800' },
  actionSection: { padding: 20, gap: 16 },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnGrad: { paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800' },
  logoutBtn: { alignItems: 'center', padding: 12 },
  logoutText: { color: COLORS.danger, fontWeight: '800' },
});
