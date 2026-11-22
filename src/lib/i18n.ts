export type Language = 'ru' | 'kg' | 'en';

export interface Translations {
  // Шапка и общие элементы
  readonly tableLabel: string;
  readonly callWaiter: string;
  readonly bill: string;
  readonly cart: string;
  readonly emptyCart: string;
  readonly currency: string;
  readonly searchPlaceholder: string;
  readonly allCategories: string;
  readonly nothingFound: string;
  readonly nothingFoundDesc: string;
  readonly backToHall: string;

  // Фильтры
  readonly filterAll: string;
  readonly filterHit: string;
  readonly filterNew: string;
  readonly filterDiscount: string;
  readonly filterVegetarian: string;
  readonly filterSpicy: string;

  // Погода и Happy Hours
  readonly weatherRecommend: string;
  readonly sunnyWeather: string;
  readonly rainWeather: string;
  readonly coldWeather: string;
  readonly happyHoursBadge: string;
  readonly happyHoursDesc: string;

  // AI Сомелье
  readonly aiSommelierTitle: string;
  readonly aiSommelierSubtitle: string;
  readonly aiSommelierButton: string;
  readonly aiInputPlaceholder: string;
  readonly aiSend: string;
  readonly aiQuickQ1: string;
  readonly aiQuickQ2: string;
  readonly aiQuickQ3: string;
  readonly aiQuickQ4: string;
  readonly aiWelcome: string;
  readonly aiThinking: string;
  readonly addToCart: string;
  readonly inCart: string;

  // Апсейл в корзине
  readonly upsellTitle: string;
  readonly upsellSubtitle: string;

  // Оформление заказа и оплата
  readonly checkoutTitle: string;
  readonly subtotal: string;
  readonly serviceFee: string;
  readonly total: string;
  readonly submitOrder: string;
  readonly payOnline: string;
  readonly payElqr: string;
  readonly orderAccepted: string;
  readonly cookingOrder: string;
  readonly orderReady: string;
  readonly orderServed: string;
  readonly orderReceipt: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  ru: {
    tableLabel: 'Столик',
    callWaiter: 'Официант',
    bill: 'Счет',
    cart: 'Корзина',
    emptyCart: 'Ваша корзина пуста',
    currency: 'сом',
    searchPlaceholder: 'Поиск блюд, кофе, десертов...',
    allCategories: 'Все категории',
    nothingFound: 'Ничего не найдено',
    nothingFoundDesc: 'Попробуйте изменить поисковый запрос или сбросить фильтры',
    backToHall: 'В зал',

    filterAll: 'Все блюда',
    filterHit: '🔥 Хиты',
    filterNew: '✨ Новинки',
    filterDiscount: '🏷️ Скидки',
    filterVegetarian: '🌱 Веган',
    filterSpicy: '🌶️ Острое',

    weatherRecommend: 'Шеф рекомендует к погоде',
    sunnyWeather: 'Солнечно и тепло в Бишкеке — идеальное время для освежающих напитков!',
    rainWeather: 'Дождливо за окном — согрейтесь ароматным кофе и горячими блюдами!',
    coldWeather: 'Свежий горный бриз — рекомендуем согревающий чай с горными травами!',
    happyHoursBadge: 'Happy Hours 🌙 -20%',
    happyHoursDesc: 'Вечерняя скидка 20% на свежую выпечку и десерты!',

    aiSommelierTitle: 'AI-Сомелье Айпери',
    aiSommelierSubtitle: 'Ваш цифровой гастрономический консьерж в AURA',
    aiSommelierButton: 'AI-Гид по меню',
    aiInputPlaceholder: 'Например: что посоветуете к кофе без сахара?',
    aiSend: 'Спросить',
    aiQuickQ1: 'Что взять к кофе? ☕',
    aiQuickQ2: 'Сытное горячее блюдо 🍲',
    aiQuickQ3: 'Без сахара и глютена 🌱',
    aiQuickQ4: 'Традиционное фирменное ⭐',
    aiWelcome: 'Здравствуйте! Я Айпери — ваш умный AI-сомелье. Расскажите, какое у вас настроение или что вы любите, и я подберу идеальные блюда и напитки!',
    aiThinking: 'Айпери подбирает идеальное сочетание...',
    addToCart: 'В корзину',
    inCart: 'В корзине',

    upsellTitle: 'Шеф-повар рекомендует к заказу',
    upsellSubtitle: 'Гармоничные дополнения, которые сделают трапезу идеальной',

    checkoutTitle: 'Оформление заказа',
    subtotal: 'Сумма блюд',
    serviceFee: 'Обслуживание (15%)',
    total: 'Итого к оплате',
    submitOrder: 'Подтвердить и отправить на кухню',
    payOnline: 'Оплатить онлайн (ELQR / MBANK)',
    payElqr: 'Оплата по ELQR НБКР',
    orderAccepted: 'Принят кухней',
    cookingOrder: 'Готовится поваром',
    orderReady: 'Готов к выдаче',
    orderServed: 'Подан гостю',
    orderReceipt: 'Чек ЭККМ',
  },

