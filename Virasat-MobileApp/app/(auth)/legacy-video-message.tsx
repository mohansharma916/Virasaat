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
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ActionBar } from '@/src/components/ActionBar';
import { AppIcon } from '@/src/components/AppIcon';
import { Button } from '@/src/components/Button';
import { InlineNotice } from '@/src/components/InlineNotice';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { runWithSystemUi } from '@/src/components/SessionGate';
import { haptics } from '@/src/utils/haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { parseLegacyCategories } from '@/src/utils/legacy-flow';
import { MAX_VIDEO_BYTES, MAX_VIDEO_LABEL } from '@/src/utils/upload-limits';
import { createUploadThumbnail, deleteThumbnail } from '@/src/utils/thumbnails';
import { uploadLegacyItem, createItemRequestKey } from '@/src/api/vault.api';
import { getApiErrorMessage } from '@/src/utils/api-error';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { addLegacyItem } from '@/src/store/vault.slice';
import { useSubscription } from '@/src/store/subscription.slice';
import { PlanLimit } from '@/src/types/subscription.types';
import { UpgradeModal } from '@/src/components/UpgradeModal';

const MAX_DURATION_SECONDS = 5 * 60;
// Leave headroom under the upload limit for the container's final metadata.
const MAX_RECORDING_BYTES = MAX_VIDEO_BYTES - 2 * 1024 * 1024;

