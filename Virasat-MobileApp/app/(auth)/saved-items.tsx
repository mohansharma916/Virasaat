import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BottomNavBar } from '@/src/components/BottomNavBar';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { refreshVaultData } from '@/src/store/vault.slice';
import { parseLegacyCategories, LEGACY_CATEGORY_KEYS } from '@/src/utils/legacy-flow';
import { vaultScreenStyles as styles } from '@/src/theme/vault-screen';

export default function SavedItemsScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = parseLegacyCategories(params.category)[0];
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.vault);
  const [refreshError, setRefreshError] = useState('');
  const refresh = useCallback(() => {
    setRefreshError('');
    void dispatch(refreshVaultData()).unwrap().catch(() => setRefreshError('Could not refresh saved items. Check your connection and retry.'));
  }, [dispatch]);
  useFocusEffect(refresh);
  const visibleItems = items.filter((item) => !category || item.category === category);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.link}>‹ Back</Text></Pressable>
        <Text style={styles.heading}>{category ? `${category.charAt(0)}${category.slice(1).toLowerCase()}` : 'Your saved items'}</Text>
        <Text style={styles.text}>Open a saved record to read its contents, edit it, or export its file.</Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push({ pathname: '/(auth)/legacy-category', params: { categories: category ?? LEGACY_CATEGORY_KEYS.join(','), add: 'true' } } as never)}>
          <Text style={styles.buttonText}>Add an item</Text>
        </Pressable>
        {category === 'VIDEOS' && <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/legacy-video-message' as never)}><Text style={styles.link}>Record a video message</Text></Pressable>}
        {status === 'loading' && <ActivityIndicator />}
        {refreshError ? <View><Text style={styles.error} accessibilityRole="alert">{refreshError}</Text><Pressable onPress={refresh} accessibilityRole="button"><Text style={styles.link}>Retry</Text></Pressable></View> : null}
        {status === 'ready' && visibleItems.length === 0 && <Text style={styles.text}>No saved items in this category yet.</Text>}
        {visibleItems.map((item) => (
          <Pressable key={item.id} style={styles.card} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => router.push({ pathname: '/(auth)/saved-item', params: { id: item.id } } as never)}>
            <Text style={styles.label}>{item.title}</Text>
            <Text style={styles.text}>{item.category} · {item.type}</Text>
            <Text style={styles.text}>Updated {new Date(item.updatedAt).toLocaleDateString()}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNavBar activeTab="vault" />
    </SafeAreaView>
  );
}
