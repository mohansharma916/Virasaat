import { countries, getEmojiFlag, type TCountryCode } from 'countries-list';
import ISO6391 from 'iso-639-1';

export interface CountryItem {
  code: string;
  name: string;
  native: string;
  flag: string;
  searchTerms: string[];
}

export interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
  searchTerms: string[];
}

export const POPULAR_COUNTRY_CODES = [
  'IN', // India
  'US', // United States
  'GB', // United Kingdom
  'CA', // Canada
  'AU', // Australia
  'AE', // UAE
  'SG', // Singapore
  'DE', // Germany
];

export const POPULAR_LANGUAGE_CODES = [
  'en', // English
  'hi', // Hindi
  'es', // Spanish
  'fr', // French
  'de', // German
  'ar', // Arabic
  'bn', // Bengali
  'mr', // Marathi
  'ta', // Tamil
  'te', // Telugu
  'gu', // Gujarati
  'pa', // Punjabi
  'ur', // Urdu
];

function safeEmojiFlag(code: string): string {
  try {
    return getEmojiFlag(code as TCountryCode);
  } catch {
    if (!code || code.length !== 2) return '🌐';
    return code
      .toUpperCase()
      .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  }
}

// Cached country list sorted alphabetically by English name
const ALL_COUNTRIES: CountryItem[] = Object.entries(countries)
  .map(([code, item]) => {
    const flag = safeEmojiFlag(code);
    const searchTerms = [
      item.name,
      item.native,
      ...(item.alias || []),
      code,
    ].filter(Boolean);

    return {
      code,
      name: item.name,
      native: item.native || item.name,
      flag,
      searchTerms,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const POPULAR_COUNTRIES: CountryItem[] = POPULAR_COUNTRY_CODES
  .map((code) => ALL_COUNTRIES.find((c) => c.code === code))
  .filter((c): c is CountryItem => Boolean(c));

// Cached language list sorted alphabetically by English name
const allLanguageCodes = ISO6391.getAllCodes();
const ALL_LANGUAGES: LanguageItem[] = ISO6391.getLanguages(allLanguageCodes)
  .map((item) => ({
    code: item.code,
    name: item.name,
    nativeName: item.nativeName,
    searchTerms: [item.name, item.nativeName, item.code].filter(Boolean),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const POPULAR_LANGUAGES: LanguageItem[] = POPULAR_LANGUAGE_CODES
  .map((code) => ALL_LANGUAGES.find((l) => l.code === code))
  .filter((l): l is LanguageItem => Boolean(l));

export function getAllCountries(): CountryItem[] {
  return ALL_COUNTRIES;
}

export function getPopularCountries(): CountryItem[] {
  return POPULAR_COUNTRIES;
}

export function findCountry(queryOrCodeOrName?: string | null): CountryItem | undefined {
  if (!queryOrCodeOrName) return undefined;
  const target = queryOrCodeOrName.trim().toLowerCase();
  return (
    ALL_COUNTRIES.find((c) => c.code.toLowerCase() === target) ||
    ALL_COUNTRIES.find((c) => c.name.toLowerCase() === target) ||
    ALL_COUNTRIES.find((c) => c.native.toLowerCase() === target) ||
    ALL_COUNTRIES.find((c) => c.searchTerms.some((t) => t.toLowerCase() === target))
  );
}

export function filterCountries(query: string): CountryItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return ALL_COUNTRIES;
  return ALL_COUNTRIES.filter((item) =>
    item.searchTerms.some((term) => term.toLowerCase().includes(clean))
  );
}

export function getAllLanguages(): LanguageItem[] {
  return ALL_LANGUAGES;
}

export function getPopularLanguages(): LanguageItem[] {
  return POPULAR_LANGUAGES;
}

export function findLanguage(queryOrCodeOrName?: string | null): LanguageItem | undefined {
  if (!queryOrCodeOrName) return undefined;
  const target = queryOrCodeOrName.trim().toLowerCase();
  return (
    ALL_LANGUAGES.find((l) => l.code.toLowerCase() === target) ||
    ALL_LANGUAGES.find((l) => l.name.toLowerCase() === target) ||
    ALL_LANGUAGES.find((l) => l.nativeName.toLowerCase() === target) ||
    ALL_LANGUAGES.find((l) => l.searchTerms.some((t) => t.toLowerCase() === target))
  );
}

export function filterLanguages(query: string): LanguageItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return ALL_LANGUAGES;
  return ALL_LANGUAGES.filter((item) =>
    item.searchTerms.some((term) => term.toLowerCase().includes(clean))
  );
}
