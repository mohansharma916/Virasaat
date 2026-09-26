import type { ReactNode } from 'react';
import { Stack } from 'expo-router';
import { SessionGate } from '@/src/components/SessionGate';

// Gate the navigator's content, not the navigator itself. Removing Stack during
// a route change resets its navigation state and can trigger a render loop.
function renderSessionLayout({ children }: { children: ReactNode }) {
  return <SessionGate>{children}</SessionGate>;
}

export default function AccountLayout() {
  return <Stack screenOptions={{ headerShown: false }} layout={renderSessionLayout} />;
}
