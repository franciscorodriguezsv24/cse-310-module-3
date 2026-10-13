import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MAX_QUANTITY } from '@/state/cartReducer';
import { font, radius, spacing, useColors } from '@/theme';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Lowest value the minus button reaches. Use 0 in the cart so minus can remove the line. */
  min?: number;
  compact?: boolean;
}

/** Minus / value / plus control bounded by `min` and MAX_QUANTITY. */
export function QuantityStepper({ value, onChange, min = 1, compact = false }: QuantityStepperProps) {
  const colors = useColors();
  const size = compact ? 32 : 44;

  /** Renders one round +/- button. */
  const step = (delta: number, label: string, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={delta > 0 ? 'Increase quantity' : 'Decrease quantity'}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onChange(value + delta)}
      style={({ pressed }) => [
        styles.step,
        {
          width: size,
          height: size,
          backgroundColor: colors.surfaceMuted,
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.stepLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.row} accessibilityLabel={`Quantity ${value}`}>
      {step(-1, '−', value <= min)}
      <Text style={[compact ? font.body : font.heading, styles.value, { color: colors.text }]}>{value}</Text>
      {step(1, '+', value >= MAX_QUANTITY)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  step: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 20, fontWeight: '600', lineHeight: 22 },
  value: { minWidth: 28, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
