import type { IconName } from '@/src/components/AppIcon';
import type { LegacyCategory } from '@/src/utils/legacy-flow';

export type LegacyCategoryInfo = {
  id: LegacyCategory;
  title: string;
  description: string;
  icon: IconName;
};

// One definition of the legacy categories for setup, the hub, review and Home.
export const LEGACY_CATEGORIES: LegacyCategoryInfo[] = [
  {
    id: 'DOCUMENTS',
    title: 'Important documents',
    description: 'Wills, property papers, insurance, certificates and other documents.',
    icon: 'document',
  },
  {
    id: 'INVESTMENTS',
    title: 'Investments and finance',
    description: 'Investments, accounts, policies and financial instructions.',
    icon: 'investment',
  },
  {
    id: 'MESSAGES',
    title: 'Personal messages',
    description: 'Written messages you’d like someone to receive.',
    icon: 'message',
  },
  {
    id: 'VIDEOS',
    title: 'Video messages',
    description: 'Personal videos recorded for your loved ones.',
    icon: 'video',
  },
  {
    id: 'OTHER',
    title: 'Other files',
    description: 'PDFs, images and other important files.',
    icon: 'folder',
  },
];

export function getLegacyCategory(id: LegacyCategory) {
  return LEGACY_CATEGORIES.find((category) => category.id === id) ?? LEGACY_CATEGORIES[LEGACY_CATEGORIES.length - 1];
}
