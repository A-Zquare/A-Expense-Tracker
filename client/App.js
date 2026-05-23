import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import external JSON dummy data
import dummyData from './data.json';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ----------------------------------------------------
// THEME COLORS (Light vs Dark Mode)
// ----------------------------------------------------
const LightTheme = {
  bgApp: '#f8fafc',
  bgCard: '#ffffff',
  bgCardHover: '#f1f5f9',
  bgInput: '#e2e8f0',
  border: 'rgba(226, 232, 240, 0.8)',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#e0e7ff',
  accent: '#8b5cf6',
  accentGlow: 'rgba(139, 92, 246, 0.08)',
  success: '#10b981',
  successLight: '#d1fae5',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  statusBar: 'dark-content',
};

const DarkTheme = {
  bgApp: '#090a0f',
  bgCard: '#13151e',
  bgCardHover: '#1c1e2b',
  bgInput: '#1b1e2e',
  border: 'rgba(255, 255, 255, 0.06)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#818cf8',
  primaryDark: '#6366f1',
  primaryLight: '#23273a',
  accent: '#a78bfa',
  accentGlow: 'rgba(167, 139, 250, 0.08)',
  success: '#34d399',
  successLight: '#064e3b',
  danger: '#f87171',
  dangerLight: '#7f1d1d',
  warning: '#fbbf24',
  warningLight: '#78350f',
  statusBar: 'light-content',
};

