import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';

interface Contact {
  name: string;
  phone: string;
  relation: string;
}

interface ContactCardProps {
  contact: Contact;
  onDelete: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onDelete }) => {
  return (
    <View style={styles.contactCard}>
      <View style={[styles.contactIcon, { backgroundColor: COLORS.success + '11' }]}>
        <Ionicons name="call" size={18} color={COLORS.success} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
        <Text style={styles.contactRelation}>{contact.relation}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default ContactCard;
