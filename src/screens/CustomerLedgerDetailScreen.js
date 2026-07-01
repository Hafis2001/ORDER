import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  NativeModules,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';

// Memoized transaction row — skips re-render unless item changes
const TransactionRow = React.memo(function TransactionRow({ item }) {
  const isCredit = item.credit && Number(item.credit) > 0;
  const amount = isCredit ? item.credit : item.debit;
  const color = isCredit ? Colors.error.main : Colors.success.main;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  return (
    <View style={styles.transactionCard}>
      <View style={styles.rowBetween}>
        <View style={[styles.rowCenter, { flex: 1 }]}>
          <View style={[styles.iconCircle, { backgroundColor: isCredit ? Colors.error[50] : Colors.success[50] }]}>
            <Ionicons name={isCredit ? "arrow-down" : "arrow-up"} size={18} color={color} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.particulars} numberOfLines={1} ellipsizeMode="tail">
              {item.particulars}
            </Text>
            <Text style={styles.subText}>
              {formatDate(item.entry_date)} {item.narration ? `• ${item.narration}` : ""}
            </Text>
            <Text style={styles.voucherText}>Voucher No: {item.voucher_no || "-"}</Text>
          </View>
        </View>
        <View style={{ marginLeft: 10, minWidth: 90, alignItems: "flex-end" }}>
          <Text style={[styles.amountText, { color }]}>
            {Math.abs(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
          </Text>
        </View>
      </View>
    </View>
  );
});
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;

// Theme constants
const Colors = {
  primary: { main: '#8E24AA' },
  success: { main: '#43A047', 50: '#E8F5E9' },
  error: { main: '#E53935', 50: '#FFEBEE' },
  neutral: { 300: '#E0E0E0' },
  border: { light: '#F0F0F0', medium: '#E0E0E0' },
  text: { primary: '#1A1A1A', secondary: '#666', tertiary: '#999' },
};
const Gradients = {
  background: ['#F8F9FA', '#FFFFFF'],
  primary: ['#9C27B0', '#7B1FA2'],
  surface: ['#FFFFFF', '#F8F9FA'],
};
const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#8E24AA', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
};

