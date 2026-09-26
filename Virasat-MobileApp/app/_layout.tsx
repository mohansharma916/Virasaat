import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { fonts } from '@/src/theme/fonts';
import { store } from '@/src/store/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    InterRegular: fonts.inter.regular,
    InterMedium: fonts.inter.medium,
    InterSemiBold: fonts.inter.semiBold,
    InterBold: fonts.inter.bold,

    PlayfairRegular: fonts.playfair.regular,
    PlayfairSemiBold: fonts.playfair.semiBold,
    PlayfairBold: fonts.playfair.bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Provider store={store}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </Provider>
  );
}
