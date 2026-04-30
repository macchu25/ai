import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';

interface Camera {
  id?: string;
  _id?: string;
  name: string;
  rtsp_url: string;
  status: 'online' | 'offline';
}

interface CameraCardProps {
  item: Camera;
  hasAlert: boolean;
  onDelete: (id: string) => void;
  onClearAlert: (id: string) => void;
}

const CameraCard: React.FC<CameraCardProps> = ({ item, hasAlert, onDelete, onClearAlert }) => {
  const camId = item.id ?? item._id ?? '';
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
        <TouchableOpacity style={styles.deleteIconBtn} onPress={() => onDelete(camId)}>
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
            <TouchableOpacity style={styles.clearBtn} onPress={() => onClearAlert(camId)}>
              <Text style={styles.clearBtnText}>Xoá cảnh báo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  cardInfo: { padding: 14 },
  camName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  camRtsp: { fontSize: 12, color: COLORS.textDim, marginTop: 4 },
  hlsLabel: { fontSize: 11, color: COLORS.primary + 'aa', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  clearBtn: { backgroundColor: COLORS.danger + '22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  clearBtnText: { color: COLORS.danger, fontSize: 11, fontWeight: '700' },
});

export default CameraCard;
