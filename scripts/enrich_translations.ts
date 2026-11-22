import * as fs from 'fs';
import * as path from 'path';

const mockDataPath = path.resolve(__dirname, '../src/data/mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf8');

// 1. Categories update
const categoryReplacements: Record<string, { nameKg: string; nameEn: string }> = {
  "'cat-seasonal'": { nameKg: 'Мезгилдик меню 🍂', nameEn: 'Seasonal Specials 🍂' },
  "'cat-breakfast'": { nameKg: 'Эртең мененки тамак (күн бою)', nameEn: 'All Day Breakfasts' },
  "'cat-mains'": { nameKg: 'Ысык тамактар & Стейктер', nameEn: 'Hot Mains & Steaks' },
  "'cat-salads'": { nameKg: 'Салаттар & Боулдар', nameEn: 'Salads & Bowls' },
  "'cat-coffee'": { nameKg: 'Specialty Кофе', nameEn: 'Specialty Coffee' },
  "'cat-bar'": { nameKg: 'Бар & Суусундуктар', nameEn: 'Bar & Craft Drinks' },
  "'cat-desserts'": { nameKg: 'Десерттер & Бышырылган таттуулар', nameEn: 'Desserts & Bakery' },
};

for (const [catKey, trans] of Object.entries(categoryReplacements)) {
  const pattern = new RegExp(`(id:\\s*${catKey},\\s*name:\\s*['"][^'"]+['"],)`, 'g');
  content = content.replace(pattern, `$1\n    nameKg: '${trans.nameKg}',\n    nameEn: '${trans.nameEn}',`);
}

// 2. Menu Items translations dictionary
interface ItemTrans {
  nameKg: string;
  nameEn: string;
  descKg: string;
  descEn: string;
}

