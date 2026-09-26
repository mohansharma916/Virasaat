import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export interface PickerItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  searchTerms?: string[];
}

interface SearchablePickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  placeholder?: string;
  items: PickerItem[];
  popularItems?: PickerItem[];
  selectedId?: string;
  onSelect: (item: PickerItem) => void;
  emptyMessage?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function SearchablePickerModal({
  visible,
  onClose,
  title,
  subtitle,
  placeholder = 'Search...',
  items,
  popularItems = [],
  selectedId,
  onSelect,
  emptyMessage = 'No results found',
}: SearchablePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) return items;

    return items.filter((item) => {
      if (item.title.toLowerCase().includes(clean)) return true;
      if (item.subtitle && item.subtitle.toLowerCase().includes(clean)) return true;
      if (item.badge && item.badge.toLowerCase().includes(clean)) return true;
      if (item.id.toLowerCase().includes(clean)) return true;
      if (item.searchTerms && item.searchTerms.some((t) => t.toLowerCase().includes(clean))) {
        return true;
      }
      return false;
    });
  }, [items, searchQuery]);

  const handleSelect = (item: PickerItem) => {
    onSelect(item);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderItem = ({ item }: { item: PickerItem }) => {
    const isSelected =
      selectedId &&
      (selectedId.toLowerCase() === item.id.toLowerCase() ||
        selectedId.toLowerCase() === item.title.toLowerCase());

    return (
      <Pressable
        onPress={() => handleSelect(item)}
        style={({ pressed }) => [
          styles.itemRow,
          isSelected && styles.itemRowSelected,
          pressed && styles.itemRowPressed,
        ]}
      >
        {item.icon ? (
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{item.icon}</Text>
          </View>
        ) : null}

        <View style={styles.itemContent}>
          <View style={styles.itemTitleRow}>
            <Text
              style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.badge ? (
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </View>

          {item.subtitle ? (
            <Text
              style={[
                styles.itemSubtitle,
                isSelected && styles.itemSubtitleSelected,
              ]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.trailingContainer}>
          {isSelected ? (
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          ) : (
            <View style={styles.uncheckCircle} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Backdrop tap to dismiss */}
        <Pressable style={styles.dismissOverlay} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{title}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{items.length}</Text>
                  </View>
                </View>
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
              </View>

              <Pressable
                onPress={handleClose}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={placeholder}
                  placeholderTextColor={colors.neutral.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearIcon}>✕</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Popular items chips row (shown when search query is empty) */}
            {popularItems.length > 0 && !searchQuery ? (
              <View style={styles.popularSection}>
                <Text style={styles.popularLabel}>POPULAR CHOICES</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularChipsList}
                >
                  {popularItems.map((popular) => {
                    const isSelected =
                      selectedId &&
                      (selectedId.toLowerCase() === popular.id.toLowerCase() ||
                        selectedId.toLowerCase() ===
                          popular.title.toLowerCase());

                    return (
                      <Pressable
                        key={popular.id}
                        onPress={() => handleSelect(popular)}
                        style={({ pressed }) => [
                          styles.chip,
                          isSelected && styles.chipSelected,
                          pressed && styles.chipPressed,
                        ]}
                      >
                        {popular.icon ? (
                          <Text style={styles.chipIcon}>{popular.icon}</Text>
                        ) : null}
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {popular.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* List */}
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              initialNumToRender={20}
              maxToRenderPerBatch={25}
              windowSize={10}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🔎</Text>
                  <Text style={styles.emptyTitle}>{emptyMessage}</Text>
                  <Text style={styles.emptySubtitle}>
                    Check your spelling or try searching for another name or code.
                  </Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 63, 52, 0.45)', // Tinted with deep forest brand color
    justifyContent: 'flex-end',
  },

  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },

  keyboardAvoid: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.85,
  },

  sheetContainer: {
    backgroundColor: colors.brand.ivory,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },

  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.neutral.border,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  headerTextCol: {
    flex: 1,
    marginRight: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    fontFamily: typography.fonts.playfair.semiBold,
    fontSize: 22,
    color: colors.primary.deepForest,
  },

  countBadge: {
    marginLeft: 10,
    backgroundColor: colors.brand.mint,
    borderWidth: 1,
    borderColor: colors.brand.sage,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  countBadgeText: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    color: colors.primary.forest,
  },

  subtitle: {
    marginTop: 4,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  closeButtonPressed: {
    opacity: 0.7,
  },

  closeIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.deepForest,
  },

  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  searchBar: {
    height: 48,
    backgroundColor: colors.neutral.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.7,
  },

  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 15,
    color: colors.neutral.textPrimary,
    height: '100%',
  },

  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  clearIcon: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral.textSecondary,
  },

  popularSection: {
    paddingBottom: 12,
  },

  popularLabel: {
    paddingHorizontal: 20,
    marginBottom: 8,
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.neutral.textMuted,
  },

  popularChipsList: {
    paddingHorizontal: 20,
    gap: 8,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 8,
  },

  chipSelected: {
    backgroundColor: colors.brand.mint,
    borderColor: colors.primary.forest,
  },

  chipPressed: {
    opacity: 0.8,
  },

  chipIcon: {
    fontSize: 15,
    marginRight: 6,
  },

  chipText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 13,
    color: colors.neutral.textPrimary,
  },

  chipTextSelected: {
    color: colors.primary.deepForest,
    fontFamily: typography.fonts.inter.semiBold,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  itemRowSelected: {
    backgroundColor: colors.brand.mint,
  },

  itemRowPressed: {
    backgroundColor: colors.brand.sage,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  iconText: {
    fontSize: 22,
  },

  itemContent: {
    flex: 1,
  },

  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },

  itemTitleSelected: {
    color: colors.primary.deepForest,
  },

  badgePill: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.neutral.white,
    borderWidth: 0.8,
    borderColor: colors.neutral.border,
  },

  badgeText: {
    fontFamily: typography.fonts.inter.medium,
    fontSize: 10,
    color: colors.neutral.textSecondary,
    textTransform: 'uppercase',
  },

  itemSubtitle: {
    marginTop: 2,
    fontFamily: typography.fonts.inter.regular,
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },

  itemSubtitleSelected: {
    color: colors.primary.forest,
  },

  trailingContainer: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkText: {
    color: colors.neutral.white,
    fontSize: 13,
    fontWeight: 'bold',
  },

  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
  },

  separator: {
    height: 1,
    backgroundColor: colors.neutral.border,
    opacity: 0.4,
    marginHorizontal: 8,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },

  emptyTitle: {
    fontFamily: typography.fonts.inter.semiBold,
    fontSize: 15,
    color: colors.neutral.textPrimary,
    marginBottom: 4,
  },

  emptySubtitle: {
    fontFamily: typography.fonts.inter.regular,
    fontSize: 13,
    color: colors.neutral.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
