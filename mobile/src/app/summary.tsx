import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { describeSelections, findBranch } from '@/lib/catalog';
import { formatMoney } from '@/lib/pricing';
import { buildOrderMessage, whatsappUrl } from '@/lib/whatsapp';
import { useCart } from '@/state/CartContext';
import { useCatalog } from '@/state/CatalogContext';
import { font, radius, spacing, useColors } from '@/theme';

/** Order summary: customer name and notes, order review, and sending via WhatsApp. */
export default function OrderSummaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, lines, totals, dispatch } = useCart();
  const [triedSubmit, setTriedSubmit] = useState(false);
  const { catalog } = useCatalog();
  const branch = findBranch(state.branchId, catalog);
  const orderLines = lines.filter((l) => l.available);
  const nameMissing = state.customerName.trim().length === 0;

  if (!branch || orderLines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[font.heading, { color: colors.text, textAlign: 'center' }]}>
          {branch ? 'Your cart has no items this branch can prepare.' : 'Choose a branch first.'}
        </Text>
        <Button title="Back to menu" variant="secondary" onPress={() => router.dismissTo('/')} />
      </View>
    );
  }

  const message = buildOrderMessage({
    restaurantName: catalog.restaurantName,
    branch,
    customerName: state.customerName,
    notes: state.notes,
    lines: orderLines,
    subtotal: totals.subtotal,
    currency: catalog.currency,
  });

  /** Copies the order text so it can be pasted into WhatsApp manually. */
  const copyOrder = async () => {
    await Clipboard.setStringAsync(message);
    Alert.alert('Order copied', `Paste it into a WhatsApp chat with ${branch.name} (+${branch.whatsapp}).`);
  };

  /** After WhatsApp opens, offers to clear the cart for a new order. */
  const askToClear = () =>
    Alert.alert('Order sent?', 'Once you have sent the message in WhatsApp, you can start a new order.', [
      { text: 'Keep cart', style: 'cancel' },
      {
        text: 'Start new order',
        onPress: () => {
          dispatch({ type: 'clear' });
          router.dismissTo('/');
        },
      },
    ]);

  /** Validates the name, then opens WhatsApp with the order pre-filled. */
  const sendOrder = async () => {
    setTriedSubmit(true);
    if (nameMissing) return;
    try {
      await Linking.openURL(whatsappUrl(branch.whatsapp, message));
      askToClear();
    } catch {
      Alert.alert("Couldn't open WhatsApp", 'You can copy the order and send it yourself.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy order', onPress: copyOrder },
      ]);
    }
  };

  const inputStyle = [
    styles.input,
    font.body,
    { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[font.caption, { color: colors.textMuted }]}>Sending to</Text>
        <Text style={[font.heading, { color: colors.text }]}>{branch.name}</Text>
        <Text style={[font.caption, { color: colors.textMuted }]}>{branch.address}</Text>
      </View>

      <View style={styles.field}>
        <Text style={[font.heading, { color: colors.text }]}>Your name</Text>
        <TextInput
          value={state.customerName}
          onChangeText={(customerName) => dispatch({ type: 'setCustomer', customerName })}
          placeholder="Who is the order for?"
          placeholderTextColor={colors.textMuted}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          returnKeyType="next"
          maxLength={60}
          style={[inputStyle, triedSubmit && nameMissing && { borderColor: colors.warning }]}
        />
        {triedSubmit && nameMissing && (
          <Text style={[font.caption, { color: colors.warning }]}>
            Please enter your name so the branch knows who to call.
          </Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={[font.heading, { color: colors.text }]}>Notes (optional)</Text>
        <TextInput
          value={state.notes}
          onChangeText={(notes) => dispatch({ type: 'setCustomer', notes })}
          placeholder="Allergies, pickup time, no wasabi…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={300}
          style={[inputStyle, styles.notes]}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {orderLines.map((line) => (
          <View key={line.key} style={styles.line}>
            <View style={styles.lineTop}>
              <Text style={[font.body, styles.flex, { color: colors.text }]}>
                {line.quantity} × {line.product.name}
              </Text>
              <Text style={[font.body, { color: colors.text, fontVariant: ['tabular-nums'] }]}>
                {formatMoney(line.total, catalog.currency)}
              </Text>
            </View>
            {describeSelections(line.product, line.selections).map((option) => (
              <Text key={option} style={[font.caption, { color: colors.textMuted }]}>
                {option}
              </Text>
            ))}
          </View>
        ))}
        <View style={[styles.lineTop, styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[font.heading, styles.flex, { color: colors.text }]}>Total</Text>
          <Text style={[font.title, { color: colors.text, fontVariant: ['tabular-nums'] }]}>
            {formatMoney(totals.subtotal, catalog.currency)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Send order on WhatsApp" variant="whatsapp" onPress={sendOrder} />
        <Button title="Copy order text" variant="secondary" onPress={copyOrder} />
        <Text style={[font.caption, { color: colors.textMuted, textAlign: 'center' }]}>
          WhatsApp opens with your order pre-filled. Nothing is sent until you tap send there.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: spacing.xs },
  field: { gap: spacing.sm },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notes: { minHeight: 88, textAlignVertical: 'top' },
  line: { gap: 2, paddingVertical: spacing.xs },
  lineTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.sm, paddingTop: spacing.md },
  actions: { gap: spacing.md },
});