type SelectedVideo = {
  uri: string;
  source: 'recorded' | 'picked';
  name?: string | null;
  mimeType?: string | null;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function deleteRecording(uri: string | null) {
  if (!uri) return;
  try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* Device cache may already be cleared. */ }
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => { instance.loop = false; });
  return (
    <VideoView
      player={player}
      style={styles.previewVideo}
      nativeControls
      contentFit="contain"
      accessibilityLabel="Preview of your video message"
    />
  );
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [video, setVideo] = useState<SelectedVideo | null>(null);
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

  // Counts from the start time, so a slow tick never drifts the shown duration.
  useEffect(() => {
    if (!recording) return;
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds(Math.min(MAX_DURATION_SECONDS, Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [recording]);

  const videoLimit = getLimit(PlanLimit.VIDEO_MESSAGES);
  const currentVideoCount = items.filter((item) => item.type === 'VIDEO').length;
  const reachedLimit = isAtLimit(PlanLimit.VIDEO_MESSAGES, currentVideoCount);

  // Only recordings live in our cache; picked videos belong to the user's library.
  const clearVideo = () => {
    deleteRecording(cachedRecording.current);
    cachedRecording.current = null;
    setVideo(null);
  };

  const startRecording = async () => {
    if (reachedLimit) {
      setUpgradeModalVisible(true);
      return;
    }
    if (!cameraRef.current || recording || busy.current) {
      return;
    }

    setError('');
    clearVideo();
    setRecording(true);

    try {
      const result = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_SECONDS,
        maxFileSize: MAX_RECORDING_BYTES,
      });

      if (result?.uri) {
        if (!alive.current) { deleteRecording(result.uri); return; }
        cachedRecording.current = result.uri;
        setVideo({ uri: result.uri, source: 'recorded' });
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

  const pickVideo = async () => {
    if (reachedLimit) {
      setUpgradeModalVisible(true);
      return;
    }
    if (recording || busy.current) return;
    setError('');
    try {
      const result = await runWithSystemUi(() =>
        ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsMultipleSelection: false }),
      );
      if (result.canceled || !alive.current) return;
      const asset = result.assets[0];
      const size = asset.fileSize ?? (() => { try { return new File(asset.uri).size; } catch { return 0; } })();
      if (size > MAX_VIDEO_BYTES) {
        haptics.warning();
        setError(`That video is larger than ${MAX_VIDEO_LABEL}. Choose a shorter video.`);
        return;
      }
      clearVideo();
      requestKey.current = createItemRequestKey();
      setVideo({ uri: asset.uri, source: 'picked', name: asset.fileName, mimeType: asset.mimeType });
    } catch {
      if (alive.current) setError('We couldn’t open your videos. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!video || busy.current) {
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
    let thumbnailUri: string | null = null;

    try {
      const videoFile = new File(video.uri);
      if (!videoFile.exists || !videoFile.size || videoFile.size > MAX_VIDEO_BYTES) {
        throw new Error(`Videos must be no larger than ${MAX_VIDEO_LABEL}. Please choose or record a shorter message.`);
      }
      const isQuickTime = video.mimeType === 'video/quicktime'
        || (video.name ?? video.uri).split('?')[0].toLowerCase().endsWith('.mov');
      const extension = isQuickTime ? 'mov' : 'mp4';
      thumbnailUri = await createUploadThumbnail(video.uri, 'video/mp4');
      const item = await uploadLegacyItem({
        requestKey: requestKey.current,
        type: 'VIDEO',
        category: 'VIDEOS',
        title: 'Video message',
        description: video.source === 'recorded'
          ? 'A video message was recorded on the owner’s device.'
          : 'A video message was uploaded from the owner’s device.',
        file: {
          uri: video.uri,
          name: `virasat-video-${Date.now()}.${extension}`,
          mimeType: isQuickTime ? 'video/quicktime' : 'video/mp4',
        },
        thumbnailUri,
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
      deleteThumbnail(thumbnailUri);
      busy.current = false;
      if (alive.current) setSaving(false);
    }
  };

  const handleRetake = () => {
    if (busy.current) return;
    requestKey.current = createItemRequestKey();
    setError('');
    clearVideo();
  };

  const renderCamera = () => {
    if (permissionsLoading) {
      return (
        <View style={styles.cameraPlaceholder} accessible accessibilityRole="progressbar" accessibilityLabel="Checking camera and microphone access">
          <ActivityIndicator color={colors.neutral.white} />
          <Text style={styles.placeholderText}>Checking camera and microphone access…</Text>
        </View>
      );
    }
    if (!permissionsGranted) {
      return (
        <View style={styles.cameraPlaceholder}>
          <View style={styles.permissionIcon}>
            <AppIcon name="camera" size={28} color={colors.primary.deepForest} />
          </View>
          <Text style={styles.placeholderTitle}>Allow camera and microphone</Text>
          <Text style={styles.placeholderText}>
            {blocked
              ? 'Access is turned off for Virasat. Open your phone’s settings, allow Camera and Microphone, then come back.'
              : 'To record here, Virasat needs your camera and microphone. The recording stays on your phone until you save it.'}
          </Text>
          {blocked ? (
            <Button title="Open settings" size="md" onPress={() => void Linking.openSettings()} style={styles.placeholderButton} />
          ) : (
            <Button title="Allow access" size="md" onPress={() => void requestAllPermissions()} style={styles.placeholderButton} />
          )}
        </View>
      );
    }
    return (
      <>
        <CameraView
          videoQuality="480p"
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mode="video"
        />

        <View style={styles.cameraOverlay}>
          {recording ? (
            <View
              style={styles.recordingBadge}
              accessible
              accessibilityLabel={`Recording, ${elapsedSeconds} seconds of ${MAX_DURATION_SECONDS / 60} minutes`}
            >
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                Recording · {formatDuration(elapsedSeconds)} / {formatDuration(MAX_DURATION_SECONDS)}
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
      </>
    );
  };

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
            Record a message of up to 5 minutes, or upload a video
            from your phone (up to {MAX_VIDEO_LABEL}).
          </Text>
        </View>

        {!video ? (
          <>
            <View style={styles.cameraCard}>
              <View style={styles.cameraFrame}>
                {renderCamera()}
              </View>

              {permissionsGranted ? (
                <>
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
                      ? `${elapsedSeconds} ${elapsedSeconds === 1 ? 'second' : 'seconds'} recorded · tap to stop`
                      : 'Tap the button to start recording'}
                  </Text>
                </>
              ) : null}
            </View>

            {!recording ? (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Button
                  title="Upload a video from your phone"
                  variant="secondary"
                  icon={<AppIcon name="upload" size={20} color={colors.primary.forest} />}
                  onPress={() => void pickVideo()}
                  accessibilityHint={`Choose an MP4 or MOV video up to ${MAX_VIDEO_LABEL}`}
                />
              </>
            ) : null}
          </>
        ) : (
          <View style={styles.previewCard}>
            <View style={styles.previewFrame}>
              <VideoPreview key={video.uri} uri={video.uri} />
            </View>

            <Text style={styles.previewTitle}>
              {video.source === 'recorded' ? `Video recorded · ${formatDuration(elapsedSeconds)}` : 'Video selected'}
            </Text>

            <Text style={styles.previewText}>
              Play it back to check it, then save it to your vault.
            </Text>

            <Button
              title={video.source === 'recorded' ? 'Record again' : 'Choose a different video'}
              variant="secondary"
              size="md"
              onPress={video.source === 'recorded' ? handleRetake : () => void pickVideo()}
              disabled={saving}
              style={styles.retake}
            />
            {video.source === 'picked' ? (
              <Button title="Record instead" variant="tertiary" size="md" onPress={handleRetake} disabled={saving} />
            ) : null}
          </View>
        )}

        <InlineNotice
          tone="brand"
          title="Private by design"
          message="Your saved video is encrypted in your vault. Assign it to a trusted person to decide who receives it."
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
          title={video ? 'Save video message' : 'Record or upload a video to save it'}
          onPress={() => void handleSave()}
          disabled={!video}
          loading={saving}
        />
      </ActionBar>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="You’ve reached your video limit"
        message={`Your ${currentPlan?.name ?? 'Starter'} plan includes ${videoLimit ?? 1} video message. Secure includes 10 and Family 50.`}
        benefits={['Up to 10 videos on Secure', 'Up to 50 videos on Family', 'Encrypted and private until release']}
        onCtaPress={() => router.push('/(auth)/plans' as never)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: typography.sizes.title2,
    color: colors.neutral.white,
  },
  placeholderText: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: typography.fonts.inter.regular,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.86)',
  },
  placeholderButton: { marginTop: 18, alignSelf: 'stretch' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.neutral.border },
  dividerText: {
    marginHorizontal: 12,
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },
  previewFrame: {
    width: '100%',
    height: 320,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.primary.deepForest,
  },
  previewVideo: { width: '100%', height: '100%' },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.sage,
    alignItems: 'center',
    justifyContent: 'center',
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
    // Digits keep the same width, so the badge does not jitter each second.
    fontVariant: ['tabular-nums'],
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
  buttonPressed: {
    opacity: 0.82,
  },
});
