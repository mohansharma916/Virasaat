export type LegacyCategory =
  | 'DOCUMENTS'
  | 'INVESTMENTS'
  | 'MESSAGES'
  | 'VIDEOS'
  | 'OTHER';

export type TrustedPersonSummary = {
  name: string;
  relationship: string;
  email: string;
};

export const LEGACY_CATEGORY_KEYS: LegacyCategory[] = [
  'DOCUMENTS',
  'INVESTMENTS',
  'MESSAGES',
  'VIDEOS',
  'OTHER',
];

export function parseLegacyCategories(value?: string | string[]) {
  const raw = Array.isArray(value) ? value.join(',') : value ?? '';

  return raw
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is LegacyCategory =>
      LEGACY_CATEGORY_KEYS.includes(item as LegacyCategory),
    );
}

/**
 * Lightweight in-memory completion store for the onboarding flow.
 * This avoids adding a new state-management dependency.
 *
 * Later, replace this with the real encrypted/backend vault state.
 */
const completedCategories = new Set<LegacyCategory>();
const listeners = new Set<() => void>();
let trustedPerson: TrustedPersonSummary | null = null;

export function markLegacyCategoryComplete(category: LegacyCategory) {
  completedCategories.add(category);
  listeners.forEach((listener) => listener());
}

export function isLegacyCategoryComplete(category: LegacyCategory) {
  return completedCategories.has(category);
}

export function getCompletedLegacyCategories(
  selected: LegacyCategory[],
) {
  return selected.filter((category) =>
    completedCategories.has(category),
  );
}

export function subscribeLegacyFlow(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function resetLegacyFlow() {
  completedCategories.clear();
  trustedPerson = null;
  listeners.forEach((listener) => listener());
}

/**
 * UI-only onboarding state. Replace with the recipient service once the
 * backend is introduced.
 */
export function setTrustedPersonSummary(
  person: TrustedPersonSummary,
) {
  trustedPerson = person;
  listeners.forEach((listener) => listener());
}

export function getTrustedPersonSummary() {
  return trustedPerson;
}
