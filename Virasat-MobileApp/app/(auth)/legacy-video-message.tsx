import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import { File } from 'expo-file-system';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { haptics } from '@/src/utils/haptics';
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

  // Once the user has refused twice the OS won't prompt again; send them to Settings.
  const blocked =
    (cameraPermission && !cameraPermission.granted && !cameraPermission.canAskAgain) ||
    (microphonePermission && !microphonePermission.granted && !microphonePermission.canAskAgain);

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
      haptics.success();
      deleteRecording(cachedRecording.current);
      cachedRecording.current = null;
      const category = parseLegacyCategories(params.category)[0];

      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace({
        pathname: '/(auth)/legacy-category',
        params: {
          categories: params.categories ?? category ?? 'VIDEOS',
        },
      });
    } catch (requestError) {
      if (!alive.current || controller.signal.aborted) return;
      haptics.error();
      setError(getApiErrorMessage(requestError, 'We couldn’t save your video. It’s still here. Try again.'));
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
        <View style={styles.center} accessible accessibilityRole="progressbar" accessibilityLabel="Checking camera and microphone access">
          <ActivityIndicator color={colors.primary.forest} />
          <Text style={styles.loadingText}>Checking camera and microphone access…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permissionsGranted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScreenHeader onBack="default" />
        <ScrollView contentContainerStyle={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <AppIcon name="camera" size={28} color={colors.primary.deepForest} />
          </View>
          <Text style={styles.permissionTitle} accessibilityRole="header">Allow camera and microphone</Text>
          <Text style={styles.permissionText}>
            {blocked
              ? 'Access is turned off for Virasat. Open your phone’s settings, allow Camera and Microphone, then come back.'
              : 'Virasat needs your camera and microphone to record a private video message. The recording stays on your phone until you save it.'}
          </Text>
        </ScrollView>
        <ActionBar>
          {blocked ? (
            <Button title="Open settings" onPress={() => void Linking.openSettings()} />
          ) : (
            <Button title="Allow access" onPress={() => void requestAllPermissions()} />
          )}
          <Button title="Not now" variant="tertiary" onPress={() => router.back()} />
        </ActionBar>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader
        onBack={() => {
          if (recording) stopRecording();
          else router.back();
        }}
        backLabel={recording ? 'Stop recording and go back' : 'Go back'}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">
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
                <Pressable accessibilityRole="button"
                  accessibilityLabel="Stop recording"
                  onPress={stopRecording}
                  style={({ pressed }) => [
                    styles.stopButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.stopInner} />
                </Pressable>
              ) : (
                <Pressable accessibilityRole="button"
                  accessibilityLabel="Start recording"
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
              <AppIcon name="check" style={styles.previewSymbol} />
            </View>

            <Text style={styles.previewTitle}>
              Video recorded
            </Text>

            <Text style={styles.previewText}>
              Your message is ready to save. Recording stops after five minutes or about 24 MB, whichever comes first.
            </Text>

            <View style={styles.fileCard}>
              <AppIcon name="video" style={styles.fileIcon} />

              <View style={styles.fileContent}>
                <Text style={styles.fileTitle}>
                  Personal video message
                </Text>
                <Text style={styles.fileSubtitle}>
                  Ready to save securely
                </Text>
              </View>
            </View>

            <Button title="Record again" variant="secondary" size="md" onPress={handleRetake} disabled={saving} style={styles.retake} />
          </View>
        )}

        <InlineNotice
          tone="brand"
          title="Private by design"
          message="Your saved video is encrypted in your vault. Releasing it to your people is coming soon."
          style={styles.notice}
        />
      </ScrollView>

      <ActionBar>
        {saving ? (
          <Text style={styles.progressText} accessibilityLiveRegion="polite">
            Uploading · {progress}%{progress === 100 ? ', confirming' : ''}
          </Text>
        ) : null}
        {error ? <InlineNotice tone="danger" message={error} style={styles.errorNotice} /> : null}
        <Button
          title={recordedUri ? 'Save video message' : 'Record a video to save it'}
          onPress={() => void handleSave()}
          disabled={!recordedUri}
          loading={saving}
        />
      </ActionBar>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="You’ve reached your video limit"
        message={`Your ${currentPlan?.name ?? 'Starter'} plan includes ${videoLimit ?? 1} video message. Secure will include 10 and Family 50.`}
        benefits={['Up to 10 videos on Secure', 'Up to 50 videos on Family', 'Encrypted and private until release']}
        onCtaPress={() => router.push('/(auth)/plans' as never)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  permissionContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    marginTop: 20,
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title1,
    lineHeight: typography.lineHeights.title1,
    color: colors.primary.deepForest,
  },
  permissionText: {
    marginTop: 8,
    fontFamily: typography.fonts.inter.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.textSecondary,
  },
  retake: { marginTop: 16, alignSelf: 'stretch' },
  notice: { marginTop: 16 },
  progressText: {
    marginBottom: 8,
    fontFamily: typography.fonts.inter.medium,
    fontSize: typography.sizes.caption,
    color: colors.neutral.textSecondary,
  },
  errorNotice: { marginBottom: 8 },
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
    fontSize: 14,
    color: colors.neutral.textSecondary,
  },
  heading: {
    marginTop: 18,
    marginBottom: 14,
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
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },
  fileSubtitle: {
    marginTop: 3,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