const itemTranslations: Record<string, ItemTrans> = {
  'item-1': {
    nameKg: 'Татымал кошулган Ашкабак Латтеси',
    nameEn: 'Spiced Pumpkin Latte',
    descKg: '100% арабика эспрессосу, табигый ашкабак пюреси, мускат жаңгагы, корица жана назик сүт көбүгү.',
    descEn: 'Aromatic 100% Arabica espresso with natural pumpkin purée, nutmeg, cinnamon, and velvety micro-foam milk.',
  },
  'item-2': {
    nameKg: 'Чычырканак жана розмарин чайы',
    nameEn: 'Sea Buckthorn & Rosemary Tea',
    descKg: 'Ысык-Көл чычырканагы, розмарин, табигый тоо балы, имбирь жана апельсин кесими.',
    descEn: 'Wild Issyk-Kul sea buckthorn berries infused with fresh rosemary, alpine flower honey, and sliced orange.',
  },
  'item-3': {
    nameKg: 'Алма пюреси менен өрдөк төшү',
    nameEn: 'Pan-Seared Duck Breast with Spiced Apple Purée',
    descKg: 'Алтын түстө куурулган назик өрдөк төшү, карагат демиглас соусу жана корица кошулган алма пюреси менен.',
    descEn: 'Crispy skin tender duck breast glazed with blackcurrant reduction, served over warm spiced apple purée.',
  },
  'item-4': {
    nameKg: 'Чычырканак курду кошулган бал торт',
    nameEn: 'Mountain Honey Cake with Sea Buckthorn Curd',
    descKg: 'Карагай балынан жасалган назик катмарлар, каймактуу крем жана чычырканактын кычкыл-таттуу даамы.',
    descEn: 'Traditional multi-layered honey sponge cake balanced with tangy alpine sea buckthorn curd.',
  },
  'item-5': {
    nameKg: 'Лосось жана авокадо менен Бенедикт',
    nameEn: 'Salmon & Avocado Eggs Benedict',
    descKg: 'Кытырак бриошь наны, аз туздалган лосось, авокадо, пашот жумурткасы жана назик голландез соусу.',
    descEn: 'Toasted butter brioche topped with cured salmon, hass avocado slices, poached farm egg, and silky hollandaise.',
  },
  'item-6': {
    nameKg: 'Фермердик быштактан сырниктер',
    nameEn: 'Farmer Cottage Cheese Syrniki',
    descKg: 'Накта фермердик быштактан жасалган назик сырниктер, малина соусу жана үй каймагы менен.',
    descEn: 'Golden cottage cheese pancakes served warm with fresh raspberry coulis and farm sour cream.',
  },
  'item-7': {
    nameKg: 'Чыгыш стилиндеги Шакшука',
    nameEn: 'Oriental Shakshuka with Feta',
    descKg: 'Бышкан помидор, таттуу калемпир жана зире соусунда бышырылган жумуртка, фета сыры жана жылуу пита наны менен.',
    descEn: 'Rich spiced tomato and sweet bell pepper stew baked with eggs, creamy feta, and warm flatbread.',
  },
  'item-8': {
    nameKg: 'Бадам креми кошулган круассан',
    nameEn: 'Almond Cream Croissant',
    descKg: 'Француз стилиндеги кытырак каттама круассан, жыпар жыттуу франжипан креми жана бадам желекчелери менен.',
    descEn: 'Crisp layered butter croissant filled with luscious almond frangipane and toasted almond flakes.',
  },
  'item-9': {
    nameKg: 'Стейк Рибай Прайм',
    nameEn: 'Prime Ribeye Steak',
    descKg: 'Чоктун отунда бышырылган ширелүү мрамор эт стейки. Розмарин майы жана деңиз тузу менен тартууланат.',
    descEn: 'Heavily marbled prime beef ribeye grilled over open charcoal, finished with rosemary garlic butter.',
  },
  'item-10': {
    nameKg: 'Трюфель соусу менен Филе Миньон',
    nameEn: 'Filet Mignon with Truffle Sauce',
    descKg: 'Өтө жумшак уй этинен жасалган филе, трюфель кошулган демиглас соусу жана куурулган спаржа менен.',
    descEn: 'Melt-in-your-mouth beef tenderloin cut paired with rich black truffle demi-glace and grilled asparagus.',
  },
  'item-11': {
    nameKg: 'Ысык-Көл жилингир балыгы чокто бышырылган',
    nameEn: 'Grilled Issyk-Kul Trout',
    descKg: 'Ысык-Көлдүн жаңы кармалган жилингир балыгы, тоо чөптөрү, лимон жана каймак соусу менен чокто какталып бышырылат.',
    descEn: 'Whole fresh Issyk-Kul trout grilled over charcoal with mountain herbs, lemon, and creamy dill reduction.',
  },
  'item-12': {
    nameKg: 'Жолборс креветкалары менен Том Ям',
    nameEn: 'Tom Yum with Tiger Prawns',
    descKg: 'Лемонграсс, галангал, кокос сүтү, жолборс креветкалары жана шиитаке козу карындары кошулган классикалык ачуу тай шорпосу.',
    descEn: 'Authentic spicy and sour Thai soup with tiger prawns, coconut milk, lemongrass, galangal, and jasmine rice.',
  },
  'item-13': {
    nameKg: 'Киноа жана авокадо менен жашыл боул',
    nameEn: 'Green Quinoa & Avocado Bowl',
    descKg: 'Былбыраган авокадо, киноа, эдамаме буурчагы, кытырак бадыраң, черри помидорлору жана кунжут-лайм соусу.',
    descEn: 'Fresh hass avocado, organic quinoa, edamame beans, baby spinach, cherry tomatoes, and sesame lime dressing.',
  },
  'item-14': {
    nameKg: 'Мрамор уй этинен тартар',
    nameEn: 'Marbled Beef Tartare',
    descKg: 'Жаш мрамор этинен колго тууралган тартар, каперстер, дижон кычысы, бөдөнө жумурткасы жана кытырак тосттор менен.',
    descEn: 'Hand-cut prime beef tartare with capers, shallots, Dijon mustard, quail egg yolk, and toasted sourdough.',
  },
  'item-15': {
    nameKg: 'Таттуу помидорлор менен Буррата',
    nameEn: 'Fresh Burrata with Sweet Heirloom Tomatoes',
    descKg: 'Жумшак каймактуу буррата сыры, күн нуруна бышкан помидорлор, жаңы базилик жана бальзамик крем.',
    descEn: 'Artisanal creamy burrata heart served with sweet ripe heirloom tomatoes, basil leaves, and aged balsamic glaze.',
  },
  'item-16': {
    nameKg: 'Кытырак баклажан салаты',
    nameEn: 'Crispy Eggplant Salad with Sweet Chili',
    descKg: 'Алтын сымал кытырак баклажандар, ширелүү помидорлор, кинза, күнжүт жана таттуу чили соусу.',
    descEn: 'Crispy wok-fried eggplants tossed with ripe tomatoes, fresh cilantro, toasted sesame seeds, and sweet chili dressing.',
  },
  'item-17': {
    nameKg: 'Флэт Уайт Specialty',
    nameEn: 'Specialty Flat White',
    descKg: 'Эки эселенген эспрессо жана жибек сымал жука көбүктүү сүт. Колумбия арабикасы, шоколад жана карамель ноталары менен.',
    descEn: 'Double shot of single-origin espresso folded with glossy, micro-foamed milk for a rich, intense coffee taste.',
  },
  'item-18': {
    nameKg: 'Чыпкаланган кофе Эфиопия Иргачеф',
    nameEn: 'Batch Filter Coffee Ethiopia Yirgacheffe',
    descKg: 'Batch Brew ыкмасында демделген жеңил чыпка кофе. Жасмин, бергамот жана цитрус даамдары бар.',
    descEn: 'Batch brew filter coffee showcasing delicate floral jasmine aroma, sweet bergamot, and peach notes.',
  },
  'item-19': {
    nameKg: 'Туздуу карамель кошулган Раф',
    nameEn: 'Salted Caramel Raf Coffee',
    descKg: 'Эспрессо, жумшак каймак жана колго жасалган туздуу карамель чогуу көбүртүлгөн назик десерттик кофе.',
    descEn: 'Velvety espresso steamed together with light cream and house-made salted caramel syrup.',
  },
  'item-20': {
    nameKg: 'Салтанаттуу Матча Латте',
    nameEn: 'Ceremonial Japanese Matcha Latte',
    descKg: 'Киотодон келген биринчи түшүмдүн салтанаттуу жашыл чай упасы, жыпар жыттуу сүт көбүгү менен.',
    descEn: 'First-harvest ceremonial grade Japanese green tea whisked with silky steamed milk.',
  },
  'item-21': {
    nameKg: 'Ала-Тоо Спритц коктейли',
    nameEn: 'Ala-Too Spritz Cocktail',
    descKg: 'Тоо чөптөрүнүн кордиалы, просекко, газдалган тоник жана грейпфрут кесими.',
    descEn: 'Alpine herbal cordial infused with Issyk-Kul botanicals, sparkling prosecco, and tonic with ruby grapefruit.',
  },
  'item-22': {
    nameKg: 'Түтүндүү Олд Фешн',
    nameEn: 'Smoky Old Fashioned',
    descKg: 'Премиум бурбон, ароматикалык ангостура биттери, кара камыш канты жана эмен түтүнү менен тартууланат.',
    descEn: 'Aged bourbon stirred with Angostura bitters and cane sugar, cold-smoked with oak woodchips under cloche.',
  },
  'item-23': {
    nameKg: 'Ысык-Көл бөрү карагат жана тархун лимонады',
    nameEn: 'Issyk-Kul Barberry & Tarragon Lemonade',
    descKg: 'Табигый бөрү карагат мөмөлөрүнүн ширеси, жаңы тархун чөбү, лайм жана муздак газдалган булак суусу.',
    descEn: 'House-made wild barberry cordial, fresh crushed tarragon, lime juice, and mountain sparkling water.',
  },
  'item-24': {
    nameKg: 'Алкоголсуз анар глитвейни',
    nameEn: 'Non-Alcoholic Pomegranate Mulled Wine',
    descKg: 'Табигый анар жана жүзүм ширеси, корица, бадьян, гвоздика жана апельсин кесимдери менен ысытылат.',
    descEn: 'Warm spiced beverage made from freshly pressed pomegranate juice, cloves, star anise, and citrus slices.',
  },
  'item-25': {
    nameKg: 'Сан-Себастьян Баск чизкейки',
    nameEn: 'Basque Cheesecake San Sebastian',
    descKg: 'Сырты кызарып күйгөн, ичи назик каймактуу эриген белгилүү испан десерти.',
    descEn: 'Iconic crustless baked cheesecake featuring caramelized rustic exterior and creamy molten center.',
  },
  'item-26': {
    nameKg: 'Малина кошулган мисте рулети',
    nameEn: 'Pistachio Roulade with Fresh Raspberries',
    descKg: 'Абадай жеңил мисте безеси, маскарпоне креми жана жаңы малина мөмөлөрү.',
    descEn: 'Airy pistachio meringue roll filled with light mascarpone mousse and fresh tart raspberries.',
  },
  'item-27': {
    nameKg: 'Карамель креми менен Шу',
    nameEn: 'Caramel Choux Pastry',
    descKg: 'Кытырак кракелин кабыгы бар кайнатма токоч, ичи туздуу карамель жана ваниль креми менен толтурулган.',
    descEn: 'Crisp craquelin-topped choux pastry puff filled with smooth vanilla cream and liquid salted caramel.',
  },
  'item-28': {
    nameKg: 'Балмуздак кошулган шоколад фонданы',
    nameEn: 'Molten Chocolate Lava Cake',
    descKg: 'Бельгия кара шоколадынан жасалган ысык кекс, ичинен эриген шоколад агып чыгат, ваниль балмуздагы менен.',
    descEn: 'Warm Belgian dark chocolate lava cake with molten center, paired with artisan Madagascar vanilla gelato.',
  },
};

