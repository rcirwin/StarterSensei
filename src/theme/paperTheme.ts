import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.tertiary,
    surface: colors.surface,
    background: colors.background,
    error: colors.error,
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onSurface: colors.onSurface,
    onBackground: colors.onBackground,
    outline: colors.border,
  },
}; 