// screens/AddScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, SW } from '../theme';
import data from '../data.json';

const KEYPAD = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['.','0','⌫'],
];

const PAYMENT_METHODS = [
  { id: 'card',   icon: 'card-outline',        label: 'Debit Card' },
  { id: 'bank',   icon: 'business-outline',     label: 'Bank Transfer' },
  { id: 'cash',   icon: 'cash-outline',         label: 'Cash' },
  { id: 'wallet', icon: 'wallet-outline',       label: 'A-Wallet' },
];

export default function AddScreen({
  theme,
  padAmount, padCategory, padType, padNotes, padPayment,
  onKeyPress, onCategorySelect, onTypeChange, onNotesChange, onPaymentChange, onSave,
}) {
  const cats = Object.keys(data.categories).filter((k) => {
    if (padType === 'income') return k === 'income';
    return k !== 'income';
  });

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[ss.scroll, { paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── TYPE TOGGLE ── */}
      <View style={ss.typeToggleWrap}>
        <View style={[ss.typeToggle, { backgroundColor: theme.surfaceAlt }]}>
          {['expense', 'income'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[ss.typeBtn, padType === t && [ss.typeBtnActive, { backgroundColor: theme.surface }]]}
              onPress={() => onTypeChange(t)}
              activeOpacity={0.8}
            >
              <Text style={[ss.typeBtnText, { color: padType === t ? theme.text : theme.textMuted }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── AMOUNT DISPLAY ── */}
      <View style={ss.amountSection}>
        <Text style={[ss.amountCurrency, { color: theme.textMuted }]}>USD</Text>
        <View style={ss.amountRow}>
          <Text style={[ss.amountSymbol, { color: theme.textSub }]}>$</Text>
          <Text style={[ss.amountText, { color: theme.text }]}>
            {padAmount === '0' ? '0' : padAmount}
          </Text>
          <View style={[ss.amountCursor, { backgroundColor: theme.primary }]} />
        </View>
        <Text style={[ss.amountHint, { color: theme.textMuted }]}>
          {padType === 'expense' ? 'How much did you spend?' : 'How much did you receive?'}
        </Text>
      </View>

      {/* ── CATEGORY SCROLL ── */}
      <Text style={[ss.fieldLabel, { color: theme.textMuted }]}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ss.catScroll}>
        <View style={ss.catRow}>
          {cats.map((key) => {
            const meta   = data.categories[key];
            const active = padCategory === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  ss.catPill,
                  { backgroundColor: active ? meta.color + '18' : theme.surfaceAlt, borderColor: active ? meta.color : 'transparent' },
                ]}
                onPress={() => onCategorySelect(key)}
                activeOpacity={0.7}
              >
                <Ionicons name={meta.icon} size={13} color={active ? meta.color : theme.textSub} style={{ marginRight: 5 }} />
                <Text style={[ss.catPillText, { color: active ? meta.color : theme.textSub }]}>
                  {meta.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── NOTES FIELD ── */}
      <Text style={[ss.fieldLabel, { color: theme.textMuted }]}>NOTES</Text>
      <View style={[ss.inputBox, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name="create-outline" size={15} color={theme.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={[ss.inputText, { color: theme.text }]}
          placeholder="e.g. Starbucks morning coffee..."
          placeholderTextColor={theme.textMuted}
          value={padNotes}
          onChangeText={onNotesChange}
          returnKeyType="done"
        />
      </View>

      {/* ── PAYMENT METHOD ── */}
      <Text style={[ss.fieldLabel, { color: theme.textMuted }]}>PAYMENT METHOD</Text>
      <View style={ss.paymentGrid}>
        {PAYMENT_METHODS.map((pm) => {
          const active = padPayment === pm.id;
          return (
            <TouchableOpacity
              key={pm.id}
              style={[
                ss.paymentCard,
                {
                  backgroundColor: active ? theme.primarySoft : theme.surfaceAlt,
                  borderColor: active ? theme.primary : 'transparent',
                },
              ]}
              onPress={() => onPaymentChange(pm.id)}
              activeOpacity={0.75}
            >
              <Ionicons name={pm.icon} size={18} color={active ? theme.primary : theme.textMuted} />
              <Text style={[ss.paymentLabel, { color: active ? theme.primary : theme.textSub }]}>
                {pm.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── DIGITAL KEYPAD ── */}
      <View style={[ss.keypad, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {KEYPAD.map((row, ri) => (
          <View key={ri} style={ss.keyRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[ss.key, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => onKeyPress(key)}
                activeOpacity={0.6}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={20} color={theme.textSub} />
                ) : (
                  <Text style={[ss.keyText, { color: theme.text }]}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* ── SAVE BUTTON ── */}
      <TouchableOpacity style={ss.saveWrap} onPress={onSave} activeOpacity={0.85}>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={ss.saveBtn}
        >
          <Text style={ss.saveBtnText}>Save {padType === 'income' ? 'Income' : 'Expense'}</Text>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  typeToggleWrap: { alignItems: 'center', marginBottom: 24 },
  typeToggle: { flexDirection: 'row', borderRadius: 20, padding: 4, width: 200 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  typeBtnActive: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  typeBtnText: { fontSize: 12, fontWeight: '700' },

  amountSection: { alignItems: 'center', marginBottom: 28 },
  amountCurrency: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  amountSymbol: { fontSize: 28, fontWeight: '300' },
  amountText: { fontSize: 52, fontWeight: '800', letterSpacing: -2, minWidth: 60 },
  amountCursor: { width: 3, height: 42, borderRadius: 2, marginLeft: 2, opacity: 0.8 },
  amountHint: { fontSize: 11, marginTop: 8 },

  fieldLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  catScroll: { marginBottom: 20 },
  catRow: { flexDirection: 'row', gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  catPillText: { fontSize: 11, fontWeight: '600' },

  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  inputText: { flex: 1, fontSize: 13, fontWeight: '500' },

  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  paymentCard: {
    width: (SW - 50) / 2,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 14, borderWidth: 1.5,
  },
  paymentLabel: { fontSize: 11, fontWeight: '600' },

  keypad: {
    borderRadius: 22, borderWidth: 1, padding: 12,
    gap: 8, marginBottom: 20,
  },
  keyRow: { flexDirection: 'row', gap: 8 },
  key: {
    flex: 1, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  keyText: { fontSize: 20, fontWeight: '600' },

  saveWrap: {
    borderRadius: 18,
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  saveBtn: { borderRadius: 18, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
