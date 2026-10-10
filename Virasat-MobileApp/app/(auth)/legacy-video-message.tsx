import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import { File } from 'expo-file-system';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { parseLegacyCategories } from '@/src/utils/legacy-flow';
import { uploadLegacyItem, createItemRequestKey } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';
import { useSubscription } from '@/src/store/subscription.slice';
import { PlanLimit } from '@/src/types/subscription.types';
import { UpgradeModal } from '@/src/components/UpgradeModal';

const MAX_DURATION_SECONDS = 5 * 60;
const MAX_RECORDING_BYTES = 24 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function deleteRecording(uri: string | null) {
  if (!uri) return;
  try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* Device cache may already be cleared. */ }
}

export default function LegacyVideoMessageScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.vault.items);
  const { isAtLimit, getLimit, currentPlan } = useSubscription();
  const params = useLocalSearchParams<{
    category?: string;
    categories?: string;
  }>();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const permissionsLoading = !cameraPermission || !microphonePermission;
  const permissionsGranted = Boolean(cameraPermission?.granted && microphonePermission?.granted);

  const requestAllPermissions = async () => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
    if (!microphonePermission?.granted) {
      await requestMicrophonePermission();
    }
  };

  const [recording, setRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const requestKey = useRef(createItemRequestKey());
  const busy = useRef(false);
  const alive = useRef(true);
  const cachedRecording = useRef<string | null>(null);
  const uploadController = useRef<AbortController | null>(null);

  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') cameraRef.current?.stopRecording();
    });
    return () => {
      alive.current = false;
      subscription.remove();
      uploadController.current?.abort();
      deleteRecording(cachedRecording.current);
    };
  }, []);

  const videoLimit = getLimit(PlanLimit.VIDEO_MESSAGES);
  const currentVideoCount = items.filter((item) => item.type === 'VIDEO').length;
  const reachedLimit = isAtLimit(PlanLimit.VIDEO_MESSAGES, currentVideoCount);

  const startRecording = async () => {
    if (reachedLimit) {
      setUpgradeModalVisible(true);
      return;
    }
    if (!cameraRef.current || recording || busy.current) {
      return;
    }

    setError('');
    deleteRecording(cachedRecording.current);
    cachedRecording.current = null;
    setRecordedUri(null);
    setRecording(true);

    try {
      const result = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_SECONDS,
        maxFileSize: MAX_RECORDING_BYTES,
      });

      if (result?.uri) {
        if (!alive.current) { deleteRecording(result.uri); return; }
        cachedRecording.current = result.uri;
        setRecordedUri(result.uri);
      }
    } catch {
      if (alive.current) setError('We could not record the video. Please try again.');
    } finally {
      if (alive.current) setRecording(false);
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const handleSave = async () => {
    if (!recordedUri || busy.current) {
      return;
    }

    if (reachedLimit) {
      setUpgradeModalVisible(true);
      return;
    }

    busy.current = true;
    setSaving(true);
    setError('');
    const controller = new AbortController();
    uploadController.current = controller;

    try {
      const recordingFile = new File(recordedUri);
      if (!recordingFile.exists || !recordingFile.size || recordingFile.size > MAX_UPLOAD_BYTES) {
        throw new Error('Videos must be no larger than 25 MB. Please record a shorter message.');
      }
      const isQuickTime = recordedUri.split('?')[0].toLowerCase().endsWith('.mov');
      const item = await uploadLegacyItem({
        requestKey: requestKey.current,
        type: 'VIDEO',
        category: 'VIDEOS',
        title: 'Video message',
        description: 'A video message was recorded on the owner’s device.',
        file: {
          uri: recordedUri,
          name: `virasat-video-${Date.now()}.${isQuickTime ? 'mov' : 'mp4'}`,
          mimeType: isQuickTime ? 'video/quicktime' : 'video/mp4',
        },
      }, { signal: controller.signal, onProgress: setProgress });
      if (!alive.current) return;
      dispatch(addLegacyItem(item));
      deleteRecording(cachedRecording.current);
      cachedRecording.current = null;
      const category = parseLegacyCategories(params.category)[0];

      router.replace({
        pathname: '/(auth)/legacy-category',
        params: {
          categories: params.categories ?? category ?? 'VIDEOS',
        },
      });
    } catch (requestError) {
      if (!alive.current || controller.signal.aborted) return;
      const msg = getApiErrorMessage(requestError, 'We could not save your video message. Please try again.');
      setError(msg);
      Alert.alert('Video save failed', msg);
    } finally {
      busy.current = false;
      if (alive.current) setSaving(false);
    }
  };

  const handleRetake = () => {
    if (busy.current) return;
    requestKey.current = createItemRequestKey();
    setError('');
    deleteRecording(cachedRecording.current);
    cachedRecording.current = null;
    setRecordedUri(null);
  };

  if (permissionsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary.forest} />
          <Text style={styles.loadingText}>
            Checking camera and audio permissions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permissionsGranted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {saving && <Text accessibilityLiveRegion="polite">{progress}% transferred — confirming storage</Text>}
        <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>

            <Text style={styles.brand}>VIRASAT</Text>
          </View>

          <View style={styles.permissionBlock}>
            <View style={styles.permissionIcon}>
              <Text style={styles.permissionSymbol}>▶</Text>
            </View>

            <Text style={styles.title}>
              Camera & microphone access needed
            </Text>

            <Text style={styles.subtitle}>
              Virasat needs access to your camera and microphone so you can
              record a private video message with audio for your loved ones.
            </Text>

            <Pressable
              onPress={requestAllPermissions}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Allow Access
              </Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                Go Back
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {saving && <Text accessibilityLiveRegion="polite">{progress}% transferred — confirming storage</Text>}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (recording) {
                stopRecording();
              } else {
                router.back();
              }
            }}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={styles.brand}>VIRASAT</Text>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>YOUR DIGITAL LEGACY</Text>

          <Text style={styles.title}>
            Leave a video message
          </Text>

          <Text style={styles.subtitle}>
            Say what you want your loved ones to hear.
            You can record a message of up to 5 minutes.
          </Text>
        </View>

        {!recordedUri ? (
          <View style={styles.cameraCard}>
            <View style={styles.cameraFrame}>
              <CameraView
                videoQuality="480p"
                ref={cameraRef}
                style={styles.camera}
                facing="front"
                mode="video"
              />

              <View style={styles.cameraOverlay}>
                {recording ? (
                  <View style={styles.recordingBadge}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>
                      Recording
                    </Text>
                  </View>
                ) : (
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyText}>
                      Ready to record
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cameraControls}>
              {recording ? (
                <Pressable
                  onPress={stopRecording}
                  style={({ pressed }) => [
                    styles.stopButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.stopInner} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={startRecording}
                  style={({ pressed }) => [
                    styles.recordButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.recordInner} />
                </Pressable>
              )}
            </View>

            <Text style={styles.controlHint}>
              {recording
                ? 'Tap the button to stop recording'
                : 'Tap the button to start recording'}
            </Text>
          </View>
        ) : (
          <View style={styles.previewCard}>
            <View style={styles.previewIcon}>
              <Text style={styles.previewSymbol}>✓</Text>
            </View>

            <Text style={styles.previewTitle}>
              Video recorded
            </Text>

            <Text style={styles.previewText}>
              Your message is ready to save. Recording stops after five minutes or about 24 MB, whichever comes first.
            </Text>

            <View style={styles.fileCard}>
              <Text style={styles.fileIcon}>▶</Text>

              <View style={styles.fileContent}>
                <Text style={styles.fileTitle}>
                  Personal video message
                </Text>
                <Text style={styles.fileSubtitle}>
                  Ready to save securely
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleRetake}
              style={styles.retakeButton}
            >
              <Text style={styles.retakeText}>
                Record Again
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.lock}>🔒</Text>
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Private by design
            </Text>

            <Text style={styles.securityText}>
              Your saved video is encrypted in your private vault. Automatic inheritance release is not available yet.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Pressable
          disabled={!recordedUri || saving}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.primaryButton,
            (!recordedUri || saving) && styles.primaryButtonDisabled,
            pressed && recordedUri && !saving && styles.buttonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                Save Video Message
              </Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </>
          )}
        </Pressable>
      </View>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="Preserve More Video Memories"
        message={`Your ${currentPlan?.name ?? 'Starter'} plan includes ${videoLimit ?? 1} video message. Upgrade to Secure (10 videos) or Family (50 videos) to record additional video messages.`}
        benefits={[
          'Up to 10 video messages on Secure',
          'Up to 50 video messages on Family',
          'Encrypted cloud backup for precious memories',
          'Controlled release to designated trusted persons',
        ]}
        ctaText="View Plans"
        onCtaPress={() => router.push('/(auth)/plans' as never)}
        secondaryCtaText="Not now"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 35,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
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
    backgroundColor: colors.neutral.border,
  },
  progressItemActive: {
    backgroundColor: colors.primary.forest,
  },
  heading: {
    marginTop: 18,
    marginBottom: 14,
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
    fontSize: 29,
    lineHeight: 38,
    color: colors.primary.deepForest,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.neutral.textSecondary,
  },
  cameraCard: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  cameraFrame: {
    height: 390,
    backgroundColor: colors.primary.deepForest,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(6,63,52,0.82)',
  },
  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.semantic.error,
    marginRight: 7,
  },
  recordingText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    color: colors.neutral.white,
  },
  readyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(6,63,52,0.72)',
  },
  readyText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 10,
    color: colors.neutral.white,
  },
  cameraControls: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
  },
  recordButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 4,
    borderColor: colors.primary.forest,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
  },
  recordInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.semantic.error,
  },
  stopButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 4,
    borderColor: colors.primary.forest,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
  },
  stopInner: {
    width: 25,
    height: 25,
    borderRadius: 6,
    backgroundColor: colors.semantic.error,
  },
  controlHint: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textSecondary,
  },
  previewCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
  },
  previewIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSymbol: {
    fontSize: 24,
    color: colors.primary.forest,
  },
  previewTitle: {
    marginTop: 14,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 22,
    color: colors.primary.deepForest,
  },
  previewText: {
    marginTop: 7,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.neutral.textSecondary,
  },
  fileCard: {
    width: '100%',
    marginTop: 18,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.brand.mint,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.brand.sage,
    overflow: 'hidden',
    fontSize: 16,
    color: colors.primary.forest,
    paddingTop: 10,
  },
  fileContent: {
    flex: 1,
    marginLeft: 11,
  },
  fileTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },
  fileSubtitle: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    color: colors.neutral.textSecondary,
  },
  retakeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retakeText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.forest,
  },
  securityCard: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    fontSize: 17,
  },
  securityContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 12,
    color: colors.primary.deepForest,
  },
  securityText: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.neutral.textSecondary,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.brand.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.forest,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 14,
    color: colors.neutral.white,
  },
  primaryButtonArrow: {
    marginLeft: 12,
    fontSize: 18,
    color: colors.neutral.white,
  },
  secondaryButton: {
    marginTop: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary.forest,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  error: {
    marginTop: 10,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.semantic.error,
  },
  permissionBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  permissionIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionSymbol: {
    fontSize: 25,
    color: colors.primary.forest,
  },
});
