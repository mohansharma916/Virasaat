import { useState, useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { createLegacyItem, createItemRequestKey } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';

type Recipient = 'FAMILY' | 'SPOUSE' | 'CHILDREN' | 'OTHER';

const recipients = [
  {
    id: 'FAMILY' as Recipient,
    title: 'My Family',
  },
  {
    id: 'SPOUSE' as Recipient,
    title: 'Spouse / Partner',
  },
  {
    id: 'CHILDREN' as Recipient,
    title: 'My Children',
  },
  {
    id: 'OTHER' as Recipient,
    title: 'Someone Else',
  },
];

export default function LegacyMessageScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] =
    useState<Recipient | null>(null);
  const [saving, setSaving] = useState(false);
  const requestKey = useRef(createItemRequestKey());
  const busy = useRef(false);

  const handleSave = async () => {
    if (busy.current) return;
    if (!title.trim()) {
      Alert.alert(
        'Add a title',
        'Please give this message a title.',
      );
      return;
    }

    if (!message.trim()) {
      Alert.alert(
        'Write your message',
        'Please write something before saving.',
      );
      return;
    }


    try {
      busy.current = true;
      setSaving(true);
      const item = await createLegacyItem({
        requestKey: requestKey.current,
        type: 'TEXT',
        category: 'MESSAGES',
        title: 'Personal message',
        description: `Title: ${title.trim()}\nRecipient preference: ${recipient ?? 'Not assigned'}\n\n${message.trim()}`,
      });
      dispatch(addLegacyItem(item));


      router.replace('/(auth)/home');
    } catch (error) {
      Alert.alert('Unable to save message', getApiErrorMessage(error));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}

          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.brand}>
              VIRASAT
            </Text>
          </View>

          {/* Heading */}

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>
              PERSONAL MESSAGE
            </Text>

            <Text style={styles.title}>
              Say what matters.
            </Text>

            <Text style={styles.subtitle}>
              Write something you'd want someone
              important to you to receive when the
              time comes.
            </Text>
          </View>

          {/* Title */}

          <FieldLabel label="Message Title" />

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. For my family"
            placeholderTextColor={
              colors.neutral.textMuted
            }
            style={styles.input}
            maxLength={80}
          />

          {/* Message */}

          <FieldLabel label="Your Message" />

          <View style={styles.messageContainer}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message here..."
              placeholderTextColor={
                colors.neutral.textMuted
              }
              multiline
              textAlignVertical="top"
              style={styles.messageInput}
            />

            <Text style={styles.characterCount}>
              {message.length} characters
            </Text>
          </View>

          {/* Recipient */}

          <FieldLabel label="Who is this message for? (optional)" />

          <View style={styles.recipientContainer}>
            {recipients.map((item) => {
              const selected =
                recipient === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    setRecipient(item.id)
                  }
                  style={[
                    styles.recipientRow,
                    selected &&
                      styles.recipientSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      selected &&
                        styles.radioSelected,
                    ]}
                  >
                    {selected && (
                      <View
                        style={styles.radioDot}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.recipientText,
                      selected &&
                        styles.recipientTextSelected,
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Security */}

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Text style={styles.lock}>
                🔒
              </Text>
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Private until release
              </Text>

              <Text style={styles.securityText}>
                This message remains private until
                Virasat's verified release process
                is completed.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.button,
              pressed && !saving && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              {saving ? 'Saving…' : 'Save Message'}
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            You can edit or remove this message later.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({
  label,
}: {
  label: string;
}) {
  return (
    <Text style={styles.label}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },

  header: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 34,
    fontWeight: '300',
    color: colors.primary.deepForest,
  },

  brand: {
    fontFamily: typography.fonts.playfair.bold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.primary.deepForest,
  },

  progressContainer: {
    marginTop: 27,
    flexDirection: 'row',
    gap: 5,
  },

  progressItem: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.forest,
  },

  progressItemActive: {
    backgroundColor: colors.primary.forest,
  },

  heading: {
    marginTop: 35,
    marginBottom: 18,
  },

  eyebrow: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary.forest,
  },

  title: {
    marginTop: 7,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.primary.deepForest,
  },

  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12.5,
    lineHeight: 20,
    color: colors.neutral.textSecondary,
  },

  label: {
    marginTop: 16,
    marginBottom: 7,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 11,
    color: colors.neutral.textPrimary,
  },

  input: {
    height: 52,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },

  messageContainer: {
    minHeight: 190,
    borderRadius: 13,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
  },

  messageInput: {
    flex: 1,
    minHeight: 160,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.neutral.textPrimary,
  },

  characterCount: {
    alignSelf: 'flex-end',
    marginRight: 12,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 9,
    color: colors.neutral.textMuted,
  },

  recipientContainer: {
    borderRadius: 14,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    overflow: 'hidden',
  },

  recipientRow: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },

  recipientSelected: {
    backgroundColor: colors.brand.mint,
  },

  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.neutral.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioSelected: {
    borderColor: colors.primary.forest,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary.forest,
  },

  recipientText: {
    marginLeft: 11,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11.5,
    color: colors.neutral.textPrimary,
  },

  recipientTextSelected: {
    fontFamily: typography.fonts.inter.medium,
    color: colors.primary.deepForest,
  },

  securityCard: {
    marginTop: 20,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
  },

  securityIcon: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lock: {
    fontSize: 12,
  },

  securityContent: {
    flex: 1,
    marginLeft: 10,
  },

  securityTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10.5,
    color: colors.neutral.textPrimary,
  },

  securityText: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.neutral.textSecondary,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.white,
  },

  footer: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 10.5,
    color: colors.neutral.textMuted,
    textAlign: 'center',
  },
});