// Simple JS Date Picker Fallback
const JSDatePicker = ({ value, onChange, onClose }) => {
  const initialDate = value || new Date();
  const [day, setDay] = useState(String(initialDate.getDate()));
  const [month, setMonth] = useState(String(initialDate.getMonth() + 1));
  const [year, setYear] = useState(String(initialDate.getFullYear()));
  
  const handleConfirm = () => {
    const d = new Date(parseInt(year), (parseInt(month) || 1) - 1, parseInt(day) || 1);
    onChange({ type: 'set' }, d);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={jsStyles.overlay}>
        <View style={jsStyles.container}>
          <Text style={jsStyles.title}>Select Date</Text>
          <View style={jsStyles.inputRow}>
            <TextInput
              style={jsStyles.input}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="DD"
              value={day}
              onChangeText={setDay}
              selectTextOnFocus
            />
            <Text style={jsStyles.sep}>/</Text>
            <TextInput
              style={jsStyles.input}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              value={month}
              onChangeText={setMonth}
              selectTextOnFocus
            />
            <Text style={jsStyles.sep}>/</Text>
            <TextInput
              style={jsStyles.input}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="YYYY"
              value={year}
              onChangeText={setYear}
              selectTextOnFocus
            />
          </View>
          <View style={jsStyles.btnRow}>
            <TouchableOpacity  activeOpacity={0.7} onPress={onClose} style={[jsStyles.btn, jsStyles.cancelBtn]}>
              <Text style={jsStyles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity  activeOpacity={0.7} onPress={handleConfirm} style={[jsStyles.btn, jsStyles.confirmBtn]}>
              <Text style={[jsStyles.btnText, { color: '#FFF' }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const jsStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '80%', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20, color: '#8E24AA' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  input: { borderBottomWidth: 2, borderBottomColor: '#8E24AA', fontSize: 20, padding: 8, width: 60, textAlign: 'center', fontWeight: '700' },
  sep: { fontSize: 24, marginHorizontal: 8, color: '#999' },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F0F0F0' },
  confirmBtn: { backgroundColor: '#8E24AA' },
  btnText: { fontWeight: '700', fontSize: 14, color: '#666' },
});

export default function CustomerLedgerDetailScreen() {
  // Safe import for DateTimePicker
  let DateTimePicker = null;
  const isNativeAvailable = !!(NativeModules.RNCDatePicker || (Platform.OS === 'ios' && NativeModules.RNCDataPicker));
  
  if (isNativeAvailable) {
    try {
      DateTimePicker = require('@react-native-community/datetimepicker').default;
    } catch (e) {
      console.log('DateTimePicker library load failed despite native module presence');
    }
  }
  
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const { ledgerData, customerName } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [filteredLedger, setFilteredLedger] = useState([]);
  const [apiCustomerName, setApiCustomerName] = useState('');
  
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  // Date range states
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState(null); // "from" or "to"

  useEffect(() => {
    if (ledgerData && ledgerData.entries) {
      processEntries(ledgerData.entries, customerName);
    } else {
      fetchLedgers();
    }
  }, [ledgerData]);

  const processEntries = (entries, cName = '') => {
    if (cName) setApiCustomerName(cName);
    else if (entries.length > 0) setApiCustomerName(entries[0].customer_name);

    const normalizedEntries = entries.map(e => ({
      ...e,
      entry_date: e.date || e.entry_date
    }));

    normalizedEntries.sort((a, b) => {
      const dateA = new Date(a.entry_date);
      const dateB = new Date(b.entry_date);
      if (dateA.getTime() === dateB.getTime()) {
        return (a.voucher_no || 0) - (b.voucher_no || 0);
      }
      return dateB - dateA;
    });

    const current_balance = normalizedEntries.length > 0 ? normalizedEntries[0].balance : 0;
    
    setLedger(normalizedEntries);
    setFilteredLedger(normalizedEntries);
    calculateReverseBalances(normalizedEntries, Number(current_balance) || 0, false);
  };

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch('https://gold.imcbs.com/api/ledger/my/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let ledgerArray = Array.isArray(data) ? data : [data];
        if (ledgerArray.length > 0) {
          const item = ledgerArray[0];
          const entries = item.entries || [];
          const cName = entries.length > 0 ? entries[0].customer_name : `Customer ${item.customer_code}`;
          processEntries(entries, cName);
        }
      }
    } catch (error) {
      console.error('Ledger Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReverseBalances = (entries, currentClosing, isDateFiltered) => {
    if (!entries.length) {
      setOpeningBalance(0);
      setTotalDebit(0);
      setTotalCredit(0);
      return;
    }

    const grouped = {};
    entries.forEach((e) => {
      const d = e.entry_date;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(e);
    });

    const dates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
    let balances = {};
    let nextOpening = currentClosing;

    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      const dayEntries = grouped[date];
      let debitTotal = 0;
      let creditTotal = 0;

      dayEntries.forEach((e) => {
        debitTotal += Number(e.debit || 0);
        creditTotal += Number(e.credit || 0);
      });

      const closing = nextOpening;
      const opening = closing - debitTotal + creditTotal;
      balances[date] = { opening, closing, debitTotal, creditTotal };
      nextOpening = opening;
    }

    if (!isDateFiltered) {
      let totalDebitAll = 0;
      let totalCreditAll = 0;
      entries.forEach((e) => {
        totalDebitAll += Number(e.debit || 0);
        totalCreditAll += Number(e.credit || 0);
      });

      const earliestDate = dates[0];
      const earliest = balances[earliestDate];

      setOpeningBalance(earliest?.opening || 0);
      setClosingBalance(currentClosing);
      setTotalDebit(totalDebitAll);
      setTotalCredit(totalCreditAll);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const filterByDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return;
    const from = new Date(startDate);
    const to = new Date(endDate);

    const filtered = ledger.filter((e) => {
      const d = new Date(e.entry_date);
      return d >= from && d <= to;
    });

    setFilteredLedger(filtered);
    const current_balance = filtered.length > 0 ? filtered[0].balance : 0;
    calculateReverseBalances(filtered, Number(current_balance) || 0, true);

    let tDebit = 0;
    let tCredit = 0;
    filtered.forEach((e) => {
      tDebit += Number(e.debit || 0);
      tCredit += Number(e.credit || 0);
    });

    setTotalDebit(tDebit);
    setTotalCredit(tCredit);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === "from") {
        setFromDate(selectedDate);
        if (toDate) filterByDateRange(selectedDate, toDate);
      } else if (datePickerMode === "to") {
        setToDate(selectedDate);
        if (fromDate) filterByDateRange(fromDate, selectedDate);
      }
    }
  };

  // Handle date picker opening
  const handleDatePickerOpen = (mode) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const refreshAll = () => {
    setFromDate(null);
    setToDate(null);
    setFilteredLedger(ledger);
    const current_balance = ledger.length > 0 ? ledger[0].balance : 0;
    calculateReverseBalances(ledger, Number(current_balance) || 0, false);
  };

  const renderItem = useCallback(({ item }) => <TransactionRow item={item} />, []);

  if (loading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />

        {/* Header Card */}
        <View style={styles.headerContainer}>
          <View style={styles.headerShadowWrapper}>
            <LinearGradient colors={Gradients.primary} style={styles.headerCard}>
              <View style={styles.headerTop}>
                {ledgerData && (
                  <TouchableOpacity  activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }}>
                  <Animated.Text entering={FadeInUp} style={styles.title} numberOfLines={1}>
                    {apiCustomerName || customerName || "Customer Ledger"}
                  </Animated.Text>
                  <Animated.Text entering={FadeInUp.delay(40)} style={styles.dateText}>
                    {fromDate && toDate
                      ? `${formatDate(fromDate)} → ${formatDate(toDate)}`
                      : "All Transactions"}
                  </Animated.Text>
                </View>
                <TouchableOpacity  activeOpacity={0.7} onPress={refreshAll} style={styles.iconAction}>
                  <Ionicons name="refresh" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateActions}>
                <TouchableOpacity  activeOpacity={0.7}
                  onPress={() => handleDatePickerOpen("from")}
                  style={styles.dateButton}
                >
                  <Ionicons name="calendar-outline" size={16} color="#FFF" />
                  <Text style={styles.dateButtonText}>From Date</Text>
                </TouchableOpacity>

                <TouchableOpacity  activeOpacity={0.7}
                  onPress={() => handleDatePickerOpen("to")}
                  style={styles.dateButton}
                >
                  <Ionicons name="calendar" size={16} color="#FFF" />
                  <Text style={styles.dateButtonText}>To Date</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Date picker */}
        {showDatePicker && (
          isNativeAvailable && DateTimePicker ? (
            <DateTimePicker
              value={
                datePickerMode === "from"
                  ? fromDate || new Date()
                  : toDate || new Date()
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          ) : (
            <JSDatePicker
              value={
                datePickerMode === "from"
                  ? fromDate || new Date()
                  : toDate || new Date()
              }
              onChange={onDateChange}
              onClose={() => setShowDatePicker(false)}
            />
          )
        )}

        <View style={styles.contentContainer}>
          {/* Balances */}
          <View style={styles.balanceRow}>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>
                {closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </Text>
            </View>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Opening Balance</Text>
              <Text style={styles.balanceValue}>
                {openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Credit</Text>
              <Text style={[styles.totalValue, { color: Colors.error.main }]}>{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Debit</Text>
              <Text style={[styles.totalValue, { color: Colors.success.main }]}>{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</Text>
            </View>
          </View>

          <Text style={styles.transHeading}>TRANSACTIONS</Text>

          <FlatList keyboardShouldPersistTaps="handled" initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true}
            data={filteredLedger}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={48} color={Colors.neutral[300]} />
                <Text style={styles.emptyText}>No transactions found.</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={false}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footerCard, { marginBottom: Math.max(insets.bottom, 16) }]}>
          <LinearGradient
            colors={Gradients.surface}
            style={styles.footerGradient}
          >
            <Text style={styles.footerLabel}>Closing Balance</Text>
            <Text style={styles.footerValue}>
              {closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </Text>
          </LinearGradient>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  safeArea: {
    flex: 1,
  },

  headerContainer: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  headerShadowWrapper: {
    backgroundColor: 'transparent',
    ...Shadows.md,
  },
  headerCard: {
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { paddingRight: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  dateText: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  iconAction: { padding: 4 },

  dateActions: { flexDirection: 'row', gap: 16 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  dateButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  contentContainer: { flex: 1, paddingHorizontal: 20 },

  balanceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, gap: 16 },
  balanceBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  balanceLabel: { color: Colors.text.secondary, fontWeight: "600", fontSize: 12 },
  balanceValue: { fontSize: 16, fontWeight: "700", color: Colors.text.primary, marginTop: 4 },

  totalCard: {
    flexDirection: "row",
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  totalItem: { flex: 1, alignItems: "center" },
  divider: { width: 1, height: 36, backgroundColor: Colors.border.medium },
  totalLabel: { color: Colors.text.secondary, fontWeight: "600", fontSize: 12 },
  totalValue: { fontSize: 16, fontWeight: "700", marginTop: 4 },

  transHeading: { fontSize: 14, fontWeight: "700", color: Colors.text.tertiary, marginBottom: 12 },

  listContent: { paddingBottom: 100 },

  transactionCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { textAlign: "center", color: Colors.text.tertiary, marginTop: 16 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowCenter: { flexDirection: "row", alignItems: "center" },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  particulars: { fontWeight: "700", color: Colors.text.primary, maxWidth: 220, fontSize: 14 },
  subText: { color: Colors.text.secondary, fontSize: 12, marginTop: 2 },
  voucherText: { color: Colors.text.tertiary, fontSize: 10, marginTop: 2 },

  amountText: { fontSize: 16, fontWeight: "700", textAlign: "right" },

  footerCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  footerGradient: {
    padding: 16,
    alignItems: 'center',
  },
  footerLabel: { color: Colors.text.secondary, fontSize: 14, fontWeight: "700" },
  footerValue: { color: Colors.primary.main, fontSize: 24, fontWeight: "900", marginTop: 4 },
});
