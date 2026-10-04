import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ChevronRight, Code2 } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const screens = [
  { number: '01', title: 'Welcome', route: '/(auth)/welcome' },
  { number: '02', title: 'Signup', route: '/(auth)/signup' },
  { number: '03', title: 'Login', route: '/(auth)/login' },
  { number: '04', title: 'Verify Email', route: '/(auth)/verify' },
  { number: '05', title: 'Forgot Password', route: '/(auth)/forgot-password' },
  { number: '06', title: 'Security & PIN', route: '/(auth)/security' },
  { number: '07', title: 'Profile Settings', route: '/(auth)/profile' },
  { number: '08', title: 'Legacy Setup', route: '/(auth)/legacy-setup' },
  { number: '09', title: 'Legacy Category', route: '/(auth)/legacy-category' },
  { number: '10', title: 'Legacy Documents', route: '/(auth)/legacy-documents' },
  { number: '11', title: 'Legacy Investments', route: '/(auth)/legacy-investments' },
  { number: '12', title: 'Investment Details', route: '/(auth)/legacy-investment-details' },
  { number: '13', title: 'Legacy Message', route: '/(auth)/legacy-message' },
  { number: '14', title: 'Legacy Video Message', route: '/(auth)/legacy-video-message' },
  { number: '15', title: 'Trusted Person Intro', route: '/(auth)/trusted-person-intro' },
  { number: '16', title: 'Trusted Person Form', route: '/(auth)/trusted-person' },
  { number: '17', title: 'Trusted Person Review', route: '/(auth)/trusted-person-review' },
  { number: '18', title: 'Trusted Person Confirmation', route: '/(auth)/trusted-person-confirmation' },
  { number: '19', title: 'Trusted Person Success', route: '/(auth)/trusted-person-success' },
  { number: '20', title: 'Trusted Persons Directory', route: '/(auth)/people' },
  { number: '21', title: 'Legacy Review', route: '/(auth)/legacy-review' },
  { number: '22', title: 'Item Assignment Settings', route: '/(auth)/item-settings' },
  { number: '23', title: 'Release Rules', route: '/(auth)/release-rules' },
  { number: '24', title: 'Check-in Preferences', route: '/(auth)/check-in-preferences' },
  { number: '25', title: 'Dashboard (Home)', route: '/(auth)/home' },
  { number: '26', title: 'Plan Comparison', route: '/(auth)/plans' },
  { number: '27', title: 'My Plan & Billing', route: '/(auth)/my-plan' },
  { number: '28', title: 'Delete Account', route: '/(auth)/delete-account' },
];

export default function DevScreen() {
  if (!__DEV__) return <Redirect href="/(auth)/welcome" />;

  const openScreen = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Code2 size={22} color={colors.primary.deepForest} />
          </View>

          <Text style={styles.eyebrow}>DEVELOPMENT ONLY</Text>
          <Text style={styles.title}>Screen Navigator</Text>
          <Text style={styles.description}>
            Direct access to all 28 Virasat mobile screens for testing and verification.
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
                <Text style={styles.numberText}>{screen.number}</Text>
              </View>

              <View style={styles.screenInfo}>
                <Text style={styles.screenTitle}>{screen.title}</Text>
                <Text style={styles.route}>{screen.route}</Text>
              </View>

              <ChevronRight size={18} color={colors.neutral.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.warning}>
          Development utility only — hidden in production builds.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 24,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primary.forest,
    marginBottom: 6,
  },

  title: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 26,
    color: colors.neutral.textPrimary,
  },

  description: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    color: colors.neutral.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },

  list: {
    gap: 8,
  },

  screenCard: {
    minHeight: 64,
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  numberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  numberText: {
    fontFamily: typography.fonts.inter.bold,
    fontSize: 12,
    color: colors.primary.deepForest,
  },

  screenInfo: {
    flex: 1,
  },

  screenTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.textPrimary,
  },

  route: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
    marginTop: 2,
  },

  warning: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});