// ----------------------------------------------------
// APPLICATION COMPONENT
// ----------------------------------------------------
export default function App() {
  // --- STATE SYSTEM ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, insights, add, history, profile
  const [transactions, setTransactions] = useState(dummyData.transactions);
  const [notifications, setNotifications] = useState(dummyData.notifications);

  // Modal / Popup visibilities
  const [isNotificationDropdownVisible, setIsNotificationDropdownVisible] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  // Custom Toast System
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // success, error, info
  const [isToastVisible, setIsToastVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Preferences toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);

  // Digital Keypad / Add Expense fields
  const [padType, setPadType] = useState('expense'); // expense | income
  const [padAmount, setPadAmount] = useState('0');
  const [padCategory, setPadCategory] = useState('food');
  const [padNotes, setPadNotes] = useState('');
  const [padDate, setPadDate] = useState(getTodayDateISO());

  // Search and Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // all, expense, income

  // AI Chat Bot
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiDiagnosticDismissed, setAiDiagnosticDismissed] = useState(false);

  // Constants baselines matching client requirements
  const INITIAL_BALANCE = 8450.20;
  const INITIAL_MONTHLY_SPENT = 4280.50;

  // Apply Theme Colors
  const theme = isDarkMode ? DarkTheme : LightTheme;

  // --- EFFECT: Splash and Setup ---
  useEffect(() => {
    // Dynamic welcome alert toast
    triggerToast('Welcome back, Alex. Financial AI active.', 'info');
  }, []);

  // --- HELPER: Trigger custom floating toast ---
  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setIsToastVisible(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => {
      setIsToastVisible(false);
    });
  };

  // --- HELPER: Dates ---
  function getTodayDateISO() {
    return new Date().toISOString().split('T')[0];
  }

  function getOffsetDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    return d.toISOString().split('T')[0];
  }

  function getFriendlyDateLabel(dateStr) {
    const today = getTodayDateISO();

    // Create offset yesterday date
    const yestDateObj = new Date();
    yestDateObj.setDate(yestDateObj.getDate() - 1);
    const yesterday = yestDateObj.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  }

  function getCurrentTimeLabel() {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    let minutes = now.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  }

  // --- ENGINE: Calculate Dynamic Totals ---
  const calculateFinancials = () => {
    const baselineTxIds = ['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6'];
    let userBalanceAdjustment = 0;
    let userSpentAdjustment = 0;

    const categorySpent = {};
    Object.keys(dummyData.categories).forEach(key => {
      categorySpent[key] = dummyData.categories[key].baseSpent;
    });

    transactions.forEach(tx => {
      const isNew = !baselineTxIds.includes(tx.id);
      if (isNew) {
        if (tx.type === 'expense') {
          userBalanceAdjustment -= tx.amount;
          userSpentAdjustment += tx.amount;
          if (categorySpent[tx.category] !== undefined) {
            categorySpent[tx.category] += tx.amount;
          }
        } else {
          userBalanceAdjustment += tx.amount;
        }
      }
    });

    return {
      balance: INITIAL_BALANCE + userBalanceAdjustment,
      monthlySpent: INITIAL_MONTHLY_SPENT + userSpentAdjustment,
      categorySpent
    };
  };

  const { balance, monthlySpent, categorySpent } = calculateFinancials();

  // Health score decay based on monthly spent relative to budget limit of $5000
  const getHealthScoreInfo = () => {
    const budgetLimit = 5000;
    const ratio = monthlySpent / budgetLimit;
    let score = 95 - Math.floor(ratio * 20);
    score = Math.max(Math.min(score, 100), 20);

    let verdict = 'Excellent';
    let subtext = "You've saved 24% more than your peers this month.";
    let color = theme.success;

    if (score < 85 && score >= 70) {
      verdict = 'Healthy';
      subtext = 'Your financial health is stable. Keep an eye on dining out.';
      color = theme.primary;
    } else if (score < 70 && score >= 50) {
      verdict = 'Warning';
      subtext = 'Spending is approaching limits. Consider pausing shopping.';
      color = theme.warning;
    } else if (score < 50) {
      verdict = 'Critical';
      subtext = 'Alert: You have exceeded target budget limits. High risk.';
      color = theme.danger;
    }

    return { score, verdict, subtext, color };
  };

  const healthScore = getHealthScoreInfo();

  // --- ACTION: Digital Keypad typing ---
  const handleKeypadPress = (val) => {
    if (val === 'delete') {
      if (padAmount.length <= 1) {
        setPadAmount('0');
      } else {
        setPadAmount(padAmount.slice(0, -1));
      }
      return;
    }

    if (padAmount === '0' && val !== '.') {
      setPadAmount(val);
      return;
    }

    if (val === '.' && padAmount.includes('.')) return;

    if (padAmount.includes('.')) {
      const parts = padAmount.split('.');
      if (parts[1].length >= 2) return;
    }

    if (padAmount.length >= 8) return;

    setPadAmount(padAmount + val);
  };

  // --- ACTION: Save manual transaction ---
  const handleSaveTransaction = () => {
    const amountFloat = parseFloat(padAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      triggerToast('Enter a valid amount', 'error');
      return;
    }

    const newTx = {
      id: `tx-${Date.now()}`,
      title: padNotes.trim() !== '' ? padNotes : dummyData.categories[padCategory].name,
      amount: amountFloat,
      category: padCategory,
      type: padType,
      date: padDate,
      time: getCurrentTimeLabel(),
      notes: padNotes || `Manual ${padType} entry`,
      tags: []
    };

    setTransactions([newTx, ...transactions]);
    triggerToast(`Saved: $${amountFloat.toFixed(2)} to ${dummyData.categories[padCategory].name}`);

    // Reset Keypad and return
    setPadAmount('0');
    setPadNotes('');
    setPadCategory('food');
    setPadType('expense');
    setPadDate(getTodayDateISO());
    setActiveTab('home');
  };

  // --- ACTION: Cancel subscription alert ---
  const handleCancelSubscriptionAlert = () => {
    const refundTx = {
      id: `tx-cancel-sub`,
      title: 'Refund: CloudStream (Canceled)',
      amount: 24.99,
      category: 'entertainment',
      type: 'income',
      date: getTodayDateISO(),
      time: getCurrentTimeLabel(),
      notes: 'Unused subscription subscription canceled via AI recommendations diagnostics',
      tags: []
    };

    setTransactions([refundTx, ...transactions]);
    setNotifications([
      {
        id: `noti-${Date.now()}`,
        text: 'CloudStream subscription canceled. Saved $24.99/mo.',
        time: 'Just now',
        unread: true
      },
      ...notifications
    ]);

    setAiDiagnosticDismissed(true);
    triggerToast('Subscription canceled. Balance updated.');
  };

  // --- ACTION: Scanner simulator ---
  const handleScanCapture = () => {
    setIsScannerVisible(false);
    triggerToast('Receipt analyzed successfully!', 'info');

    // Prepopulate add screen and redirect
    setTimeout(() => {
      setPadAmount('14.50');
      setPadNotes('Blue Bottle Coffee');
      setPadCategory('food');
      setPadType('expense');
      setPadDate(getTodayDateISO());
      setActiveTab('add');
      triggerToast('Receipt amount loaded: $14.50');
    }, 800);
  };

  // --- ACTION: AI Assistant Contextual Q&A Chatbot ---
  const handleSendChat = (customText = null) => {
    const query = customText || chatInput;
    if (!query || query.trim() === '') return;

    const userMessage = { id: `chat-${Date.now()}`, text: query, sender: 'user' };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsAiThinking(true);

    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('amazon') || q.includes('shop')) {
        const shoppingTxs = transactions.filter(t => t.category === 'shopping');
        const total = shoppingTxs.reduce((sum, t) => sum + t.amount, 0);
        reply = `You spent $${total.toFixed(2)} on shopping this week across ${shoppingTxs.length} purchases. Your largest charge was at Apple Store ($1,200.00).`;
      } else if (q.includes('coffee') || q.includes('starbucks')) {
        const coffeeTxs = transactions.filter(t => t.title.toLowerCase().includes('coffee') || t.title.toLowerCase().includes('starbucks'));
        const total = coffeeTxs.reduce((sum, t) => sum + t.amount, 0);
        reply = `I tracked ${coffeeTxs.length} coffee purchases totaling $${total.toFixed(2)} this week. Tapping your 'Dining' limits might stabilize this trend.`;
      } else if (q.includes('rent') || q.includes('housing')) {
        reply = `Your housing lease and energy utilities stand at $2,100.00 this month. This accounts for 49% of overall spending.`;
      } else if (q.includes('tax')) {
        reply = `A-Expense AI report: Tax estimation for 2026 is processed. File 'A-Expense_Tax_2026.pdf' is ready for export.`;
      } else if (q.includes('refund')) {
        reply = `I located 1 active credit adjustment: $24.99 refunded from CloudStream. The cash has cleared to your wallet.`;
      } else {
        const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        reply = `I've analyzed your transaction log (${transactions.length} items). Total logged expenses stand at $${totalExp.toFixed(2)}. Major category: Rent. Let me know if you need specific details!`;
      }

      setChatMessages([...updatedMessages, { id: `chat-${Date.now()}-ai`, text: reply, sender: 'ai' }]);
      setIsAiThinking(false);
    }, 1000);
  };

  // --- RENDER SCREEN MODULES ---

  // RENDER: HOME DASHBOARD
  const renderHomeView = () => {
    const recentActivity = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Wallet Credit Card */}
        <TouchableOpacity style={styles.cardWrapper} activeOpacity={0.9}>
          <LinearGradient
            colors={['#4f46e5', '#6366f1', '#8b5cf6', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.cardBrand}>A-Expense Platinum</Text>
              <View style={styles.cardChip} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>Total Balance</Text>
              <Text style={styles.cardBalance}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.cardFooterFlex}>
              <Text style={styles.cardNumber}>•••• •••• •••• 4820</Text>
              <View>
                <Text style={styles.expiryLabel}>EXP</Text>
                <Text style={styles.expiryDate}>09/29</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Monthly summary banner */}
        <View style={[styles.bannerContainer, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.bannerStat}>
            <Text style={styles.bannerLabel}>Monthly Spent</Text>
            <Text style={[styles.bannerValue, { color: theme.textPrimary }]}>${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.bannerDivider, { backgroundColor: theme.border }]} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerLabel}>AI Health Rating</Text>
            <Text style={[styles.bannerValue, { color: theme.success }]}>
              <Ionicons name="sparkles" size={13} color={theme.success} /> Excellent
            </Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setIsScannerVisible(true)}>
            <View style={[styles.actionIconBox, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Ionicons name="scan-outline" size={20} color={theme.textPrimary} />
            </View>
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>Scan Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => {
            setActiveTab('insights');
            setTimeout(() => triggerToast('A-Insight assistant ready to help.', 'info'), 300);
          }}>
            <View style={[styles.actionIconBox, { backgroundColor: theme.accentGlow, borderColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Ionicons name="sparkles" size={20} color={theme.accent} />
            </View>
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>AI Forecast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => triggerToast('Transfer Simulator: Balance limit checks exceeded', 'error')}>
            <View style={[styles.actionIconBox, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Ionicons name="send-outline" size={20} color={theme.textPrimary} />
            </View>
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>Send Money</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('insights')}>
            <View style={[styles.actionIconBox, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.textPrimary} />
            </View>
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>Insights</Text>
          </TouchableOpacity>
        </View>

        {/* Wave Spending Chart */}
        <View style={styles.sectionHeaderFlex}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Spending Wave</Text>
          <Text style={styles.sectionLink}>This Week</Text>
        </View>
        <View style={[styles.chartCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          {/* Simple Visual Line Wave Chart using React Native layouts */}
          <View style={styles.chartVisualContainer}>
            <View style={[styles.chartPoint, { bottom: '20%', left: '5%' }]} />
            <View style={[styles.chartPoint, { bottom: '45%', left: '20%' }]} />
            <View style={[styles.chartPoint, { bottom: '30%', left: '40%' }]} />
            <View style={[styles.chartPoint, { bottom: '75%', left: '60%' }]} />
            <View style={[styles.chartPoint, { bottom: '60%', left: '80%' }]} />
            <View style={[styles.chartPoint, { bottom: '80%', left: '95%' }]} />
            <View style={styles.chartLineVisual} />
          </View>
          <View style={styles.chartLabelsRow}>
            <Text style={styles.chartLabelText}>Mon</Text>
            <Text style={styles.chartLabelText}>Tue</Text>
            <Text style={styles.chartLabelText}>Wed</Text>
            <Text style={styles.chartLabelText}>Thu</Text>
            <Text style={styles.chartLabelText}>Fri</Text>
            <Text style={styles.chartLabelText}>Sat</Text>
            <Text style={styles.chartLabelText}>Sun</Text>
          </View>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionHeaderFlex}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => setActiveTab('history')}>
            <Text style={styles.sectionLink}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentListContainer}>
          {recentActivity.map(tx => {
            const meta = dummyData.categories[tx.category] || dummyData.categories.food;
            const amountPrefix = tx.type === 'income' ? '+' : '-';
            const amountColor = tx.type === 'income' ? theme.success : theme.textPrimary;

            return (
              <TouchableOpacity
                key={tx.id}
                style={[styles.transactionCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
                onPress={() => setSelectedTxId(tx.id)}
              >
                <View style={styles.txLeft}>
                  <View style={[styles.txIconBox, { backgroundColor: theme.bgApp, borderColor: theme.border }]}>
                    <Ionicons name={meta.icon} size={18} color={theme.textSecondary} />
                  </View>
                  <View>
                    <Text style={[styles.txTitle, { color: theme.textPrimary }]}>{tx.title}</Text>
                    <Text style={styles.txMeta}>{meta.name} • {tx.time}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: amountColor }]}>{amountPrefix}${tx.amount.toFixed(2)}</Text>
                  {tx.tags && tx.tags.length > 0 && (
                    <View style={[styles.tagBadge, tx.tags[0] === 'flagged' ? { backgroundColor: theme.dangerLight } : { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.tagText, tx.tags[0] === 'flagged' ? { color: theme.danger } : { color: theme.primary }]}>{tx.tags[0]}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  // RENDER: INSIGHTS SCREEN
  const renderInsightsView = () => {
    const sortedCategories = Object.keys(dummyData.categories).filter(key => key !== 'income');

    // Dynamic May calculation height mapping
    const targetBudget = 5000;
    const spentPercentHeight = Math.min((monthlySpent / targetBudget) * 100, 100);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Greeting Banner */}
        <View style={styles.insightsGreeting}>
          <Text style={styles.insightsGreetingTitle}>Good morning, Alex.</Text>
          <Text style={[styles.insightsGreetingDesc, { color: theme.textSecondary }]}>
            I've analyzed your spending from the weekend. You're tracking <Text style={{ color: theme.primary, fontWeight: '700' }}>12% under budget</Text>.
          </Text>
        </View>

        {/* Spending Bar Chart Card */}
        <View style={[styles.insightCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.insightCardHeader}>
            <View>
              <Text style={styles.insightCardLabel}>Total Spending</Text>
              <Text style={[styles.insightCardValue, { color: theme.textPrimary }]}>${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: theme.warningLight }]}>
              <Ionicons name="trending-up" size={10} color={theme.warning} style={{ marginRight: 3 }} />
              <Text style={[styles.trendText, { color: theme.warning }]}>+12% vs last month</Text>
            </View>
          </View>

          {/* Vertical Bar Graph */}
          <View style={styles.spendingBarChart}>
            <View style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: theme.bgInput }]}><View style={[styles.barFill, { height: '40%', backgroundColor: theme.textMuted }]} /></View>
              <Text style={styles.barLabel}>Feb</Text>
            </View>
            <View style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: theme.bgInput }]}><View style={[styles.barFill, { height: '70%', backgroundColor: theme.textMuted }]} /></View>
              <Text style={styles.barLabel}>Mar</Text>
            </View>
            <View style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: theme.bgInput }]}><View style={[styles.barFill, { height: '55%', backgroundColor: theme.textMuted }]} /></View>
              <Text style={styles.barLabel}>Apr</Text>
            </View>
            <View style={[styles.barCol, styles.activeBarCol]}>
              <View style={[styles.barTrack, { backgroundColor: theme.bgInput }]}>
                <View style={[styles.barFill, { height: `${spentPercentHeight}%`, backgroundColor: theme.primary }]} />
              </View>
              <Text style={[styles.barLabel, { color: theme.primary, fontWeight: '700' }]}>May</Text>
            </View>
            <View style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: theme.bgInput, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.textMuted }]}>
                <View style={[styles.barFill, { height: '60%', backgroundColor: theme.textMuted, opacity: 0.6 }]} />
              </View>
              <Text style={styles.barLabel}>Jun (Est)</Text>
            </View>
          </View>
        </View>

        {/* Health Score gauge */}
        <View style={[styles.insightCard, styles.centeredCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={styles.insightCardLabel}>HEALTH SCORE</Text>
          <View style={[styles.healthGaugeContainer, { borderColor: theme.border }]}>
            <Text style={[styles.healthScoreText, { color: theme.textPrimary }]}>{healthScore.score}</Text>
            <Text style={styles.healthScoreMax}>OUT OF 100</Text>
          </View>
          <Text style={[styles.healthScoreVerdict, { color: healthScore.color }]}>{healthScore.verdict}</Text>
          <Text style={[styles.healthScoreSubtext, { color: theme.textSecondary }]}>{healthScore.subtext}</Text>
        </View>

        {/* Category breakdown with progress bars */}
        <View style={[styles.insightCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderFlex}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Categories</Text>
            <Text style={styles.sectionLink}>View All</Text>
          </View>
          <View style={styles.categoryBreakdownList}>
            {sortedCategories.map(key => {
              const meta = dummyData.categories[key];
              const spentVal = categorySpent[key] || 0;
              const ratio = Math.min(spentVal / meta.budget, 1);

              return (
                <View key={key} style={styles.categoryRow}>
                  <View style={styles.catRowTop}>
                    <View style={styles.catTitleRow}>
                      <Ionicons name={meta.icon} size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.catRowName, { color: theme.textPrimary }]}>{meta.name}</Text>
                    </View>
                    <Text style={styles.catRowStats}>
                      <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>${spentVal}</Text> / ${meta.budget}
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, { backgroundColor: theme.bgInput }]}>
                    <View style={[styles.progressBarFill, { width: `${ratio * 100}%`, backgroundColor: meta.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* AI Forecast Gradient Card */}
        <LinearGradient
          colors={['#7c3aed', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiForecastCard}
        >
          <View style={styles.forecastHeader}>
            <Ionicons name="sparkles" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.forecastHeaderTitle}>AI Forecast</Text>
          </View>
          <Text style={styles.forecastDesc}>
            Based on your current trajectory, we expect you'll finish the quarter with <Text style={{ fontWeight: '800' }}>$1,450 remaining</Text> in your discretionary fund.
          </Text>
          <TouchableOpacity style={styles.forecastBtn} onPress={() => triggerToast('Optimizing budget parameters... Aligning.', 'success')}>
            <Text style={styles.forecastBtnText}>Optimize Now</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* AI Diagnostics Warnings Section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>AI Diagnostics</Text>

        {!aiDiagnosticDismissed && (
          <View style={[styles.diagnosticCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <View style={styles.diagHeaderFlex}>
              <View style={[styles.diagIconBox, { backgroundColor: theme.accentGlow }]}>
                <Ionicons name="sparkles" size={12} color={theme.accent} />
              </View>
              <View style={[styles.tagBadge, { backgroundColor: theme.accentGlow }]}>
                <Text style={[styles.tagText, { color: theme.accent }]}>High Priority</Text>
              </View>
            </View>
            <Text style={[styles.diagTitle, { color: theme.textPrimary }]}>Subscription Alert</Text>
            <Text style={[styles.diagDesc, { color: theme.textSecondary }]}>
              I noticed a $24.99 charge from "CloudStream" which hasn't been used in 3 months. Should we cancel it?
            </Text>
            <View style={styles.diagActionsFlex}>
              <TouchableOpacity style={[styles.diagBtnPrimary, { backgroundColor: theme.primary }]} onPress={handleCancelSubscriptionAlert}>
                <Text style={styles.diagBtnPrimaryText}>Yes, Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.diagBtnSecondary, { backgroundColor: theme.bgInput }]} onPress={() => setAiDiagnosticDismissed(true)}>
                <Text style={[styles.diagBtnSecondaryText, { color: theme.textSecondary }]}>Keep It</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Coffee alert card */}
        <View style={[styles.diagnosticCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.diagHeaderFlex}>
            <View style={[styles.diagIconBox, { backgroundColor: theme.dangerLight }]}>
              <Ionicons name="trending-up" size={12} color={theme.danger} />
            </View>
            <Text style={[styles.diagSubLabel, { color: theme.textMuted }]}>COFFEE TREND</Text>
          </View>
          <Text style={[styles.diagStatVal, { color: theme.danger }]}>-$142.00</Text>
          <Text style={[styles.diagDesc, { color: theme.textSecondary }]}>
            Spending at coffee shops is up 22% this month. At this rate, you'll exceed your 'Dining' budget by Friday.
          </Text>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.bgInput, height: 6 }]}>
            <View style={[styles.progressBarFill, { width: '82%', backgroundColor: theme.danger }]} />
          </View>
        </View>

        {/* Weekly forecast card */}
        <View style={[styles.diagnosticCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.diagHeaderFlex}>
            <View style={[styles.diagIconBox, { backgroundColor: theme.successLight }]}>
              <Ionicons name="calendar-outline" size={12} color={theme.success} />
            </View>
            <Text style={[styles.diagSubLabel, { color: theme.textMuted }]}>WEEKLY FORECAST</Text>
          </View>
          <Text style={[styles.diagTitle, { color: theme.textPrimary }]}>Weekly Forecast</Text>
          <Text style={[styles.diagDesc, { color: theme.textSecondary }]}>
            Predicted end-of-week balance: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>$2,450.00</Text>
          </Text>
          <View style={styles.forecastChartContainer}>
            <View style={[styles.forecastChartBar, { height: '35%', backgroundColor: theme.textMuted }]} />
            <View style={[styles.forecastChartBar, { height: '45%', backgroundColor: theme.textMuted }]} />
            <View style={[styles.forecastChartBar, { height: '60%', backgroundColor: theme.textMuted }]} />
            <View style={[styles.forecastChartBar, { height: '85%', backgroundColor: theme.primary }]} />
            <View style={[styles.forecastChartBar, { height: '50%', backgroundColor: theme.textMuted }]} />
          </View>
          <Text style={[styles.forecastChartLabel, { color: theme.textMuted }]}>Projected Spending Momentum</Text>
        </View>

        {/* Ask A-Insight Chatbot Console */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Ask A-Insight</Text>
        <View style={[styles.aiChatCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={[styles.chatScrollArea, { borderColor: theme.border }]}>
            {chatMessages.length === 0 ? (
              <View style={styles.chatPlaceholder}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.textMuted} />
                <Text style={[styles.chatPlaceholderText, { color: theme.textMuted }]}>
                  Ask a question or click a suggestion below to get simulated AI insights on your finances.
                </Text>
              </View>
            ) : (
              chatMessages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    msg.sender === 'user'
                      ? [styles.chatBubbleUser, { backgroundColor: theme.primary }]
                      : [styles.chatBubbleAi, { backgroundColor: theme.bgInput, borderColor: theme.border }]
                  ]}
                >
                  <Text style={msg.sender === 'user' ? styles.chatBubbleUserText : [styles.chatBubbleAiText, { color: theme.textPrimary }]}>
                    {msg.text}
                  </Text>
                </View>
              ))
            )}
            {isAiThinking && (
              <View style={[styles.chatBubble, styles.chatBubbleAi, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                <Text style={[styles.chatBubbleAiText, { color: theme.textMuted }]}>A-Insight is analyzing...</Text>
              </View>
            )}
          </View>

          {/* Text Input Row */}
          <View style={[styles.chatInputRow, { backgroundColor: theme.bgInput }]}>
            <TextInput
              style={[styles.chatInput, { color: theme.textPrimary }]}
              placeholder="Ask A-Insight something..."
              placeholderTextColor={theme.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: theme.primary }]} onPress={() => handleSendChat()}>
              <Ionicons name="arrow-up" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Chips */}
          <View style={styles.chatChipsRow}>
            <TouchableOpacity style={[styles.chatChip, { backgroundColor: theme.bgInput, borderColor: theme.border }]} onPress={() => handleSendChat('Compare rent vs last year')}>
              <Text style={[styles.chatChipText, { color: theme.textSecondary }]}>Compare rent vs last year</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chatChip, { backgroundColor: theme.bgInput, borderColor: theme.border }]} onPress={() => handleSendChat('Export tax report')}>
              <Text style={[styles.chatChipText, { color: theme.textSecondary }]}>Export tax report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chatChip, { backgroundColor: theme.bgInput, borderColor: theme.border }]} onPress={() => handleSendChat('Find refund status')}>
              <Text style={[styles.chatChipText, { color: theme.textSecondary }]}>Find refund status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // RENDER: ADD EXPENSE SCREEN (with simulator keypad)
  const renderAddView = () => {
    const selectedCategory = padCategory;
    const catKeys = Object.keys(dummyData.categories).filter(key => {
      if (padType === 'expense' && key === 'income') return false;
      if (padType === 'income' && key !== 'income') return false;
      return true;
    });

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Switch tab selector for Expense vs Income */}
        <View style={styles.centeredRow}>
          <View style={[styles.toggleSelector, { backgroundColor: theme.bgInput }]}>
            <TouchableOpacity
              style={[styles.toggleTab, padType === 'expense' && [styles.toggleTabActive, { backgroundColor: theme.bgCard }]]}
              onPress={() => {
                setPadType('expense');
                setPadCategory('food');
              }}
            >
              <Text style={[styles.toggleTabText, padType === 'expense' && { color: theme.textPrimary }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, padType === 'income' && [styles.toggleTabActive, { backgroundColor: theme.bgCard }]]}
              onPress={() => {
                setPadType('income');
                setPadCategory('income');
              }}
            >
              <Text style={[styles.toggleTabText, padType === 'income' && { color: theme.success }]}>Income</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Large Amount Display */}
        <View style={styles.amountDisplay}>
          <Text style={[styles.amountSymbol, { color: theme.textPrimary }]}>$</Text>
          <Text style={[styles.amountValueText, { color: theme.textPrimary }]}>{padAmount}</Text>
          <Text style={styles.amountCursor}>|</Text>
        </View>

        {/* Fields Card */}
        <View style={[styles.fieldsCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          {/* Categories Horizontal Scroll */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalPills}>
              {catKeys.map(key => {
                const meta = dummyData.categories[key];
                const active = selectedCategory === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryPill,
                      { backgroundColor: theme.bgInput },
                      active && { borderColor: theme.primary, backgroundColor: theme.primaryLight }
                    ]}
                    onPress={() => setPadCategory(key)}
                  >
                    <Ionicons name={meta.icon} size={12} color={active ? theme.primary : theme.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.categoryPillText, { color: active ? theme.primary : theme.textSecondary }]}>{meta.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Date row */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>DATE</Text>
            <View style={[styles.fieldInputRow, { backgroundColor: theme.bgInput }]}>
              <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.fieldTextInput, { color: theme.textPrimary }]}
                value={padDate}
                onChangeText={setPadDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Notes text input */}
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>NOTES</Text>
            <View style={[styles.fieldInputRow, { backgroundColor: theme.bgInput }]}>
              <Ionicons name="create-outline" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.fieldTextInput, { color: theme.textPrimary }]}
                value={padNotes}
                onChangeText={setPadNotes}
                placeholder="e.g. Starbucks Nitro Cold Brew"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Digital Keypad */}
        <View style={styles.keypadWrapper}>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('1')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>1</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('2')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>2</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('3')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>3</Text></TouchableOpacity>
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('4')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>4</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('5')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>5</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('6')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>6</Text></TouchableOpacity>
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('7')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>7</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('8')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>8</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('9')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>9</Text></TouchableOpacity>
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('.')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>.</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('0')}><Text style={[styles.keyBtnText, { color: theme.textPrimary }]}>0</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => handleKeypadPress('delete')}>
              <Ionicons name="backspace-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtnContainer} activeOpacity={0.8} onPress={handleSaveTransaction}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>Save Transaction</Text>
            <Ionicons name="arrow-forward-outline" size={14} color="#ffffff" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // RENDER: HISTORY
  const renderHistoryView = () => {
    // Filter logic
    let filtered = transactions.filter(tx => {
      if (historyFilter === 'expense' && tx.type !== 'expense') return false;
      if (historyFilter === 'income' && tx.type !== 'income') return false;

      if (searchKeyword && searchKeyword.trim() !== '') {
        const kw = searchKeyword.toLowerCase();
        const titleMatch = tx.title.toLowerCase().includes(kw);
        const notesMatch = tx.notes && tx.notes.toLowerCase().includes(kw);
        const catMatch = dummyData.categories[tx.category] && dummyData.categories[tx.category].name.toLowerCase().includes(kw);
        return titleMatch || notesMatch || catMatch;
      }
      return true;
    });

    // Grouping by Date
    const grouped = {};
    filtered.forEach(tx => {
      const label = getFriendlyDateLabel(tx.date);
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(tx);
    });

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sticky Filter Search Row */}
        <View style={styles.historyStickyBar}>
          <View style={[styles.searchBar, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={[styles.searchInputText, { color: theme.textPrimary }]}
              placeholder="Search history, categories..."
              placeholderTextColor={theme.textMuted}
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity onPress={() => setSearchKeyword('')}>
                <Ionicons name="close-circle" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[styles.filterPill, historyFilter === 'all' && [styles.filterPillActive, { backgroundColor: theme.primary }]]}
              onPress={() => setHistoryFilter('all')}
            >
              <Text style={[styles.filterPillText, historyFilter === 'all' && { color: '#ffffff' }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, historyFilter === 'expense' && [styles.filterPillActive, { backgroundColor: theme.primary }]]}
              onPress={() => setHistoryFilter('expense')}
            >
              <Text style={[styles.filterPillText, historyFilter === 'expense' && { color: '#ffffff' }]}>Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, historyFilter === 'income' && [styles.filterPillActive, { backgroundColor: theme.primary }]]}
              onPress={() => setHistoryFilter('income')}
            >
              <Text style={[styles.filterPillText, historyFilter === 'income' && { color: '#ffffff' }]}>Income</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Ionicons name="search" size={22} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No transactions found</Text>
            <Text style={[styles.emptyStateDesc, { color: theme.textMuted }]}>Try adjusting search tags or filtering parameters.</Text>
          </View>
        ) : (
          Object.keys(grouped).map(dateTitle => (
            <View key={dateTitle} style={styles.dateGroup}>
              <Text style={styles.dateGroupTitle}>{dateTitle}</Text>
              {grouped[dateTitle].map(tx => {
                const meta = dummyData.categories[tx.category] || dummyData.categories.food;
                const amountPrefix = tx.type === 'income' ? '+' : '-';
                const amountColor = tx.type === 'income' ? theme.success : theme.textPrimary;
                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={[styles.transactionCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
                    onPress={() => setSelectedTxId(tx.id)}
                  >
                    <View style={styles.txLeft}>
                      <View style={[styles.txIconBox, { backgroundColor: theme.bgApp, borderColor: theme.border }]}>
                        <Ionicons name={meta.icon} size={18} color={theme.textSecondary} />
                      </View>
                      <View>
                        <Text style={[styles.txTitle, { color: theme.textPrimary }]}>{tx.title}</Text>
                        <Text style={styles.txMeta}>{meta.name} • {tx.time}</Text>
                      </View>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: amountColor }]}>{amountPrefix}${tx.amount.toFixed(2)}</Text>
                      {tx.tags && tx.tags.length > 0 && (
                        <View style={[styles.tagBadge, tx.tags[0] === 'flagged' ? { backgroundColor: theme.dangerLight } : { backgroundColor: theme.primaryLight }]}>
                          <Text style={[styles.tagText, tx.tags[0] === 'flagged' ? { color: theme.danger } : { color: theme.primary }]}>{tx.tags[0]}</Text>
                        </View>
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
  };

  // RENDER: PROFILE & PREFERENCES
  const renderProfileView = () => {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.profileAvatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>AM</Text>
            </View>
            <TouchableOpacity style={[styles.avatarEditBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={10} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, { color: theme.textPrimary }]}>Alex Mercer</Text>
          <Text style={[styles.profileEmail, { color: theme.textMuted }]}>alex.mercer@a-expense.com</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badgePill, { backgroundColor: theme.accentGlow }]}>
              <Ionicons name="shield-checkmark" size={10} color={theme.accent} style={{ marginRight: 3 }} />
              <Text style={[styles.badgePillText, { color: theme.accent }]}>PRO Member</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1 }]}>
              <Ionicons name="flame" size={10} color="#d97706" style={{ marginRight: 3 }} />
              <Text style={[styles.badgePillText, { color: '#d97706' }]}>14 Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Section preferences */}
        <Text style={styles.profileSectionTitle}>Preferences</Text>
        <View style={[styles.settingsGroupCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>

          <View style={[styles.settingsRow, { borderColor: theme.border }]}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#334155' }]}>
                <Ionicons name="moon-outline" size={14} color="#ffffff" />
              </View>
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: theme.border, true: theme.success }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.settingsRow, { borderColor: theme.border }]}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: theme.primary }]}>
                <Ionicons name="notifications-outline" size={14} color="#ffffff" />
              </View>
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Smart Alerts</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(val) => {
                setPushEnabled(val);
                triggerToast(val ? 'Alert notifications armed' : 'Alert notifications paused', 'info');
              }}
              trackColor={{ false: theme.border, true: theme.success }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: theme.success }]}>
                <Ionicons name="finger-print-outline" size={14} color="#ffffff" />
              </View>
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Face ID Security</Text>
            </View>
            <Switch
              value={faceIdEnabled}
              onValueChange={(val) => {
                setFaceIdEnabled(val);
                triggerToast(val ? 'Face ID security active' : 'Face ID lock suspended', 'info');
              }}
              trackColor={{ false: theme.border, true: theme.success }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section Financial settings */}
        <Text style={styles.profileSectionTitle}>Financial Profile</Text>
        <View style={[styles.settingsGroupCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>

          <TouchableOpacity style={[styles.settingsRow, { borderColor: theme.border }]} onPress={() => triggerToast('Checking connected institutions...', 'info')}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: theme.accent }]}>
                <Ionicons name="link-outline" size={14} color="#ffffff" />
              </View>
              <View>
                <Text style={[styles.settingText, { color: theme.textPrimary }]}>Connected Banks</Text>
                <Text style={styles.settingSubtext}>2 banks connected</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRow, { borderColor: theme.border }]} onPress={() => triggerToast('Limit config locked for this billing period', 'warning')}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#ec4899' }]}>
                <Ionicons name="pie-chart-outline" size={14} color="#ffffff" />
              </View>
              <View>
                <Text style={[styles.settingText, { color: theme.textPrimary }]}>Limit Budgets</Text>
                <Text style={styles.settingSubtext}>$4,800 monthly ceiling</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#14b8a6' }]}>
                <Ionicons name="globe-outline" size={14} color="#ffffff" />
              </View>
              <View>
                <Text style={[styles.settingText, { color: theme.textPrimary }]}>Primary Currency</Text>
                <Text style={styles.settingSubtext}>USD ($)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Log Out button */}
        <Text style={styles.profileSectionTitle}>Account Actions</Text>
        <TouchableOpacity
          style={[styles.settingsGroupCard, styles.logoutCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
          onPress={() => triggerToast('Log out action is a simulation.', 'error')}
        >
          <View style={styles.settingsRowLeft}>
            <View style={[styles.settingIconBox, { backgroundColor: theme.danger }]}>
              <Ionicons name="log-out-outline" size={14} color="#ffffff" />
            </View>
            <Text style={[styles.settingText, { color: theme.danger, fontWeight: '700' }]}>Log Out Account</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.appVersionContainer}>
          <Text style={[styles.appVersionText, { color: theme.textMuted }]}>A-Expense v1.4.2 (Production)</Text>
          <Text style={[styles.appVersionText, { color: theme.textMuted }]}>
            Made with <Ionicons name="heart" size={10} color={theme.danger} /> for Gen Z Fintech
          </Text>
        </View>
      </ScrollView>
    );
  };

  // --- RENDER MODALS AND DROPDOWNS ---

  // RENDER: Notification Dropdown Overlay
  const renderNotificationDropdown = () => {
    const unreadNotifications = notifications.filter(n => n.unread);
    return (
      <Modal
        visible={isNotificationDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNotificationDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setIsNotificationDropdownVisible(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <View style={[styles.dropdownHeader, { borderColor: theme.border }]}>
              <Text style={[styles.dropdownHeaderTitle, { color: theme.textPrimary }]}>Notifications</Text>
              <TouchableOpacity onPress={() => {
                setNotifications(notifications.map(n => ({ ...n, unread: false })));
                triggerToast('All notifications cleared.');
              }}>
                <Text style={styles.dropdownClearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 220 }}>
              {notifications.map(noti => (
                <TouchableOpacity
                  key={noti.id}
                  style={[styles.dropdownItem, noti.unread && { backgroundColor: theme.primaryLight }, { borderColor: theme.border }]}
                  onPress={() => {
                    setNotifications(notifications.map(n => n.id === noti.id ? { ...n, unread: false } : n));
                    triggerToast('Notification marked as read.', 'info');
                  }}
                >
                  {noti.unread && <View style={[styles.dropdownDot, { backgroundColor: theme.primary }]} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownText, { color: theme.textPrimary }]}>{noti.text}</Text>
                    <Text style={styles.dropdownTime}>{noti.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // RENDER: Detail Slide-up sheet Modal
  const renderDetailModal = () => {
    const tx = transactions.find(t => t.id === selectedTxId);
    if (!tx) return null;
    const meta = dummyData.categories[tx.category] || dummyData.categories.food;

    return (
      <Modal
        visible={selectedTxId !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedTxId(null)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedTxId(null)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.bgCard }]}>
          <View style={[styles.modalDragBar, { backgroundColor: theme.bgInput }]} />
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{tx.title}</Text>

          <View style={[styles.modalGrid, { backgroundColor: theme.bgInput }]}>
            <View style={styles.modalItem}>
              <Text style={styles.modalLabel}>AMOUNT</Text>
              <Text style={[styles.modalValue, tx.type === 'income' ? { color: theme.success } : { color: theme.danger }]}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.modalItem}>
              <Text style={styles.modalLabel}>CATEGORY</Text>
              <Text style={[styles.modalValue, { color: theme.textPrimary }]}>{meta.name}</Text>
            </View>
            <View style={styles.modalItem}>
              <Text style={styles.modalLabel}>DATE & TIME</Text>
              <Text style={[styles.modalValue, { color: theme.textPrimary }]}>{getFriendlyDateLabel(tx.date)}, {tx.time}</Text>
            </View>
            <View style={styles.modalItem}>
              <Text style={styles.modalLabel}>STATUS</Text>
              <Text style={[styles.modalValue, { color: theme.success }]}>Completed</Text>
            </View>
          </View>

          <View style={styles.modalNotesSection}>
            <Text style={styles.modalLabel}>NOTES</Text>
            <Text style={[styles.modalNotesText, { color: theme.textSecondary }]}>{tx.notes}</Text>
          </View>

          <TouchableOpacity
            style={[styles.modalDeleteBtn, { backgroundColor: theme.dangerLight }]}
            onPress={() => {
              setTransactions(transactions.filter(t => t.id !== tx.id));
              setSelectedTxId(null);
              triggerToast('Transaction deleted successfully', 'info');
            }}
          >
            <Ionicons name="trash-2-outline" size={14} color={theme.danger} style={{ marginRight: 6 }} />
            <Text style={[styles.modalDeleteText, { color: theme.danger }]}>Delete Transaction</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // RENDER: Receipt scanner camera simulator
  const renderScannerModal = () => {
    return (
      <Modal
        visible={isScannerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerHeaderTitle}>Scan Receipt</Text>
            <TouchableOpacity onPress={() => setIsScannerVisible(false)}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.scannerViewport}>
            <View style={styles.scannerFrame} />
            <View style={styles.scannerLaser} />
            <Text style={styles.scannerInstruction}>Position receipt inside the green frame</Text>
          </View>

          <View style={styles.scannerFooter}>
            <TouchableOpacity style={styles.shutterBtn} onPress={handleScanCapture}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // --- MAIN SCREEN CANVAS ASSEMBLY ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgApp }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgApp} />

      {/* Dynamic Screen Viewport Header */}
      <View style={styles.screenHeader}>
        {activeTab === 'home' && (
          <View style={styles.headerProfileRow}>
            <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.headerAvatarText}>AM</Text>
            </View>
            <View>
              <Text style={styles.headerGreeting}>Good afternoon,</Text>
              <Text style={[styles.headerUserName, { color: theme.textPrimary }]}>Alex Mercer</Text>
            </View>
          </View>
        )}

        {activeTab === 'insights' && (
          <View>
            <Text style={styles.headerPreTitle}>ANALYTICS OVERVIEW</Text>
            <Text style={[styles.headerTitleText, { color: theme.textPrimary }]}>A-Insight</Text>
          </View>
        )}

        {activeTab === 'add' && (
          <View>
            <Text style={styles.headerPreTitle}>FINTECH KEYPAD</Text>
            <Text style={[styles.headerTitleText, { color: theme.textPrimary }]}>Add Expense</Text>
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            <Text style={styles.headerPreTitle}>TRANSACTION LIST</Text>
            <Text style={[styles.headerTitleText, { color: theme.textPrimary }]}>History</Text>
          </View>
        )}

        {activeTab === 'profile' && (
          <View>
            <Text style={styles.headerPreTitle}>SETTINGS & INFO</Text>
            <Text style={[styles.headerTitleText, { color: theme.textPrimary }]}>Profile</Text>
          </View>
        )}

        {/* Right side alert bell action */}
        <TouchableOpacity
          style={[styles.headerBellBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
          onPress={() => setIsNotificationDropdownVisible(true)}
        >
          <Ionicons name="notifications-outline" size={16} color={theme.textSecondary} />
          {notifications.some(n => n.unread) && <View style={[styles.bellBadgeDot, { backgroundColor: theme.danger }]} />}
        </TouchableOpacity>
      </View>

      {/* Screen Viewport switching */}
      <View style={styles.viewport}>
        {activeTab === 'home' && renderHomeView()}
        {activeTab === 'insights' && renderInsightsView()}
        {activeTab === 'add' && renderAddView()}
        {activeTab === 'history' && renderHistoryView()}
        {activeTab === 'profile' && renderProfileView()}
      </View>

      {/* Navigation Tab Bar fixed at bottom */}
      <View style={[styles.bottomNavBar, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} onPress={() => setActiveTab('home')}>
          <Ionicons name={activeTab === 'home' ? 'home' : 'home-outline'} size={18} color={activeTab === 'home' ? theme.primary : theme.textMuted} />
          <Text style={[styles.navLabelText, { color: activeTab === 'home' ? theme.primary : theme.textMuted }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, activeTab === 'insights' && styles.navItemActive]} onPress={() => setActiveTab('insights')}>
          <Ionicons name={activeTab === 'insights' ? 'sparkles' : 'sparkles-outline'} size={18} color={activeTab === 'insights' ? theme.primary : theme.textMuted} />
          <Text style={[styles.navLabelText, { color: activeTab === 'insights' ? theme.primary : theme.textMuted }]}>Insights</Text>
        </TouchableOpacity>

        {/* Floating Action Button (FAB) in center */}
        <View style={styles.fabWrapperContainer}>
          <TouchableOpacity style={styles.fabButton} activeOpacity={0.8} onPress={() => setActiveTab('add')}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Ionicons name="plus" size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.navItem, activeTab === 'history' && styles.navItemActive]} onPress={() => setActiveTab('history')}>
          <Ionicons name={activeTab === 'history' ? 'time' : 'time-outline'} size={18} color={activeTab === 'history' ? theme.primary : theme.textMuted} />
          <Text style={[styles.navLabelText, { color: activeTab === 'history' ? theme.primary : theme.textMuted }]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]} onPress={() => setActiveTab('profile')}>
          <Ionicons name={activeTab === 'profile' ? 'person' : 'person-outline'} size={18} color={activeTab === 'profile' ? theme.primary : theme.textMuted} />
          <Text style={[styles.navLabelText, { color: activeTab === 'profile' ? theme.primary : theme.textMuted }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Floating custom Toast notification banner */}
      {isToastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <View style={[styles.toastCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Ionicons
              name={toastType === 'error' ? 'alert-circle' : toastType === 'info' ? 'information-circle' : 'checkmark-circle'}
              size={16}
              color={toastType === 'error' ? theme.danger : toastType === 'info' ? theme.primary : theme.success}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.toastMessageText, { color: theme.textPrimary }]}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Render overlay elements */}
      {renderNotificationDropdown()}
      {renderDetailModal()}
      {renderScannerModal()}
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// APPLICATION STYLES (StyleSheet)
// ----------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screenHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  headerGreeting: {
    fontSize: 10,
    color: '#64748b',
  },
  headerUserName: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerPreTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerBellBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  viewport: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  // CARD
  cardWrapper: {
    width: '100%',
    aspectRatio: 1.618,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  walletCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardBrand: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardChip: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e5c100',
  },
  cardBody: {
    marginTop: 5,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBalance: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  cardFooterFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardNumber: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
  },
  expiryLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 7,
  },
  expiryDate: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // BANNER
  bannerContainer: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerStat: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  bannerValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bannerDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  },
  // QUICK ACTIONS
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  actionBtn: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 40) / 4 - 8,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 10,
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
  },
  // CHART CARD
  chartCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartVisualContainer: {
    height: 100,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  chartPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  chartLineVisual: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  chartLabelText: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '600',
  },
  // LIST
  recentListContainer: {
    marginBottom: 20,
  },
  transactionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  txMeta: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  tagText: {
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  // INSIGHTS SCREEN
  insightsGreeting: {
    marginBottom: 10,
  },
  insightsGreetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
  },
  insightsGreetingDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  insightCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  insightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  insightCardLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightCardValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 8,
    fontWeight: '700',
  },
  spendingBarChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 15,
  },
  barCol: {
    alignItems: 'center',
    width: '18%',
  },
  activeBarCol: {
    // highlighted May column
  },
  barTrack: {
    height: 70,
    width: 14,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 6,
  },
  centeredCard: {
    alignItems: 'center',
  },
  healthGaugeContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  healthScoreText: {
    fontSize: 22,
    fontWeight: '800',
  },
  healthScoreMax: {
    fontSize: 6,
    color: '#94a3b8',
    fontWeight: '700',
  },
  healthScoreVerdict: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  healthScoreSubtext: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBreakdownList: {
    marginTop: 10,
  },
  categoryRow: {
    marginBottom: 12,
  },
  catRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catRowName: {
    fontSize: 11,
    fontWeight: '700',
  },
  catRowStats: {
    fontSize: 10,
    color: '#64748b',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  aiForecastCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  forecastHeaderTitle: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forecastDesc: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.9,
    marginBottom: 12,
  },
  forecastBtn: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  forecastBtnText: {
    color: '#6366f1',
    fontSize: 9,
    fontWeight: '800',
  },
  // DIAGNOSTIC ALERT CARD
  diagnosticCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  diagHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagIconBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  diagSubLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diagStatVal: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  diagDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 10,
  },
  diagActionsFlex: {
    flexDirection: 'row',
    gap: 8,
  },
  diagBtnPrimary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  diagBtnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagBtnSecondaryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  forecastChartContainer: {
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 6,
  },
  forecastChartBar: {
    width: 12,
    borderRadius: 2,
  },
  forecastChartLabel: {
    fontSize: 7,
    textAlign: 'center',
    fontWeight: '600',
  },
  // CHAT INTERACTIVE
  aiChatCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },
  chatScrollArea: {
    minHeight: 80,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 4,
    marginBottom: 10,
  },
  chatPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  chatPlaceholderText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 6,
    paddingHorizontal: 16,
  },
  chatBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    fontSize: 10,
    maxWidth: '85%',
    marginBottom: 8,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  chatBubbleUserText: {
    color: '#ffffff',
    fontSize: 10,
    lineHeight: 14,
  },
  chatBubbleAi: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  chatBubbleAiText: {
    fontSize: 10,
    lineHeight: 14,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    marginBottom: 10,
  },
  chatInput: {
    flex: 1,
    fontSize: 11,
    height: 30,
  },
  chatSendBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chatChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chatChipText: {
    fontSize: 8,
    fontWeight: '700',
  },
  // ADD SCREEN
  centeredRow: {
    alignItems: 'center',
    marginTop: 5,
  },
  toggleSelector: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 3,
    width: 160,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleTabActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleTabText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  amountDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingVertical: 20,
  },
  amountSymbol: {
    fontSize: 24,
    fontWeight: '800',
    marginRight: 4,
  },
  amountValueText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  amountCursor: {
    fontSize: 36,
    color: '#6366f1',
    fontWeight: '300',
    marginLeft: 2,
  },
  fieldsCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  horizontalPills: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 32,
  },
  fieldTextInput: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  keypadWrapper: {
    gap: 8,
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtnContainer: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  // HISTORY SCREEN
  historyStickyBar: {
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 36,
  },
  searchInputText: {
    flex: 1,
    fontSize: 11,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateGroupTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateDesc: {
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  // PROFILE SCREEN
  profileCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 10,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 7,
    fontWeight: '800',
  },
  profileSectionTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingsGroupCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  settingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingSubtext: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 1,
  },
  logoutCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  appVersionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  appVersionText: {
    fontSize: 8,
    lineHeight: 12,
  },
  // BOTTOM NAV
  bottomNavBar: {
    height: 72,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 15 : 5,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  navItemActive: {
    // styles for active tab
  },
  navLabelText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
  fabWrapperContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    marginTop: -25,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // TOAST
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toastMessageText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // MODALS
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
  },
  dropdownClearText: {
    fontSize: 9,
    color: '#6366f1',
    fontWeight: '700',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 9,
    lineHeight: 12,
  },
  dropdownTime: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  modalDragBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalGrid: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  modalItem: {
    width: '48%',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalNotesSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalNotesText: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalDeleteText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // SCANNER MODAL MOCKS
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 50,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scannerHeaderTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  scannerViewport: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
    marginHorizontal: 20,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  scannerFrame: {
    width: 200,
    height: 280,
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
  },
  scannerLaser: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: 2,
    backgroundColor: '#10b981',
  },
  scannerInstruction: {
    position: 'absolute',
    bottom: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  scannerFooter: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
  },
});
