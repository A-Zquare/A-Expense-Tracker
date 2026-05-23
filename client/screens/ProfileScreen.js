// screens/ProfileScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../theme';

const SETTING_GROUPS = [
  {
    title: 'Preferences',
    rows: [
      { id: 'darkMode',       icon: 'moon-outline',          label: 'Dark Mode',          sub: 'Switch to dark interface',           iconBg: '#1E293B', toggle: true },
      { id: 'notifications',  icon: 'notifications-outline',  label: 'Smart Alerts',       sub: 'AI-powered spending alerts',         iconBg: '#5B5FEF', toggle: true },
      { id: 'faceId',         icon: 'finger-print-outline',  label: 'Biometric Auth',     sub: 'Face ID / Fingerprint login',        iconBg: '#0DBF8A', toggle: true },
    ],
  },
  {
    title: 'Account',
    rows: [
      { id: 'banks',     icon: 'business-outline',   label: 'Connected Banks',   sub: '2 accounts synced',         iconBg: '#7C6FF7', nav: true },
      { id: 'budget',    icon: 'pie-chart-outline',  label: 'Monthly Budget',    sub: '$5,000 / month limit',      iconBg: '#EC4899', nav: true },
      { id: 'currency',  icon: 'globe-outline',      label: 'Currency',          sub: 'United States Dollar (USD)',iconBg: '#14B8A6', nav: true },
      { id: 'export',    icon: 'download-outline',   label: 'Export Data',       sub: 'CSV / PDF statement',       iconBg: '#F59E0B', nav: true },
    ],
  },
  {
    title: 'Support',
    rows: [
      { id: 'privacy',  icon: 'lock-closed-outline', label: 'Privacy Policy',   sub: 'How we protect your data',  iconBg: '#6366F1', nav: true },
      { id: 'terms',    icon: 'document-outline',    label: 'Terms of Service', sub: 'Usage terms & conditions',  iconBg: '#64748B', nav: true },
      { id: 'help',     icon: 'help-circle-outline', label: 'Help & Support',   sub: '24/7 AI chat support',      iconBg: '#0EA5E9', nav: true },
    ],
  },
];

export default function ProfileScreen({
  theme, isDarkMode, notificationsOn, faceIdOn,
  onToggleDark, onToggleNotifications, onToggleFaceId, onLogout, onNavToast,
}) {
  const toggleMap = {
    darkMode:       { value: isDarkMode,        handler: onToggleDark },
    notifications:  { value: notificationsOn,   handler: onToggleNotifications },
    faceId:         { value: faceIdOn,          handler: onToggleFaceId },
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[ss.scroll, { paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── USER CARD ── */}
      <LinearGradient
        colors={GRADIENTS.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ss.userCard}
      >
        {/* Decorative glow */}
        <View style={ss.glowA} />
        <View style={ss.avatarWrap}>
          <View style={ss.avatar}>
            <Text style={ss.avatarText}>AM</Text>
          </View>
          <TouchableOpacity style={ss.editBadge}>
            <Ionicons name="camera" size={11} color="#5B5FEF" />
          </TouchableOpacity>
        </View>
        <Text style={ss.userName}>Alex Mercer</Text>
        <Text style={ss.userEmail}>alex.mercer@a-expense.com</Text>

        <View style={ss.badgeRow}>
          <View style={ss.proBadge}>
            <Ionicons name="diamond-outline" size={10} color="#5B5FEF" style={{ marginRight: 4 }} />
            <Text style={ss.proBadgeText}>PRO Member</Text>
          </View>
          <View style={ss.streakBadge}>
            <Ionicons name="flame" size={10} color="#F59E0B" style={{ marginRight: 4 }} />
            <Text style={ss.streakBadgeText}>14 Day Streak</Text>
          </View>
        </View>

        {/* Mini stats */}
        <View style={ss.miniStats}>
          <View style={ss.miniStat}>
            <Text style={ss.miniStatVal}>$48.2K</Text>
            <Text style={ss.miniStatLabel}>Tracked Total</Text>
          </View>
          <View style={ss.miniStatDivider} />
          <View style={ss.miniStat}>
            <Text style={ss.miniStatVal}>127</Text>
            <Text style={ss.miniStatLabel}>Transactions</Text>
          </View>
          <View style={ss.miniStatDivider} />
          <View style={ss.miniStat}>
            <Text style={ss.miniStatVal}>$6.4K</Text>
            <Text style={ss.miniStatLabel}>Total Saved</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── SETTINGS GROUPS ── */}
      {SETTING_GROUPS.map((group) => (
        <View key={group.title} style={ss.group}>
          <Text style={[ss.groupTitle, { color: theme.textMuted }]}>{group.title.toUpperCase()}</Text>
          <View style={[ss.groupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {group.rows.map((row, idx) => {
              const isLast   = idx === group.rows.length - 1;
              const toggleCfg = row.toggle ? toggleMap[row.id] : null;

              return (
                <TouchableOpacity
                  key={row.id}
                  style={[ss.settingRow, !isLast && [ss.settingRowBorder, { borderColor: theme.border }]]}
                  onPress={() => {
                    if (row.nav) onNavToast(row.label);
                  }}
                  activeOpacity={row.nav ? 0.6 : 1}
                >
                  <View style={[ss.settingIcon, { backgroundColor: row.iconBg }]}>
                    <Ionicons name={row.icon} size={14} color="#fff" />
                  </View>
                  <View style={ss.settingMid}>
                    <Text style={[ss.settingLabel, { color: theme.text }]}>{row.label}</Text>
                    <Text style={[ss.settingSub, { color: theme.textMuted }]}>{row.sub}</Text>
                  </View>
                  {toggleCfg ? (
                    <Switch
                      value={toggleCfg.value}
                      onValueChange={toggleCfg.handler}
                      trackColor={{ false: theme.border, true: theme.success }}
                      thumbColor="#fff"
                      ios_backgroundColor={theme.border}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={15} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* ── LOGOUT ── */}
      <TouchableOpacity
        style={[ss.logoutBtn, { backgroundColor: theme.surface, borderColor: theme.dangerSoft }]}
        onPress={onLogout}
        activeOpacity={0.75}
      >
        <View style={[ss.settingIcon, { backgroundColor: theme.dangerSoft }]}>
          <Ionicons name="log-out-outline" size={14} color={theme.danger} />
        </View>
        <Text style={[ss.logoutText, { color: theme.danger }]}>Log Out</Text>
        <Ionicons name="chevron-forward" size={15} color={theme.danger} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* ── VERSION ── */}
      <Text style={[ss.version, { color: theme.textMuted }]}>A-Expense v2.0.0 · Production Build</Text>
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  userCard: {
    borderRadius: 24, padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -60,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  userName: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  userEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 14 },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: '#5B5FEF' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  streakBadgeText: { fontSize: 9, fontWeight: '800', color: '#D97706' },

  miniStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 14, width: '100%',
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatVal: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  miniStatLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '600' },
  miniStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  group: { marginBottom: 6 },
  groupTitle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 },
  groupCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  settingRowBorder: { borderBottomWidth: 1 },
  settingIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingMid: { flex: 1 },
  settingLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  settingSub: { fontSize: 10, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 24,
  },
  logoutText: { fontSize: 13, fontWeight: '700', marginLeft: 12 },

  version: { fontSize: 10, textAlign: 'center', marginBottom: 8 },
});
