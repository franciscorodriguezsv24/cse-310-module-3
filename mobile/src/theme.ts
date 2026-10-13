import { useColorScheme } from 'react-native';

const light = {
  background: '#F7F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEAE2',
  text: '#1B1B1F',
  textMuted: '#6B6760',
  border: '#E2DCD2',
  accent: '#D9480F',
  accentText: '#FFFFFF',
  accentSoft: '#FDE8DE',
  success: '#2B8A3E',
  warning: '#B35C00',
  warningSoft: '#FFF1DC',
  whatsapp: '#1FA855',
};

const dark: typeof light = {
  background: '#121214',
  surface: '#1D1D21',
  surfaceMuted: '#28282D',
  text: '#F2F0EC',
  textMuted: '#A19D96',
  border: '#34343A',
  accent: '#FF7A45',
  accentText: '#1B1B1F',
  accentSoft: '#3A2419',
  success: '#69DB7C',
  warning: '#FFB454',
  warningSoft: '#3A2C16',
  whatsapp: '#25D366',
};

export type Colors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const font = {
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
} as const;

/** Returns the light or dark palette matching the device setting. */
export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
