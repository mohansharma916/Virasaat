export type LegacyCategory =
  | 'DOCUMENTS'
  | 'INVESTMENTS'
  | 'MESSAGES'
  | 'VIDEOS'
  | 'OTHER';

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