  kg: {
    tableLabel: 'Үстөл',
    callWaiter: 'Официант',
    bill: 'Эсеп',
    cart: 'Себет',
    emptyCart: 'Себетиңиз бош',
    currency: 'сом',
    searchPlaceholder: 'Тамактарды, кофени, таттууларды издөө...',
    allCategories: 'Бардык бөлүмдөр',
    nothingFound: 'Эч нерсе табылган жок',
    nothingFoundDesc: 'Издөө сөзүн өзгөртүп же чыпкаларды баштапкы абалга келтириңиз',
    backToHall: 'Залга кайтуу',

    filterAll: 'Бардык тамактар',
    filterHit: '🔥 Хиттер',
    filterNew: '✨ Жаңылыктар',
    filterDiscount: '🏷️ Арзандатуу',
    filterVegetarian: '🌱 Вегетариандык',
    filterSpicy: '🌶️ Ачуу',

    weatherRecommend: 'Ашпозчу аба ырайына карата сунуштайт',
    sunnyWeather: 'Бишкекте жылуу күн — сергитүүчү суусундуктардын мезгили!',
    rainWeather: 'Жамгырлуу аба ырайы — жыпар жыттуу кофе жана ысык тамактан ырахат алыңыз!',
    coldWeather: 'Тоодон соккон салкын жел — тоо чөптөрүнөн жасалган ысык чай сунуштайбыз!',
    happyHoursBadge: 'Happy Hours 🌙 -20%',
    happyHoursDesc: 'Кечки 20% арзандатуу жаңы бышырылган таттууларга!',

    aiSommelierTitle: 'AI-Сомелье Айпери',
    aiSommelierSubtitle: 'AURA кафесиндеги сиздин санариптик жардамчыңыз',
    aiSommelierButton: 'AI-Меню гиди',
    aiInputPlaceholder: 'Мисалы: кофеге кошуп эмне тандасам болот?',
    aiSend: 'Суроо',
    aiQuickQ1: 'Кофеге эмне алсам болот? ☕',
    aiQuickQ2: 'Тоюмдуу ысык тамак 🍲',
    aiQuickQ3: 'Кантсыз жана глютенсиз 🌱',
    aiQuickQ4: 'Салттуу фирмалык тамак ⭐',
    aiWelcome: 'Саламатсызбы! Мен Айпери — сиздин акылдуу AI-сомельеңизмин. Бүгүн кандай тамак каалайсыз? Мен сиз үчүн эң даамдуусун тандап берем!',
    aiThinking: 'Айпери сизге ылайыктуу тамакты тандоодо...',
    addToCart: 'Себетке кошуу',
    inCart: 'Себетте',

    upsellTitle: 'Ашпозчу сунуштайт',
    upsellSubtitle: 'Тамагыңызды толуктоочу эң сонун даамдар',

    checkoutTitle: 'Буйрутманы тариздөө',
    subtotal: 'Тамактардын баасы',
    serviceFee: 'Тейлөө акысы (15%)',
    total: 'Жалпы төлөм',
    submitOrder: 'Ырастоо жана ашканага жөнөтүү',
    payOnline: 'Онлайн төлөө (ELQR / MBANK)',
    payElqr: 'Улуттук ELQR менен төлөө',
    orderAccepted: 'Кабыл алынды',
    cookingOrder: 'Даярдалууда',
    orderReady: 'Даяр болду',
    orderServed: 'Берилди',
    orderReceipt: 'ЭККМ чеги',
  },

