import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatMoney } from '@/lib/pricing';
import { useCatalog } from '@/state/CatalogContext';
import { useCart } from '@/state/CartContext';
import { font, radius, spacing, useColors } from '@/theme';

/** Floating "View cart" bar shown on the menu while the cart has items. */
export function CartBar() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totals } = useCart();
  const { catalog } = useCatalog();
  if (totals.itemCount === 0 && totals.unavailableCount === 0) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push('/cart')}
        accessibilityRole="button"
        accessibilityLabel={`View cart, ${totals.itemCount} items, ${formatMoney(totals.subtotal, catalog.currency)}`}
        style={({ pressed }) => [styles.bar, { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={[styles.badge, { backgroundColor: colors.accentText }]}>
          <Text style={[styles.badgeText, { color: colors.accent }]}>{totals.itemCount}</Text>
        </View>
        <Text style={[font.heading, styles.label, { color: colors.accentText }]}>View cart</Text>
        <Text style={[font.heading, { color: colors.accentText, fontVariant: ['tabular-nums'] }]}>
          {formatMoney(totals.subtotal, catalog.currency)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 0 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  label: { flex: 1 },
});
