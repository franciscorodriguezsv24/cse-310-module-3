import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { CatalogProvider } from '@/state/CatalogContext';
import { CartProvider } from '@/state/CartContext';
import { LocationProvider } from '@/state/LocationContext';
import { useColors } from '@/theme';

/** Root layout: theme, global state providers and the stack navigator for all screens. */
export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = useColors();
  const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <CatalogProvider>
        <CartProvider>
          <LocationProvider>
            <Stack
              screenOptions={{
                headerBackButtonDisplayMode: 'minimal',
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="index" options={{ title: 'Menu', headerLargeTitle: true }} />
              <Stack.Screen name="product/[id]" options={{ title: '' }} />
              <Stack.Screen name="cart" options={{ title: 'Your cart' }} />
              <Stack.Screen name="summary" options={{ title: 'Order summary' }} />
              <Stack.Screen name="branch" options={{ title: 'Choose a branch', presentation: 'modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </LocationProvider>
        </CartProvider>
      </CatalogProvider>
    </ThemeProvider>
  );
}
