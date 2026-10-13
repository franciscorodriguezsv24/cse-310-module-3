import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { QuantityStepper } from '@/components/QuantityStepper';
import { describeSelections, findBranch } from '@/lib/catalog';
import { formatMoney } from '@/lib/pricing';
import { useCart } from '@/state/CartContext';
import { useCatalog } from '@/state/CatalogContext';
import type { ResolvedLine } from '@/state/cartReducer';
import { font, radius, spacing, useColors } from '@/theme';

/** Cart screen: edit quantities, remove items, see the subtotal and continue to checkout. */
export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, lines, totals, dispatch } = useCart();
  const { catalog } = useCatalog();
  const branch = findBranch(state.branchId, catalog);

  /** Removes every line the current branch cannot prepare. */
  const removeUnavailable = () => {
    for (const line of lines) if (!line.available) dispatch({ type: 'remove', key: line.key });
  };

  if (lines.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyEmoji}>🍱</Text>
        <Text style={[font.heading, { color: colors.text }]}>Your cart is empty</Text>
        <Button title="Browse the menu" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={lines}
        keyExtractor={(line) => line.key}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          totals.unavailableCount > 0 ? (
            <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
              <Text style={[font.body, { color: colors.warning }]}>
                {totals.unavailableCount === 1 ? '1 item is' : `${totals.unavailableCount} items are`} not available at{' '}
                {branch?.name ?? 'this branch'} and won’t be included.
              </Text>
              <Pressable accessibilityRole="button" onPress={removeUnavailable} hitSlop={8}>
                <Text style={[font.body, { color: colors.warning, fontWeight: '700' }]}>Remove them</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <CartRow
            line={item}
            onQuantity={(quantity) => dispatch({ type: 'setQuantity', key: item.key, quantity })}
            onRemove={() => dispatch({ type: 'remove', key: item.key })}
          />
        )}
      />

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={[font.heading, { color: colors.text }]}>Subtotal</Text>
          <Text style={[font.title, { color: colors.text, fontVariant: ['tabular-nums'] }]}>
            {formatMoney(totals.subtotal, catalog.currency)}
          </Text>
        </View>
        <Button title="Continue" disabled={totals.itemCount === 0} onPress={() => router.push('/summary')} />
      </View>
    </View>
  );
}

/** A single cart line with its options, price, quantity stepper and remove button. */
function CartRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: ResolvedLine;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  const { catalog } = useCatalog();
  const options = describeSelections(line.product, line.selections);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: line.available ? 1 : 0.55 },
      ]}
    >
      <Text style={styles.rowEmoji}>{line.product.emoji}</Text>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[font.heading, styles.flex, { color: colors.text }]}>{line.product.name}</Text>
          <Text style={[font.heading, { color: colors.text, fontVariant: ['tabular-nums'] }]}>
            {formatMoney(line.total, catalog.currency)}
          </Text>
        </View>
        {options.map((option) => (
          <Text key={option} style={[font.caption, { color: colors.textMuted }]}>
            {option}
          </Text>
        ))}
        {!line.available && <Text style={[font.caption, { color: colors.warning }]}>Unavailable at this branch</Text>}
        <View style={styles.rowActions}>
          <QuantityStepper value={line.quantity} min={0} compact onChange={onQuantity} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${line.product.name}`}
            onPress={onRemove}
            hitSlop={8}
          >
            <Text style={[font.body, { color: colors.accent, fontWeight: '600' }]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  emptyEmoji: { fontSize: 56 },
  notice: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowEmoji: { fontSize: 32 },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', gap: spacing.sm },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