  en: {
    tableLabel: 'Table',
    callWaiter: 'Call Waiter',
    bill: 'Bill',
    cart: 'Cart',
    emptyCart: 'Your cart is empty',
    currency: 'som',
    searchPlaceholder: 'Search dishes, coffee, desserts...',
    allCategories: 'All Categories',
    nothingFound: 'Nothing found',
    nothingFoundDesc: 'Try changing your search query or clear the active filters',
    backToHall: 'Back to Hall',

    filterAll: 'All Dishes',
    filterHit: '🔥 Popular',
    filterNew: '✨ New',
    filterDiscount: '🏷️ Deals',
    filterVegetarian: '🌱 Vegan',
    filterSpicy: '🌶️ Spicy',

    weatherRecommend: "Chef's Weather Recommendation",
    sunnyWeather: 'Sunny day in Bishkek — perfect time for refreshing craft lemonades!',
    rainWeather: 'Rainy outside — warm up with our specialty coffee and hearty dishes!',
    coldWeather: 'Fresh mountain breeze — we recommend soothing Issyk-Kul herbal tea!',
    happyHoursBadge: 'Happy Hours 🌙 -20%',
    happyHoursDesc: 'Evening 20% discount on all fresh pastries and desserts!',

    aiSommelierTitle: 'AI Sommelier Aiperi',
    aiSommelierSubtitle: 'Your digital culinary concierge at AURA Bishkek',
    aiSommelierButton: 'AI Menu Guide',
    aiInputPlaceholder: 'E.g.: what pairs best with filter coffee?',
    aiSend: 'Ask',
    aiQuickQ1: 'What pairs with coffee? ☕',
    aiQuickQ2: 'Hearty warm meal 🍲',
    aiQuickQ3: 'Sugar-free & gluten-free 🌱',
    aiQuickQ4: 'Signature local dish ⭐',
    aiWelcome: "Hello! I am Aiperi, your AI sommelier. Tell me your mood or dietary preferences, and I'll find the perfect pairings from our kitchen!",
    aiThinking: 'Aiperi is choosing the best pairings...',
    addToCart: 'Add to Cart',
    inCart: 'In Cart',

    upsellTitle: 'Chef Recommends to Complete Your Order',
    upsellSubtitle: 'Carefully chosen pairings for an exquisite dining experience',

    checkoutTitle: 'Checkout Order',
    subtotal: 'Items Subtotal',
    serviceFee: 'Service Fee (15%)',
    total: 'Total to Pay',
    submitOrder: 'Confirm & Send to Kitchen',
    payOnline: 'Pay Online (ELQR / MBANK)',
    payElqr: 'Pay via National ELQR',
    orderAccepted: 'Accepted',
    cookingOrder: 'Cooking',
    orderReady: 'Ready for pickup',
    orderServed: 'Served',
    orderReceipt: 'Fiscal Receipt',
  },
};

export const LANGUAGE_LABELS: Record<Language, { label: string; flag: string; short: string }> = {
  ru: { label: 'Русский', flag: '🇷🇺', short: 'РУС' },
  kg: { label: 'Кыргызча', flag: '🇰🇬', short: 'КЫР' },
  en: { label: 'English', flag: '🇬🇧', short: 'ENG' },
};
