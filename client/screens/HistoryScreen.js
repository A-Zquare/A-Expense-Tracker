// screens/HistoryScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import data from '../data.json';

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'expense', label: 'Expenses' },
  { id: 'income',  label: 'Income' },
];

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}
function getYesterdayISO() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
function friendlyDate(dateStr) {
  const today = getTodayISO(), yesterday = getYesterdayISO();
  if (dateStr === today)     return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const [y, m, d] = dateStr.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryScreen({ theme, transactions, onSelectTx }) {
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  const filtered = useMemo(() => {
    return sorted.filter((tx) => {
      if (filter === 'expense' && tx.type !== 'expense') return false;
      if (filter === 'income'  && tx.type !== 'income')  return false;
      if (search.trim()) {
        const kw = search.toLowerCase();
        const meta = data.categories[tx.category];
        return (
          tx.title.toLowerCase().includes(kw) ||
          (tx.notes || '').toLowerCase().includes(kw) ||
          (meta?.name || '').toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [sorted, filter, search]);

  // Group by date label
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((tx) => {
      const label = friendlyDate(tx.date);
      if (!g[label]) g[label] = [];
      g[label].push(tx);
    });
    return g;
  }, [filtered]);

  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome   = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[ss.scroll, { paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── SEARCH BAR ── */}
      <View style={[ss.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[ss.searchInput, { color: theme.text }]}
          placeholder="Search transactions…"
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── FILTER PILLS ── */}
      <View style={ss.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              ss.filterPill,
              filter === f.id
                ? { backgroundColor: theme.primary }
                : { backgroundColor: theme.surfaceAlt },
            ]}
            onPress={() => setFilter(f.id)}
            activeOpacity={0.75}
          >
            <Text style={[ss.filterText, { color: filter === f.id ? '#fff' : theme.textMuted }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[ss.filterPill, ss.filterIcon, { backgroundColor: theme.surfaceAlt }]}
        >
          <Ionicons name="options-outline" size={14} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── SUMMARY BANNER ── */}
      {filtered.length > 0 && (
        <View style={[ss.summaryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={ss.summaryItem}>
            <Text style={[ss.summaryLabel, { color: theme.textMuted }]}>Expenses</Text>
            <Text style={[ss.summaryVal, { color: theme.danger }]}>-${totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={[ss.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={ss.summaryItem}>
            <Text style={[ss.summaryLabel, { color: theme.textMuted }]}>Income</Text>
            <Text style={[ss.summaryVal, { color: theme.success }]}>+${totalIncome.toFixed(2)}</Text>
          </View>
          <View style={[ss.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={ss.summaryItem}>
            <Text style={[ss.summaryLabel, { color: theme.textMuted }]}>Net</Text>
            <Text style={[ss.summaryVal, {
              color: totalIncome - totalExpenses >= 0 ? theme.success : theme.danger,
            }]}>
              {totalIncome - totalExpenses >= 0 ? '+' : ''}${(totalIncome - totalExpenses).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* ── GROUPED TRANSACTION LIST ── */}
      {Object.keys(grouped).length === 0 ? (
        <View style={ss.emptyState}>
          <View style={[ss.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="search" size={28} color={theme.textMuted} />
          </View>
          <Text style={[ss.emptyTitle, { color: theme.text }]}>No results found</Text>
          <Text style={[ss.emptySub, { color: theme.textMuted }]}>
            Try adjusting your filters or search term.
          </Text>
        </View>
      ) : (
        Object.keys(grouped).map((dateLabel) => (
          <View key={dateLabel} style={ss.group}>
            <View style={ss.groupHeader}>
              <Text style={[ss.groupDate, { color: theme.textMuted }]}>{dateLabel}</Text>
              <View style={[ss.groupLine, { backgroundColor: theme.border }]} />
            </View>
            {grouped[dateLabel].map((tx) => {
              const meta    = data.categories[tx.category] || data.categories.food;
              const isIncome = tx.type === 'income';
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[ss.txRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => onSelectTx(tx.id)}
                  activeOpacity={0.72}
                >
                  <View style={[ss.txIcon, { backgroundColor: meta.color + '15' }]}>
                    <Ionicons name={meta.icon} size={17} color={meta.color} />
                  </View>

                  <View style={ss.txMid}>
                    <Text style={[ss.txTitle, { color: theme.text }]} numberOfLines={1}>{tx.title}</Text>
                    <View style={ss.txSubRow}>
                      <Text style={[ss.txSub, { color: theme.textMuted }]}>{meta.name}</Text>
                      <View style={[ss.txDot, { backgroundColor: theme.textMuted }]} />
                      <Text style={[ss.txSub, { color: theme.textMuted }]}>{tx.time}</Text>
                    </View>
                  </View>

                  <View style={ss.txEnd}>
                    <Text style={[ss.txAmt, { color: isIncome ? theme.success : theme.text }]}>
                      {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                    </Text>
                    {tx.tags?.[0] ? (
                      <View style={[
                        ss.tag,
                        { backgroundColor: tx.tags[0] === 'flagged' ? theme.dangerSoft : theme.primarySoft }
                      ]}>
                        <Text style={[ss.tagText, {
                          color: tx.tags[0] === 'flagged' ? theme.danger : theme.primary,
                        }]}>
                          {tx.tags[0]}
                        </Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={12} color={theme.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500' },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterIcon: { width: 34, justifyContent: 'center', alignItems: 'center' },
  filterText: { fontSize: 11, fontWeight: '700' },

  summaryRow: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    padding: 14, marginBottom: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 9, fontWeight: '600', marginBottom: 4 },
  summaryVal: { fontSize: 14, fontWeight: '800' },
  summaryDivider: { width: 1, marginHorizontal: 4 },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 12, textAlign: 'center', paddingHorizontal: 30 },

  group: { marginBottom: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 6 },
  groupDate: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  groupLine: { flex: 1, height: 1 },

  txRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, padding: 13, marginBottom: 8,
  },
  txIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txMid: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  txSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  txSub: { fontSize: 10, fontWeight: '500' },
  txDot: { width: 3, height: 3, borderRadius: 2 },
  txEnd: { alignItems: 'flex-end', gap: 5 },
  txAmt: { fontSize: 14, fontWeight: '800' },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 7, fontWeight: '800', textTransform: 'uppercase' },
});