for (const [itemId, trans] of Object.entries(itemTranslations)) {
  const itemPattern = new RegExp(`(id:\\s*['"]${itemId}['"],\\s*categoryId:[^\\n]+,\\s*name:\\s*['"][^'"]+['"],)`, 'g');
  content = content.replace(itemPattern, `$1\n    nameKg: '${trans.nameKg}',\n    nameEn: '${trans.nameEn}',`);

  const descPattern = new RegExp(`(id:\\s*['"]${itemId}['"][\\s\\S]*?description:\\s*['"][^'"]+['"],)`, 'g');
  content = content.replace(descPattern, `$1\n    descriptionKg: '${trans.descKg}',\n    descriptionEn: '${trans.descEn}',`);
}

// 3. Option groups & options translations
const optionGroupReplacements: Record<string, { titleKg: string; titleEn: string }> = {
  "'milk-choice'": { titleKg: 'Сүттү тандоо', titleEn: 'Milk Choice' },
  "'sweet-syrup'": { titleKg: 'Сироп тандоо', titleEn: 'Flavored Syrup' },
  "'tea-add'": { titleKg: 'Кошумчалар', titleEn: 'Add-ons' },
  "'duck-doneness'": { titleKg: 'Өрдөктү бышыруу даражасы', titleEn: 'Duck Doneness' },
  "'egg-style'": { titleKg: 'Жумуртка даярдоо', titleEn: 'Egg Style' },
  "'extra-salmon'": { titleKg: 'Кошумча эт / балык', titleEn: 'Extra Protein' },
  "'syrniki-sauce'": { titleKg: 'Соус тандоо', titleEn: 'Choice of Topping' },
  "'steak-doneness'": { titleKg: 'Бышыруу даражасы', titleEn: 'Meat Doneness' },
  "'steak-sauce'": { titleKg: 'Соус тандоо', titleEn: 'Choice of Sauce' },
  "'trout-side'": { titleKg: 'Гарнир тандоо', titleEn: 'Side Dish' },
  "'bowl-protein'": { titleKg: 'Протеин кошуу', titleEn: 'Add Protein' },
  "'cheesecake-topping'": { titleKg: 'Топпинг тандоо', titleEn: 'Sauce Topping' },
};

