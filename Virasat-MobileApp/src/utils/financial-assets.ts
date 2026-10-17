import type { IconName } from '@/src/components/AppIcon';

export type AssetTypeId = 'INVESTMENT' | 'INSURANCE' | 'BANK' | 'PROPERTY' | 'OTHER';

// `label` doubles as the saved item's title, so the list can show the type
// without storing provider details in plain metadata.
export const ASSET_TYPES: { id: AssetTypeId; label: string; icon: IconName; providerHint: string; referenceLabel: string }[] = [
  { id: 'INVESTMENT', label: 'Investment', icon: 'investment', providerHint: 'e.g. HDFC Mutual Fund, Zerodha', referenceLabel: 'Folio or account number' },
  { id: 'INSURANCE', label: 'Insurance policy', icon: 'shield', providerHint: 'e.g. LIC, HDFC Life', referenceLabel: 'Policy number' },
  { id: 'BANK', label: 'Bank account', icon: 'bank', providerHint: 'e.g. State Bank of India', referenceLabel: 'Account number (last 4 digits is enough)' },
  { id: 'PROPERTY', label: 'Property', icon: 'home', providerHint: 'e.g. flat, land or house', referenceLabel: 'Address or registration number' },
  { id: 'OTHER', label: 'Other financial asset', icon: 'folder', providerHint: 'Who holds it', referenceLabel: 'Reference number' },
];
