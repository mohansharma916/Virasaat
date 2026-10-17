import { Tabs } from 'expo-router';

import { BottomNavBar } from '@/src/components/BottomNavBar';
import { colors } from '@/src/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.brand.ivory },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="saved-items" />
      <Tabs.Screen name="people" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
