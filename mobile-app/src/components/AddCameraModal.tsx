import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/config';

interface AddCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  name: string;
  setName: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  adding: boolean;
}

const AddCameraModal: React.FC<AddCameraModalProps> = ({
  visible, onClose, onSave, name, setName, url, setUrl, adding
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm Camera Mới</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Tên Camera</Text>
            <TextInput style={styles.modalInput} placeholder="VD: Phòng khách, Ban công..." value={name} onChangeText={setName} />
            <Text style={styles.inputLabel}>RTSP URL (Luồng video)</Text>
            <TextInput style={styles.modalInput} placeholder="rtsp://admin:password@ip:port/stream" value={url} onChangeText={setUrl} autoCapitalize="none" />
            <Text style={styles.inputHint}>Lưu ý: Camera cần hỗ trợ chuẩn RTSP để AI có thể phân tích.</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={onSave} disabled={adding}>
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
  );
};

const styles = StyleSheet.create({
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

export default AddCameraModal;
