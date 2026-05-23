// screens/HomeScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, SW } from '../theme';
import data from '../data.json';

const QUICK_ACTIONS = [
  { id: 'scan',     icon: 'scan-outline',      label: 'Scan' },
  { id: 'send',     icon: 'arrow-up-circle-outline', label: 'Send' },
  { id: 'request',  icon: 'arrow-down-circle-outline', label: 'Request' },
  { id: 'insights', icon: 'sparkles-outline',  label: 'AI Tips' },
];

// Sparkline data points (percentage heights, 0-100)
const SPARKLINE = [22, 48, 35, 71, 58, 83, 66];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HomeScreen({ theme, transactions, balance, monthlySpent, onTabSwitch, onSelectTx, onScan }) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const savings = (balance * 0.18).toFixed(0);
  const budgetUsed = Math.min(monthlySpent / 5000, 1);

  const handleQuickAction = (id) => {
    if (id === 'scan') return onScan();
    if (id === 'insights') return onTabSwitch('insights');
    if (id === 'send' || id === 'request') return onTabSwitch('add');
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[ss.scroll, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── BALANCE CARD ── */}
      <TouchableOpacity activeOpacity={0.92} style={ss.cardShadow}>
        <LinearGradient
          colors={GRADIENTS.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ss.balanceCard}
        >
          {/* Decorative circles */}
          <View style={ss.circleA} />
          <View style={ss.circleB} />

          <View style={ss.cardTop}>
            <View>
              <Text style={ss.cardEyebrow}>TOTAL BALANCE</Text>
              <Text style={ss.cardBalance}>
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={ss.chipBox}>
              <View style={ss.chip} />
            </View>
          </View>

          {/* Budget progress */}
          <View style={ss.budgetRow}>
            <Text style={ss.budgetLabel}>Monthly budget</Text>
            <Text style={ss.budgetPct}>{Math.round(budgetUsed * 100)}% used</Text>
          </View>
          <View style={ss.budgetTrack}>
            <View style={[ss.budgetFill, { width: `${budgetUsed * 100}%` }]} />
          </View>

          <View style={ss.cardFooter}>
            <Text style={ss.cardNum}>•••• •••• •••• 4820</Text>
            <View>
              <Text style={ss.cardExpLabel}>EXP</Text>
              <Text style={ss.cardExp}>09/29</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── STAT PILLS ── */}
      <View style={ss.statRow}>
        <View style={[ss.statPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[ss.statDot, { backgroundColor: theme.dangerSoft }]}>
            <Ionicons name="arrow-up" size={10} color={theme.danger} />
          </View>
          <View>
            <Text style={[ss.statLabel, { color: theme.textMuted }]}>Spent</Text>
            <Text style={[ss.statVal, { color: theme.text }]}>
              ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={[ss.statPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[ss.statDot, { backgroundColor: theme.successSoft }]}>
            <Ionicons name="arrow-down" size={10} color={theme.success} />
          </View>
          <View>
            <Text style={[ss.statLabel, { color: theme.textMuted }]}>Saved</Text>
            <Text style={[ss.statVal, { color: theme.success }]}>${savings}</Text>
          </View>
        </View>

        <View style={[ss.statPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[ss.statDot, { backgroundColor: theme.primaryGlow }]}>
            <Ionicons name="flash" size={10} color={theme.primary} />
          </View>
          <View>
            <Text style={[ss.statLabel, { color: theme.textMuted }]}>Score</Text>
            <Text style={[ss.statVal, { color: theme.primary }]}>87</Text>
          </View>
        </View>
      </View>

      {/* ── QUICK ACTIONS ── */}
      <Text style={[ss.section, { color: theme.text }]}>Quick Actions</Text>
      <View style={ss.actionsRow}>
        {QUICK_ACTIONS.map((q) => (
          <TouchableOpacity
            key={q.id}
            style={ss.actionItem}
            onPress={() => handleQuickAction(q.id)}
            activeOpacity={0.7}
          >
            <View style={[ss.actionCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name={q.icon} size={21} color={theme.primary} />
            </View>
            <Text style={[ss.actionLabel, { color: theme.textSub }]}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SPENDING SPARKLINE ── */}
      <View style={ss.sectionRow}>
        <Text style={[ss.section, { color: theme.text }]}>This Week</Text>
        <Text style={[ss.sectionLink, { color: theme.primary }]}>Details</Text>
      </View>

      <View style={[ss.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={ss.sparklineWrap}>
          {SPARKLINE.map((h, i) => (
            <View key={i} style={ss.sparkCol}>
              <View style={ss.sparkTrack}>
                <LinearGradient
                  colors={i === 5 ? [theme.primary, theme.accent] : [theme.border, theme.border]}
                  style={[ss.sparkBar, { height: `${h}%` }]}
                />
              </View>
              <Text style={[ss.sparkLabel, { color: theme.textMuted }]}>{DAYS[i]}</Text>
            </View>
          ))}
        </View>
        <View style={ss.chartFooter}>
          <Text style={[ss.chartFooterText, { color: theme.textMuted }]}>
            Peak: <Text style={{ color: theme.primary, fontWeight: '700' }}>Saturday</Text>
          </Text>
          <Text style={[ss.chartFooterText, { color: theme.success }]}>↓ 8% vs last week</Text>
        </View>
      </View>

      {/* ── RECENT ACTIVITY ── */}
      <View style={ss.sectionRow}>
        <Text style={[ss.section, { color: theme.text }]}>Recent Activity</Text>
        <TouchableOpacity onPress={() => onTabSwitch('history')}>
          <Text style={[ss.sectionLink, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {recent.map((tx) => {
        const meta = data.categories[tx.category] || data.categories.food;
        const isIncome = tx.type === 'income';
        return (
          <TouchableOpacity
            key={tx.id}
            style={[ss.txCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => onSelectTx(tx.id)}
            activeOpacity={0.75}
          >
            <View style={[ss.txIcon, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name={meta.icon} size={17} color={meta.color} />
            </View>
            <View style={ss.txMid}>
              <Text style={[ss.txTitle, { color: theme.text }]}>{tx.title}</Text>
              <Text style={[ss.txSub, { color: theme.textMuted }]}>{meta.name} · {tx.time}</Text>
            </View>
            <View style={ss.txRight}>
              <Text style={[ss.txAmt, { color: isIncome ? theme.success : theme.text }]}>
                {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
              {tx.tags?.[0] ? (
                <View style={[ss.tag, { backgroundColor: tx.tags[0] === 'flagged' ? theme.dangerSoft : theme.primarySoft }]}>
                  <Text style={[ss.tagText, { color: tx.tags[0] === 'flagged' ? theme.danger : theme.primary }]}>
                    {tx.tags[0]}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  // Balance Card
  cardShadow: {
    borderRadius: 24,
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 16,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  circleA: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60, right: -60,
  },
  circleB: {
    position: 'absolute', width: 130, height: 130,
    borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30, left: 20,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  cardEyebrow: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2, marginBottom: 6 },
  cardBalance: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  chipBox: { marginTop: 4 },
  chip: { width: 30, height: 22, borderRadius: 5, backgroundColor: '#E5C547', opacity: 0.9 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  budgetPct: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  budgetTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, marginBottom: 20, overflow: 'hidden',
  },
  budgetFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardNum: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 1.5 },
  cardExpLabel: { fontSize: 7, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  cardExp: { fontSize: 11, color: '#fff', fontWeight: '700' },

  // Stats
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 16, borderWidth: 1,
  },
  statDot: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
  statVal: { fontSize: 13, fontWeight: '800' },

  // Quick Actions
  section: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionItem: { alignItems: 'center', width: (SW - 40) / 4 - 6 },
  actionCircle: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, marginBottom: 6,
  },
  actionLabel: { fontSize: 10, fontWeight: '600' },

  // Chart
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLink: { fontSize: 12, fontWeight: '700' },
  chartCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 24,
  },
  sparklineWrap: { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: 6, marginBottom: 12 },
  sparkCol: { flex: 1, alignItems: 'center' },
  sparkTrack: { width: '100%', height: 70, justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden' },
  sparkBar: { width: '100%', borderRadius: 6 },
  sparkLabel: { fontSize: 9, fontWeight: '600', marginTop: 6 },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  chartFooterText: { fontSize: 10, fontWeight: '600' },

  // Transactions
  txCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  txIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txMid: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  txSub: { fontSize: 10, fontWeight: '500' },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmt: { fontSize: 14, fontWeight: '800' },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
});
