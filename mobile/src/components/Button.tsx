import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { font, radius, spacing, useColors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'whatsapp';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
}

/** Full-width themed button with primary, secondary and WhatsApp styles. */
export function Button({ title, variant = 'primary', disabled, ...rest }: ButtonProps) {
  const colors = useColors();
  const background = {
    primary: colors.accent,
    secondary: colors.surfaceMuted,
    whatsapp: colors.whatsapp,
  }[variant];
  const textColor = variant === 'secondary' ? colors.text : variant === 'whatsapp' ? '#FFFFFF' : colors.accentText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}
      {...rest}
    >
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...font.heading },
});