for (const [grpKey, trans] of Object.entries(optionGroupReplacements)) {
  const pattern = new RegExp(`(id:\\s*${grpKey},\\s*title:\\s*['"][^'"]+['"],)`, 'g');
  content = content.replace(pattern, `$1\n        titleKg: '${trans.titleKg}',\n        titleEn: '${trans.titleEn}',`);
}

const optionReplacements: Record<string, { nameKg: string; nameEn: string }> = {
  "'opt-oat'": { nameKg: 'Сулу сүтү Barista', nameEn: 'Barista Oat Milk' },
  "'opt-almond'": { nameKg: 'Бадам сүтү', nameEn: 'Almond Milk' },
  "'opt-coconut'": { nameKg: 'Кокос сүтү', nameEn: 'Coconut Milk' },
  "'opt-vanilla'": { nameKg: 'Мадагаскар ванили', nameEn: 'Madagascar Vanilla' },
  "'opt-caramel'": { nameKg: 'Туздуу карамель', nameEn: 'Salted Caramel' },
  "'opt-hazelnut'": { nameKg: 'Токой жаңгагы', nameEn: 'Roasted Hazelnut' },
  "'opt-honey'": { nameKg: 'Тоо балы', nameEn: 'Mountain Flower Honey' },
  "'opt-ginger'": { nameKg: 'Жаңы имбирь', nameEn: 'Fresh Ginger Root' },
  "'opt-mint'": { nameKg: 'Жалбыз жалбырактары', nameEn: 'Fresh Garden Mint' },
  "'opt-duck-med'": { nameKg: 'Medium (Ширелүү роза түс)', nameEn: 'Medium (Juicy & Tender)' },
  "'opt-duck-well'": { nameKg: 'Well Done (Толук бышкан)', nameEn: 'Well Done' },
  "'opt-poached'": { nameKg: 'Пашот жумурткасы', nameEn: 'Classic Poached Egg' },
  "'opt-fried'": { nameKg: 'Куурулган жумуртка', nameEn: 'Sunny Side Up' },
  "'opt-more-salmon'": { nameKg: 'Кошумча лосось (+50г)', nameEn: 'Extra Cured Salmon (+50g)' },
  "'opt-more-avocado'": { nameKg: 'Жарым авокадо', nameEn: 'Half Sliced Avocado' },
  "'opt-sourcream'": { nameKg: 'Фермердик каймак', nameEn: 'Farm Sour Cream' },
  "'opt-raspberry'": { nameKg: 'Малина соусу', nameEn: 'Raspberry Coulis' },
  "'opt-condensed'": { nameKg: 'Бышырылган коюлтулган сүт', nameEn: 'Dulce de Leche' },
  "'opt-med-rare'": { nameKg: 'Medium Rare (Ширелүү)', nameEn: 'Medium Rare (Juicy)' },
  "'opt-medium'": { nameKg: 'Medium (Орточо)', nameEn: 'Medium' },
  "'opt-med-well'": { nameKg: 'Medium Well (Күчтүү)', nameEn: 'Medium Well' },
  "'opt-peppercorn'": { nameKg: 'Мадагаскар калемпир соусу', nameEn: 'Peppercorn Sauce' },
  "'opt-truffle'": { nameKg: 'Сүттүү трюфель соусу', nameEn: 'Creamy Truffle Sauce' },
  "'opt-chimichurri'": { nameKg: 'Жаңы чимичурри соусу', nameEn: 'Fresh Herb Chimichurri' },
  "'opt-grilled-veg'": { nameKg: 'Чокто бышкан жашылчалар', nameEn: 'Grilled Garden Vegetables' },
  "'opt-potato-roast'": { nameKg: 'Розмарин кошулган жаш картошка', nameEn: 'Roasted Baby Potatoes' },
  "'opt-tofu'": { nameKg: 'Куурулган тофу', nameEn: 'Pan-Seared Organic Tofu' },
  "'opt-shrimp'": { nameKg: 'Жолборс креветкалары (+3 даана)', nameEn: 'Tiger Prawns (+3 pcs)' },
  "'opt-salmon-cube'": { nameKg: 'Лосось кубиктери (+50г)', nameEn: 'Diced Fresh Salmon (+50g)' },
  "'opt-berry-coulis'": { nameKg: 'Токой мөмөлөрүнүн соусу', nameEn: 'Wild Berry Coulis' },
  "'opt-warm-chocolate'": { nameKg: 'Ысык бельгия шоколады', nameEn: 'Warm Belgian Chocolate' },
  "'opt-salted-caramel'": { nameKg: 'Туздуу карамель', nameEn: 'Salted Caramel Drizzle' },
};

for (const [optKey, trans] of Object.entries(optionReplacements)) {
  const pattern = new RegExp(`(id:\\s*${optKey},\\s*name:\\s*['"][^'"]+['"],)`, 'g');
  content = content.replace(pattern, `$1\n          nameKg: '${trans.nameKg}',\n          nameEn: '${trans.nameEn}',`);
}

fs.writeFileSync(mockDataPath, content, 'utf8');
console.log('Successfully enriched src/data/mockData.ts with Kyrgyz and English translations!');
