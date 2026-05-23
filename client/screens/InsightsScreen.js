// screens/InsightsScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, CAT_COLORS } from '../theme';
import data from '../data.json';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const BAR_HEIGHTS = [38, 62, 47, 71, 85, 54]; // % heights

const AI_CHIPS = [
  'Where did I overspend?',
  'How to save more this month?',
  'Cancel unused subscriptions',
];

const AI_ANSWERS = {
  'Where did I overspend?':
    'Your top overspend is Shopping (+$200 vs budget). Dining is also 18% over. Consider reducing coffee runs — that alone saves ~$140/mo.',
  'How to save more this month?':
    'You can save an extra $320 this month by pausing CloudStream ($25), reducing dining by 20%, and switching to a cheaper gym plan.',
  'Cancel unused subscriptions':
    'I found 2 unused subscriptions: CloudStream ($24.99/mo) and MusicPro ($9.99/mo). Canceling both saves $35/mo.',
};

export default function InsightsScreen({ theme, monthlySpent, categorySpent, aiDismissed, onAiDismiss }) {
  const [chatInput, setChatInput]     = useState('');
  const [messages, setMessages]       = useState([]);
  const [thinking, setThinking]       = useState(false);

  const totalBudget = 5500;
  const budgetPct   = Math.min((monthlySpent / totalBudget) * 100, 100);
  const score       = Math.max(20, Math.min(100, 95 - Math.floor((monthlySpent / totalBudget) * 22)));

  const scoreColor  = score >= 80 ? theme.success : score >= 60 ? theme.primary : score >= 40 ? theme.warning : theme.danger;
  const scoreLabel  = score >= 80 ? 'Excellent' : score >= 60 ? 'Healthy' : score >= 40 ? 'Caution' : 'Critical';

  const sendChat = (text) => {
    if (!text.trim()) return;
    const q = text.trim();
    const userMsg  = { id: Date.now(), text: q, sender: 'user' };
    const updated  = [...messages, userMsg];
    setMessages(updated);
    setChatInput('');
    setThinking(true);

    setTimeout(() => {
      const aiText =
        AI_ANSWERS[q] ||
        `I analyzed your ${data.transactions.length} transactions. Your total monthly expense is $${monthlySpent.toFixed(2)}. Top category: ${Object.entries(categorySpent).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Food'}.`;
      setMessages([...updated, { id: Date.now() + 1, text: aiText, sender: 'ai' }]);
      setThinking(false);
    }, 900);
  };

  const cats = Object.keys(data.categories).filter((k) => k !== 'income');

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[ss.scroll, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── GREETING ── */}
      <Text style={[ss.greeting, { color: theme.primary }]}>A-Insight</Text>
      <Text style={[ss.greetingSub, { color: theme.textSub }]}>
        You're <Text style={{ color: theme.success, fontWeight: '700' }}>12% under budget</Text> — great job this week.
      </Text>

      {/* ── TOTAL SPENDING CHART ── */}
      <View style={[ss.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={ss.cardHead}>
          <View>
            <Text style={[ss.eyebrow, { color: theme.textMuted }]}>MONTHLY SPENDING</Text>
            <Text style={[ss.cardBigVal, { color: theme.text }]}>
              ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[ss.badge, { backgroundColor: theme.warningSoft }]}>
            <Ionicons name="trending-up" size={10} color={theme.warning} />
            <Text style={[ss.badgeText, { color: theme.warning }]}> +12%</Text>
          </View>
        </View>

        {/* Bar chart */}
        <View style={ss.barChart}>
          {MONTHS.map((m, i) => {
            const active = i === 4; // May
            return (
              <View key={m} style={ss.barCol}>
                <View style={ss.barTrack}>
                  {active ? (
                    <LinearGradient
                      colors={[theme.primary, theme.accent]}
                      style={[ss.barFill, { height: `${BAR_HEIGHTS[i]}%` }]}
                    />
                  ) : (
                    <View style={[ss.barFill, { height: `${BAR_HEIGHTS[i]}%`, backgroundColor: theme.surfaceAlt }]} />
                  )}
                </View>
                <Text style={[ss.barLabel, { color: active ? theme.primary : theme.textMuted, fontWeight: active ? '800' : '500' }]}>
                  {m}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── HEALTH SCORE ── */}
      <View style={[ss.card, ss.scoreCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[ss.eyebrow, { color: theme.textMuted, textAlign: 'center' }]}>FINANCIAL HEALTH</Text>
        <View style={[ss.gauge, { borderColor: scoreColor }]}>
          <Text style={[ss.gaugeNum, { color: theme.text }]}>{score}</Text>
          <Text style={[ss.gaugeMax, { color: theme.textMuted }]}>/ 100</Text>
        </View>
        <Text style={[ss.gaugeLabel, { color: scoreColor }]}>{scoreLabel}</Text>
        <Text style={[ss.gaugeSub, { color: theme.textSub }]}>
          {score >= 80
            ? "You're saving 24% more than average. Keep it up!"
            : score >= 60
            ? 'Good progress. Watch your dining expenses closely.'
            : 'Spending is above limits. Reduce discretionary costs.'}
        </Text>
        <View style={[ss.gaugeBar, { backgroundColor: theme.surfaceAlt }]}>
          <View style={[ss.gaugeBarFill, { width: `${score}%`, backgroundColor: scoreColor }]} />
        </View>
      </View>

      {/* ── CATEGORY BREAKDOWN ── */}
      <View style={[ss.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[ss.cardTitle, { color: theme.text }]}>By Category</Text>
        {cats.map((key) => {
          const meta   = data.categories[key];
          const spent  = categorySpent[key] || 0;
          const ratio  = meta.budget > 0 ? Math.min(spent / meta.budget, 1) : 0;
          const over   = spent > meta.budget;
          return (
            <View key={key} style={ss.catRow}>
              <View style={ss.catRowTop}>
                <View style={ss.catLeft}>
                  <View style={[ss.catDot, { backgroundColor: meta.color + '22' }]}>
                    <Ionicons name={meta.icon} size={12} color={meta.color} />
                  </View>
                  <Text style={[ss.catName, { color: theme.text }]}>{meta.name}</Text>
                  {over && (
                    <View style={[ss.overTag, { backgroundColor: theme.dangerSoft }]}>
                      <Text style={[ss.overTagText, { color: theme.danger }]}>Over</Text>
                    </View>
                  )}
                </View>
                <Text style={[ss.catAmt, { color: theme.text }]}>
                  <Text style={{ fontWeight: '800' }}>${spent.toLocaleString()}</Text>
                  <Text style={{ color: theme.textMuted, fontWeight: '400' }}> / ${meta.budget.toLocaleString()}</Text>
                </Text>
              </View>
              <View style={[ss.progTrack, { backgroundColor: theme.surfaceAlt }]}>
                <View
                  style={[
                    ss.progFill,
                    { width: `${ratio * 100}%`, backgroundColor: over ? theme.danger : meta.color },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* ── AI FORECAST CARD ── */}
      <LinearGradient colors={GRADIENTS.ai} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ss.forecastCard}>
        <View style={ss.forecastTop}>
          <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={ss.forecastEyebrow}>  AI FORECAST</Text>
        </View>
        <Text style={ss.forecastText}>
          At your current pace, you'll finish May with{' '}
          <Text style={{ fontWeight: '800' }}>$1,450 left</Text>. Cut dining by 15% to unlock an extra $280 in savings.
        </Text>
        <TouchableOpacity style={ss.forecastBtn}>
          <Text style={ss.forecastBtnText}>View Optimization Plan</Text>
          <Ionicons name="arrow-forward" size={12} color={theme.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── AI DIAGNOSTIC ALERT ── */}
      {!aiDismissed && (
        <View style={[ss.alertCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={ss.alertHead}>
            <View style={[ss.alertIcon, { backgroundColor: theme.primaryGlow }]}>
              <Ionicons name="bulb-outline" size={14} color={theme.primary} />
            </View>
            <View style={[ss.badge, { backgroundColor: theme.primarySoft }]}>
              <Text style={[ss.badgeText, { color: theme.primary }]}>AI Suggestion</Text>
            </View>
          </View>
          <Text style={[ss.alertTitle, { color: theme.text }]}>Unused Subscription</Text>
          <Text style={[ss.alertBody, { color: theme.textSub }]}>
            "CloudStream" ($24.99/mo) hasn't been accessed in 3 months. Cancel it to save ~$300/year.
          </Text>
          <View style={ss.alertActions}>
            <TouchableOpacity style={[ss.alertBtnPrimary, { backgroundColor: theme.primary }]} onPress={onAiDismiss}>
              <Text style={ss.alertBtnPrimaryText}>Cancel Subscription</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ss.alertBtnGhost, { borderColor: theme.border }]} onPress={onAiDismiss}>
              <Text style={[ss.alertBtnGhostText, { color: theme.textSub }]}>Keep It</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── AI CHAT ── */}
      <Text style={[ss.cardTitle, { color: theme.text, marginBottom: 12 }]}>Ask A-Insight</Text>
      <View style={[ss.chatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={ss.chatMessages}>
          {messages.length === 0 && !thinking && (
            <Text style={[ss.chatPlaceholder, { color: theme.textMuted }]}>
              Ask me anything about your spending habits...
            </Text>
          )}
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                ss.bubble,
                m.sender === 'user'
                  ? [ss.bubbleUser, { backgroundColor: theme.primary }]
                  : [ss.bubbleAi, { backgroundColor: theme.surfaceAlt }],
              ]}
            >
              <Text style={[ss.bubbleText, m.sender === 'user' ? { color: '#fff' } : { color: theme.text }]}>
                {m.text}
              </Text>
            </View>
          ))}
          {thinking && (
            <View style={[ss.bubble, ss.bubbleAi, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[ss.bubbleText, { color: theme.textMuted }]}>Analyzing your data…</Text>
            </View>
          )}
        </View>

        {/* Suggestion chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={ss.chips}>
            {AI_CHIPS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[ss.chip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                onPress={() => sendChat(c)}
              >
                <Text style={[ss.chipText, { color: theme.textSub }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Input bar */}
        <View style={[ss.chatInput, { backgroundColor: theme.surfaceAlt }]}>
          <TextInput
            style={[ss.chatTextField, { color: theme.text }]}
            placeholder="Ask something…"
            placeholderTextColor={theme.textMuted}
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={() => sendChat(chatInput)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[ss.sendBtn, { backgroundColor: theme.primary }]}
            onPress={() => sendChat(chatInput)}
          >
            <Ionicons name="arrow-up" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  greeting: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  greetingSub: { fontSize: 13, lineHeight: 19, marginBottom: 20 },

  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  cardBigVal: { fontSize: 24, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '700' },

  barChart: { flexDirection: 'row', height: 90, alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { width: '100%', height: 75, justifyContent: 'flex-end', borderRadius: 8, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 9, marginTop: 6 },

  scoreCard: { alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  gauge: { width: 96, height: 96, borderRadius: 48, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginVertical: 14 },
  gaugeNum: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  gaugeMax: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  gaugeLabel: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  gaugeSub: { fontSize: 11, textAlign: 'center', lineHeight: 16, paddingHorizontal: 20, marginBottom: 16 },
  gaugeBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  gaugeBarFill: { height: '100%', borderRadius: 3 },

  catRow: { marginBottom: 14 },
  catRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: { width: 24, height: 24, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 12, fontWeight: '700' },
  overTag: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 },
  overTagText: { fontSize: 7, fontWeight: '800' },
  catAmt: { fontSize: 11 },
  progTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },

  forecastCard: { borderRadius: 22, padding: 20, marginBottom: 16 },
  forecastTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  forecastEyebrow: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  forecastText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19, marginBottom: 14 },
  forecastBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  forecastBtnText: { fontSize: 11, fontWeight: '700', color: '#5B5FEF' },

  alertCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  alertIcon: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  alertBody: { fontSize: 12, lineHeight: 17, marginBottom: 14 },
  alertActions: { flexDirection: 'row', gap: 10 },
  alertBtnPrimary: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  alertBtnPrimaryText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  alertBtnGhost: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  alertBtnGhostText: { fontSize: 11, fontWeight: '700' },

  chatCard: { borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: 16 },
  chatMessages: { minHeight: 80, marginBottom: 10 },
  chatPlaceholder: { textAlign: 'center', fontSize: 11, lineHeight: 17, marginVertical: 16 },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, maxWidth: '85%', marginBottom: 8 },
  bubbleUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAi: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 12, lineHeight: 17 },
  chips: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 10, fontWeight: '600' },
  chatInput: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  chatTextField: { flex: 1, fontSize: 13, paddingVertical: 6 },
  sendBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
});
