import * as fs from 'fs';
import * as path from 'path';

const mockDataPath = path.resolve(__dirname, '../src/data/mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf8');

const remainingGroupReplacements: Record<string, { titleKg: string; titleEn: string }> = {
  "'extra-shots'": { titleKg: 'Кошумча', titleEn: 'Extra Add-ons' },
  "'toast-bread'": { titleKg: 'Нан тандоо', titleEn: 'Bread Choice' },
  "'toast-addons'": { titleKg: 'Тостко кошумчалар', titleEn: 'Toast Add-ons' },
  "'shakshuka-cheese'": { titleKg: 'Сыр тандоо', titleEn: 'Cheese Choice' },
  "'doneness'": { titleKg: 'Бышыруу даражасы', titleEn: 'Meat Doneness' },
  "'steak-garnish'": { titleKg: 'Стейкке гарнир', titleEn: 'Steak Side Dish' },
  "'caesar-protein'": { titleKg: 'Салаттын негизи', titleEn: 'Salad Base Protein' },
  "'fw-milk'": { titleKg: 'Сүттү тандоо', titleEn: 'Milk Choice' },
  "'cap-size'": { titleKg: 'Порция көлөмү', titleEn: 'Serving Size' },
  "'matcha-temp'": { titleKg: 'Сунуу түрү', titleEn: 'Serving Style' },
};

for (const [grpKey, trans] of Object.entries(remainingGroupReplacements)) {
  const pattern = new RegExp(`(id:\\s*${grpKey},\\s*title:\\s*['"][^'"]+['"],)(?!\\s*titleKg:)`, 'g');
  content = content.replace(pattern, `$1\n        titleKg: '${trans.titleKg}',\n        titleEn: '${trans.titleEn}',`);
}

const remainingOptionReplacements: Record<string, { nameKg: string; nameEn: string }> = {
  "'opt-extra-espresso'": { nameKg: 'Кошумча эспрессо шоту', nameEn: 'Extra Espresso Shot' },
  "'opt-marshmallow'": { nameKg: 'Маршмеллоу', nameEn: 'Mini Marshmallows' },
  "'b-tartin'": { nameKg: 'Кол өнөрчүлүк тартини', nameEn: 'Artisan Sourdough Tartine' },
  "'b-brioche'": { nameKg: 'Каймактуу бриошь', nameEn: 'Butter Brioche' },
  "'b-gf'": { nameKg: 'Глютенсиз нан', nameEn: 'Gluten-Free Bread' },
  "'add-salmon'": { nameKg: 'Аз туздалган лосось (+50г)', nameEn: 'Cured Salmon (+50g)' },
  "'add-bacon'": { nameKg: 'Кытырак бекон', nameEn: 'Crispy Bacon' },
  "'sc-caramel'": { nameKg: 'Үй шартындагы туздуу карамель', nameEn: 'House-made Salted Caramel' },
  "'sc-berry'": { nameKg: 'Токой мөмөлөрүнүн соусу', nameEn: 'Mixed Berry Coulis' },
  "'sc-sourcream'": { nameKg: 'Коюу фермердик каймак', nameEn: 'Thick Farm Sour Cream' },
  "'sh-feta'": { nameKg: 'Грек фетасы (+40г)', nameEn: 'Greek Feta Cheese (+40g)' },
  "'sh-strac'": { nameKg: 'Каймактуу страчателла', nameEn: 'Creamy Stracciatella' },
  "'dn-rare'": { nameKg: 'Rare (Ширелүү кызыл)', nameEn: 'Rare' },
  "'dn-mrare'": { nameKg: 'Medium Rare (Роза ширелүү)', nameEn: 'Medium Rare' },
  "'dn-med'": { nameKg: 'Medium (Орточо бышкан)', nameEn: 'Medium' },
  "'dn-well'": { nameKg: 'Well Done (Толук бышкан)', nameEn: 'Well Done' },
  "'gr-mash'": { nameKg: 'Трюфель кошулган пюре', nameEn: 'Truffle Potato Mash' },
  "'gr-veg'": { nameKg: 'Гриль жашылчалары (цукини, черри, спаржа)', nameEn: 'Grilled Vegetables (zucchini, cherry, asparagus)' },
  "'gr-fries'": { nameKg: 'Розмарин кошулган фри картошкасы', nameEn: 'Rosemary French Fries' },
  "'cp-chicken'": { nameKg: 'Гриль тоок эти', nameEn: 'Grilled Free-Range Chicken' },
  "'cp-shrimp'": { nameKg: 'Жолборс креветкалары (+5 даана)', nameEn: 'Tiger Prawns (+5 pcs)' },
  "'cp-salmon'": { nameKg: 'Аз туздалган лосось', nameEn: 'Cured Atlantic Salmon' },
  "'fwm-oat'": { nameKg: 'Сулу сүтү Barista', nameEn: 'Barista Oat Milk' },
  "'fwm-coconut'": { nameKg: 'Кокос сүтү', nameEn: 'Coconut Milk' },
  "'fwm-almond'": { nameKg: 'Бадам сүтү', nameEn: 'Almond Milk' },
  "'cs-std'": { nameKg: 'Стандарт (220 мл)', nameEn: 'Standard (220 ml)' },
  "'cs-large'": { nameKg: 'Чоң (350 мл)', nameEn: 'Large (350 ml)' },
  "'mt-hot'": { nameKg: 'Ысык (65°C)', nameEn: 'Hot (65°C)' },
  "'mt-ice'": { nameKg: 'Муздак муз менен (Iced)', nameEn: 'Iced Cold' },
  "'ct-choc'": { nameKg: 'Ысык бельгия шоколады', nameEn: 'Warm Belgian Chocolate' },
  "'ct-berry'": { nameKg: 'Токой малинасынын соусу', nameEn: 'Wild Raspberry Coulis' },
};

for (const [optKey, trans] of Object.entries(remainingOptionReplacements)) {
  const pattern = new RegExp(`(id:\\s*${optKey},\\s*name:\\s*['"][^'"]+['"],)(?!\\s*nameKg:)`, 'g');
  content = content.replace(pattern, `$1\n          nameKg: '${trans.nameKg}',\n          nameEn: '${trans.nameEn}',`);
}

fs.writeFileSync(mockDataPath, content, 'utf8');
console.log('Successfully enriched remaining option groups and options!');
