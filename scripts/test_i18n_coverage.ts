import { CATEGORIES, MENU_ITEMS } from '../src/data/mockData';
import {
  DICTIONARY,
  getLocalizedName,
  getLocalizedDescription,
  getLocalizedCategoryName,
  getLocalizedOptionGroupName,
  getLocalizedOptionName,
  Language,
} from '../src/lib/i18n';

console.log('=== STARTING 3-LANGUAGE COMPREHENSIVE I18N AUDIT ===\n');

// 1. Audit Categories
console.log(`[1/5] Auditing ${CATEGORIES.length} Categories...`);
for (const cat of CATEGORIES) {
  if (!cat.name || !cat.nameKg || !cat.nameEn) {
    throw new Error(`Category ${cat.id} has missing translations! name: "${cat.name}", kg: "${cat.nameKg}", en: "${cat.nameEn}"`);
  }
  const ru = getLocalizedCategoryName(cat, 'ru');
  const kg = getLocalizedCategoryName(cat, 'kg');
  const en = getLocalizedCategoryName(cat, 'en');
  if (ru !== cat.name || kg !== cat.nameKg || en !== cat.nameEn) {
    throw new Error(`getLocalizedCategoryName mismatch for ${cat.id}`);
  }
}
console.log(`✓ All ${CATEGORIES.length} Categories passed 3-language check.\n`);

// 2. Audit Menu Items
console.log(`[2/5] Auditing ${MENU_ITEMS.length} Menu Items...`);
for (const item of MENU_ITEMS) {
  if (!item.name || !item.nameKg || !item.nameEn) {
    throw new Error(`Item ${item.id} has missing name translations!`);
  }
  if (!item.description || !item.descriptionKg || !item.descriptionEn) {
    throw new Error(`Item ${item.id} has missing description translations!`);
  }

  for (const lang of ['ru', 'kg', 'en'] as Language[]) {
    const locName = getLocalizedName(item, lang);
    const locDesc = getLocalizedDescription(item, lang);
    if (!locName || locName.trim().length === 0) {
      throw new Error(`Item ${item.id} localized name for "${lang}" is empty!`);
    }
    if (!locDesc || locDesc.trim().length === 0) {
      throw new Error(`Item ${item.id} localized description for "${lang}" is empty!`);
    }
  }

  // Check option groups
  if (item.optionGroups) {
    for (const group of item.optionGroups) {
      if (!group.title || !group.titleKg || !group.titleEn) {
        throw new Error(`Item ${item.id} option group ${group.id} has missing translations!`);
      }
      for (const opt of group.options) {
        if (!opt.name || !opt.nameKg || !opt.nameEn) {
          throw new Error(`Item ${item.id} option ${opt.id} has missing translations!`);
        }
      }
    }
  }
}
console.log(`✓ All ${MENU_ITEMS.length} Menu Items passed full 3-language audit.\n`);

// 3. Audit Dictionary completeness
console.log('[3/5] Auditing DICTIONARY coverage for RU, KG, EN...');
const ruKeys = Object.keys(DICTIONARY.ru) as (keyof typeof DICTIONARY.ru)[];
const kgKeys = Object.keys(DICTIONARY.kg) as (keyof typeof DICTIONARY.kg)[];
const enKeys = Object.keys(DICTIONARY.en) as (keyof typeof DICTIONARY.en)[];

console.log(`Dictionary contains ${ruKeys.length} localization keys per language.`);

for (const key of ruKeys) {
  if (!DICTIONARY.kg[key] || DICTIONARY.kg[key].trim().length === 0) {
    throw new Error(`Missing Kyrgyz translation for key: "${key}"`);
  }
  if (!DICTIONARY.en[key] || DICTIONARY.en[key].trim().length === 0) {
    throw new Error(`Missing English translation for key: "${key}"`);
  }
}
console.log('✓ All dictionary keys are 100% covered across Russian, Kyrgyz, and English.\n');

// 4. Sample verification output
console.log('[4/5] Sample output across 3 languages:');
const sampleItem = MENU_ITEMS[8]; // Prime Ribeye
console.log(`- Item ID: ${sampleItem.id}`);
console.log(`  [RU]: ${getLocalizedName(sampleItem, 'ru')} — ${getLocalizedDescription(sampleItem, 'ru').slice(0, 50)}...`);
console.log(`  [KG]: ${getLocalizedName(sampleItem, 'kg')} — ${getLocalizedDescription(sampleItem, 'kg').slice(0, 50)}...`);
console.log(`  [EN]: ${getLocalizedName(sampleItem, 'en')} — ${getLocalizedDescription(sampleItem, 'en').slice(0, 50)}...`);

console.log('\n[5/5] Checking Fallback Behavior...');
const dummyItem = { name: 'Кастомный напиток' };
const fallbackKg = getLocalizedName(dummyItem, 'kg');
const fallbackEn = getLocalizedName(dummyItem, 'en');
if (fallbackKg !== 'Кастомный напиток' || fallbackEn !== 'Кастомный напиток') {
  throw new Error(`Fallback failed! Expected "Кастомный напиток", got "${fallbackKg}"`);
}
console.log('✓ Fallback behavior verified: unlocalized items safely return primary name.\n');

console.log('=== ALL 3-LANGUAGE I18N CHECKS PASSED WITH 100% COVERAGE ===');
