import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Code2 } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const screens = [
  {
    number: '01',
    title: 'Welcome',
    route: '/(auth)/welcome',
  },
  {
    number: '02',
    title: 'Signup',
    route: '/(auth)/signup',
  },
  {
    number: '03',
    title: 'Verify',
    route: '/(auth)/verify',
  },
  {
    number: '04',
    title: 'Security',
    route: '/(auth)/security',
  },
  {
    number: '05',
    title: 'Profile',
    route: '/(auth)/profile',
  },
  {
    number: '06',
    title: 'Legacy Setup',
    route: '/(auth)/legacy-setup',
  },
  {
    number: '07',
    title: 'Legacy Category',
    route: '/(auth)/legacy-category',
  },
  {
    number: '08',
    title: 'Legacy Documents',
    route: '/(auth)/legacy-documents',
  },
  {
    number: '09',
    title: 'Legacy Investments',
    route: '/(auth)/legacy-investments',
  },
  {
    number: '10',
    title: 'Investment Details',
    route: '/(auth)/legacy-investment-details',
  },
  {
    number: '11',
    title: 'Legacy Message',
    route: '/(auth)/legacy-message',
  },
  {
    number: '12',
    title: 'Legacy Video Message',
    route: '/(auth)/legacy-video-message',
  },
  {
    number: '13',
    title: 'Trusted Person Intro',
    route: '/(auth)/trusted-person-intro',
  },
  {
    number: '14',
    title: 'Trusted Person',
    route: '/(auth)/trusted-person',
  },
  {
    number: '15',
    title: 'Trusted Person Review',
    route: '/(auth)/trusted-person-review',
  },
  {
    number: '16',
    title: 'Trusted Person Confirmation',
    route: '/(auth)/trusted-person-confirmation',
  },
  {
    number: '17',
    title: 'Trusted Person Success',
    route: '/(auth)/trusted-person-success',
  },
  {
    number: '18',
    title: 'Legacy Review',
    route: '/(auth)/legacy-review',
  },
  {
    number: '19',
    title: 'Release Rules',
    route: '/(auth)/release-rules',
  },
  {
    number: '20',
    title: 'Check-in Preferences',
    route: '/(auth)/check-in-preferences',
  },
  {
    number: '21',
    title: 'Login',
    route: '/(auth)/login',
  },
  {
    number: '22',
    title: 'Dashboard',
    route: '/(auth)/home',
  },
  {
    number: '23',
    title: 'Plan Comparison',
    route: '/(auth)/plans',
  },
  {
    number: '24',
    title: 'My Plan & Subscription',
    route: '/(auth)/my-plan',
  },
];

export default function DevScreen() {
  const openScreen = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Code2 size={22}  />
          </View>

          <Text style={styles.eyebrow}>DEVELOPMENT ONLY</Text>

          <Text style={styles.title}>Screen Navigator</Text>

          <Text style={styles.description}>
            Open any Virasat screen directly during development.
          </Text>
        </View>

        {/* Screen List */}
        <View style={styles.list}>
          {screens.map((screen) => (
            <TouchableOpacity
              key={screen.number}
              style={styles.screenCard}
              onPress={() => openScreen(screen.route)}
              activeOpacity={0.75}
            >
              <View style={styles.numberContainer}>
                <Text style={styles.container}>{screen.number}</Text>
              </View>

              <View style={styles.screenInfo}>
                <Text style={styles.screenTitle}>{screen.title}</Text>
                <Text style={styles.route}>{screen.route}</Text>
              </View>

              <ChevronRight
                size={19}
                // color={colors.neutral}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.warning}>
          Temporary development screen — remove before production.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 28,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    // backgroundColor: colors.surface,
    borderWidth: 1,
    // borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  eyebrow: {
    // ...typography.caption,
    // color: colors.primary,
    letterSpacing: 1.8,
    marginBottom: 7,
  },

  title: {
    // ...typography.h1,
    // color: colors.text,
  },

  description: {
    // ...typography.body,
    // color: colors.muted,
    marginTop: 8,
    lineHeight: 22,
  },

  list: {
    gap: 10,
  },

  screenCard: {
    minHeight: 68,
    // backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    // borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  numberContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

 

  screenInfo: {
    flex: 1,
  },

  screenTitle: {
   
    fontWeight: '600',
  },

  route: {
    // ...typography.caption,
    // color: colors.muted,
    marginTop: 3,
  },

  warning: {
    // ...typography.caption,
    // color: colors.muted,
    // textAlign: 'center',
    // marginTop: 24,
  },
});